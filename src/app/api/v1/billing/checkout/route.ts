import { type NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.isVerified) {
      return NextResponse.json(
        { error: "Identity verification required", code: "IDENTITY_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    if (!profile.mobileVerified) {
      return NextResponse.json(
        { error: "Mobile verification required", code: "MOBILE_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    // Rate limit: 5 checkout attempts per hour per user
    const limit = await rateLimit(getRateLimitIdentifier(req, user.id), {
      windowMs: 60 * 60_000,
      maxRequests: 5,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Get or create Stripe customer
    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile.email,
        name: profile.fullName || undefined,
        metadata: {
          userId: user.id,
          profileId: profile.id,
        },
      });
      customerId = customer.id;
      await prisma.profile.update({
        where: { id: profile.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price ID not configured" }, { status: 500 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
      metadata: {
        userId: user.id,
        profileId: profile.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error("Checkout failed", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
