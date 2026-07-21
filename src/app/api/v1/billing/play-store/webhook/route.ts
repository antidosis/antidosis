import { type NextRequest, NextResponse } from "next/server";

import { OAuth2Client } from "google-auth-library";

import { logger } from "@/lib/logger";
import { fetchPlaySubscription, isSubscriptionEntitled } from "@/lib/play-store";
import { prisma } from "@/lib/prisma";

/**
 * Google Play Real-time Developer Notifications (RTDN) webhook.
 * Receives Pub/Sub push messages about subscription lifecycle events.
 *
 * Security model:
 * - The push itself is authenticated via the OIDC bearer token Pub/Sub
 *   attaches when the subscription is configured with a push service
 *   account (PLAY_RTDN_PUSH_AUDIENCE must be set; fails closed otherwise).
 * - The notification body is treated purely as a "something changed" hint:
 *   entitlement state is always re-fetched from the Google Play Developer
 *   API before Pro status is mutated, so a forged or replayed body can
 *   never grant or revoke Pro on its own.
 */

// Track processed message IDs to prevent duplicate processing
const processedMessageIds = new Set<string>();
const MAX_PROCESSED_IDS = 1000;

const pushAuthClient = new OAuth2Client();

interface PubSubMessage {
  message: {
    messageId: string;
    publishTime: string;
    data: string; // base64-encoded JSON
    attributes?: Record<string, string>;
  };
  subscription: string;
}

interface SubscriptionNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  testNotification?: {
    version: string;
  };
}

async function verifyPubSubPush(req: NextRequest): Promise<boolean> {
  const audience = process.env.PLAY_RTDN_PUSH_AUDIENCE;
  if (!audience) {
    // Fail closed: without an expected audience we cannot distinguish a
    // genuine Google push from a forgery.
    logger.error("[RTDN] PLAY_RTDN_PUSH_AUDIENCE is not configured; rejecting push");
    return false;
  }

  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return false;
  }

  try {
    const ticket = await pushAuthClient.verifyIdToken({ idToken: token, audience });
    const payload = ticket.getPayload();
    if (!payload) {
      return false;
    }
    const expectedEmail = process.env.PLAY_RTDN_SERVICE_ACCOUNT_EMAIL;
    if (expectedEmail && payload.email !== expectedEmail) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyPubSubPush(req))) {
      logger.warn("[RTDN] Unauthenticated push rejected");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PubSubMessage = await req.json();
    const messageId = body.message?.messageId;

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
    }

    // Idempotency: skip duplicate messages
    if (processedMessageIds.has(messageId)) {
      logger.info("[RTDN] Duplicate message skipped", { messageId });
      return NextResponse.json({ success: true, duplicate: true });
    }

    // Decode Pub/Sub message data
    const decodedData = Buffer.from(body.message.data, "base64").toString("utf-8");
    const notification: SubscriptionNotification = JSON.parse(decodedData);

    logger.info("[RTDN] Received notification", {
      messageId,
      packageName: notification.packageName,
      type: notification.subscriptionNotification?.notificationType,
      subscriptionId: notification.subscriptionNotification?.subscriptionId,
    });

    // Handle test notifications
    if (notification.testNotification) {
      logger.info("[RTDN] Test notification received");
      trackProcessed(messageId);
      return NextResponse.json({ success: true, test: true });
    }

    const subNotification = notification.subscriptionNotification;
    if (!subNotification) {
      trackProcessed(messageId);
      return NextResponse.json({ success: true, noOp: true });
    }

    const { notificationType, purchaseToken, subscriptionId } = subNotification;

    // Find profile by purchase token
    const profile = await prisma.profile.findFirst({
      where: { playStorePurchaseToken: purchaseToken },
    });

    if (!profile) {
      logger.warn("[RTDN] Profile not found for purchase token", {
        purchaseToken: purchaseToken.slice(0, 8) + "...",
        subscriptionId,
      });
      trackProcessed(messageId);
      return NextResponse.json({ success: true, profileFound: false });
    }

    // Never trust the push body for entitlement state: sync from the
    // authoritative Google Play Developer API response instead.
    const subscription = await fetchPlaySubscription(purchaseToken);
    const state = subscription.subscriptionState ?? "SUBSCRIPTION_STATE_UNSPECIFIED";
    const lineItem = subscription.lineItems?.[0];
    const expiresAt = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : null;
    const autoRenewing = lineItem?.autoRenewingPlan?.autoRenewEnabled ?? null;
    const entitled = isSubscriptionEntitled(state, expiresAt);

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        isPro: entitled,
        ...(lineItem?.productId ? { playStoreProductId: lineItem.productId } : {}),
        ...(autoRenewing !== null ? { playStoreAutoRenewing: autoRenewing } : {}),
        ...(expiresAt ? { proExpiresAt: expiresAt } : {}),
      },
    });

    logger.info("[RTDN] Subscription state synced", {
      userId: profile.userId,
      type: notificationType,
      state,
      entitled,
    });

    trackProcessed(messageId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("[RTDN] Webhook processing failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Processing failed", message: error.message },
      { status: 500 }
    );
  }
}

function trackProcessed(messageId: string) {
  processedMessageIds.add(messageId);
  if (processedMessageIds.size > MAX_PROCESSED_IDS) {
    const first = processedMessageIds.values().next().value;
    if (first) processedMessageIds.delete(first);
  }
}
