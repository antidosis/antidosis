import { type NextRequest, NextResponse } from "next/server";

import type Stripe from "stripe";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      logger.error("Webhook signature verification failed", err instanceof Error ? err : undefined);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const profileId = session.metadata?.profileId;

        if (profileId) {
          await prisma.profile.update({
            where: { id: profileId },
            data: {
              isPro: true,
              stripeSubscriptionId: session.subscription as string,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const profile = await prisma.profile.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (profile) {
          await prisma.profile.update({
            where: { id: profile.id },
            data: {
              isPro: false,
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status === "canceled" || subscription.status === "unpaid") {
          const customerId = subscription.customer as string;
          const profile = await prisma.profile.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (profile) {
            await prisma.profile.update({
              where: { id: profile.id },
              data: {
                isPro: false,
                stripeSubscriptionId: null,
              },
            });
          }
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook processing failed", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
