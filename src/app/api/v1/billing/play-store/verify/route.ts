import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { fetchPlaySubscription, isSubscriptionEntitled } from "@/lib/play-store";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

    // Verify with the Google Play Developer API (authoritative state)
    const subscription = await fetchPlaySubscription(purchaseToken);
    const state = subscription.subscriptionState ?? "SUBSCRIPTION_STATE_UNSPECIFIED";

    const lineItem = subscription.lineItems?.find((li) => li.productId === productId);
    const expiresAt = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : null;
    const autoRenewing = lineItem?.autoRenewingPlan?.autoRenewEnabled ?? null;
    const isActive = isSubscriptionEntitled(state, expiresAt);

    if (!isActive) {
      return NextResponse.json({ error: "Subscription not active", state }, { status: 402 });
    }

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
