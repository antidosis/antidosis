import { type NextRequest, NextResponse } from "next/server";

import { GoogleAuth } from "google-auth-library";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.antidosis.app";
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH;

async function getAuthClient() {
  if (!SERVICE_ACCOUNT_KEY_PATH) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH not configured");
  }

  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  return auth.getClient();
}

/**
 * Verify a Play Store subscription purchase token.
 * Mobile app sends the token after Google Play purchase flow completes.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { purchaseToken, productId } = body;

    if (!purchaseToken || typeof purchaseToken !== "string") {
      return NextResponse.json({ error: "Missing purchaseToken" }, { status: 400 });
    }
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify with Google Play Developer API
    const authClient = await getAuthClient();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

    const response = await authClient.request({ url, method: "GET" });
    const subscription = response.data as {
      lineItems?: Array<{
        productId: string;
        expiryTime?: string;
        autoRenewingPlan?: { autoRenewEnabled?: boolean };
      }>;
      subscriptionState?: string;
      linkedPurchaseToken?: string;
    };

    // subscriptionState: 0 = pending, 1 = active, 2 = paused, 3 = expired, 4 = on hold, 5 = in grace period
    const state = parseInt(subscription.subscriptionState || "0", 10);
    const isActive = state === 1 || state === 5; // active or in grace period

    if (!isActive) {
      return NextResponse.json({ error: "Subscription not active", state }, { status: 402 });
    }

    const lineItem = subscription.lineItems?.find((li) => li.productId === productId);
    const expiresAt = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : null;
    const autoRenewing = lineItem?.autoRenewingPlan?.autoRenewEnabled ?? null;

    // Upsert Pro status
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        isPro: true,
        proActivatedAt: profile.proActivatedAt ?? new Date(),
        proSource: "play_store",
        proExpiresAt: expiresAt,
        playStorePurchaseToken: purchaseToken,
        playStoreProductId: productId,
        playStoreAutoRenewing: autoRenewing,
      },
    });

    logger.info("[PlayStore] Subscription verified", {
      userId: user.id,
      productId,
      state,
      expiresAt: expiresAt?.toISOString(),
    });

    return NextResponse.json({
      success: true,
      productId,
      state,
      expiresAt: expiresAt?.toISOString() ?? null,
      autoRenewing,
    });
  } catch (error: any) {
    logger.error("[PlayStore] Verification failed", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Verification failed", message: error.message },
      { status: 500 }
    );
  }
}
