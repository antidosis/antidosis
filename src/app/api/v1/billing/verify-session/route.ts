import { type NextRequest, NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Verify the session exists and was paid with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 402 }
      );
    }

    return NextResponse.json({
      verified: true,
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
  } catch (error: any) {
    logger.error(
      "[API:/api/v1/billing/verify-session]",
      error instanceof Error ? error : undefined
    );
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
}
