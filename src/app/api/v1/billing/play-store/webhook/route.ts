import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

/**
 * Google Play Real-time Developer Notifications (RTDN) webhook.
 * Receives Pub/Sub push messages about subscription lifecycle events.
 *
 * Subscription notification types:
 * - SUBSCRIPTION_RECOVERED (1)
 * - SUBSCRIPTION_RENEWED (2)
 * - SUBSCRIPTION_CANCELED (3)
 * - SUBSCRIPTION_PURCHASED (4)
 * - SUBSCRIPTION_ON_HOLD (5)
 * - SUBSCRIPTION_IN_GRACE_PERIOD (6)
 * - SUBSCRIPTION_RESTARTED (7)
 * - SUBSCRIPTION_PRICE_CHANGE_CONFIRMED (8)
 * - SUBSCRIPTION_DEFERRED (9)
 * - SUBSCRIPTION_PAUSED (10)
 * - SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED (11)
 * - SUBSCRIPTION_REVOKED (12)
 * - SUBSCRIPTION_EXPIRED (13)
 */

// Track processed message IDs to prevent duplicate processing
const processedMessageIds = new Set<string>();
const MAX_PROCESSED_IDS = 1000;

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

export async function POST(req: NextRequest) {
  try {
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

    // Process based on notification type
    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
      case 2: // SUBSCRIPTION_RENEWED
      case 4: // SUBSCRIPTION_PURCHASED
      case 7: // SUBSCRIPTION_RESTARTED
      case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            isPro: true,
            playStoreProductId: subscriptionId,
            playStoreAutoRenewing: true,
          },
        });
        logger.info("[RTDN] Pro activated/renewed", {
          userId: profile.userId,
          type: notificationType,
        });
        break;

      case 3: // SUBSCRIPTION_CANCELED
        // User cancelled but may still have access until expiry
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            playStoreAutoRenewing: false,
          },
        });
        logger.info("[RTDN] Subscription cancelled (auto-renew off)", {
          userId: profile.userId,
        });
        break;

      case 5: // SUBSCRIPTION_ON_HOLD
      case 10: // SUBSCRIPTION_PAUSED
      case 12: // SUBSCRIPTION_REVOKED
      case 13: // SUBSCRIPTION_EXPIRED
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            isPro: false,
            playStoreAutoRenewing: false,
            proExpiresAt: new Date(),
          },
        });
        logger.info("[RTDN] Pro deactivated", {
          userId: profile.userId,
          type: notificationType,
        });
        break;

      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        // Keep Pro active during grace period
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            isPro: true,
            playStoreAutoRenewing: true,
          },
        });
        logger.info("[RTDN] Subscription in grace period", {
          userId: profile.userId,
        });
        break;

      case 9: // SUBSCRIPTION_DEFERRED
      case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
        // No action needed
        logger.info("[RTDN] No-op notification type", {
          userId: profile.userId,
          type: notificationType,
        });
        break;

      default:
        logger.warn("[RTDN] Unknown notification type", {
          type: notificationType,
          userId: profile.userId,
        });
    }

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
