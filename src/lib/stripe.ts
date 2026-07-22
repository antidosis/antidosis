import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazily created Stripe client. Billing is parked while Pro is free, so this
 * must stay safe to import in builds and environments without
 * STRIPE_SECRET_KEY configured.
 */
export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return cached;
}
