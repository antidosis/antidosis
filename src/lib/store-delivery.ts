import type { MeshPaymentTerm } from "@/lib/schemas/store";

/** The delivery/payment shape shared by store API responses and the UI. */
export interface MeshListingTerms {
  offerPostage: boolean;
  postageAudCents: number | null;
  localPickup: boolean;
  postageNote?: string | null;
  paymentTerms: string[];
  paymentNote?: string | null;
}

export const PAYMENT_TERM_LABEL: Record<MeshPaymentTerm, string> = {
  bank_transfer: "Bank transfer",
  payid: "PayID",
  cash_on_pickup: "Cash on pickup",
  card_checkout: "Card via checkout",
};

export function paymentTermLabel(term: string): string {
  return PAYMENT_TERM_LABEL[term as MeshPaymentTerm] ?? term;
}

export function formatPostage(cents: number | null): string {
  if (cents === null) return "worked out in chat";
  if (cents === 0) return "free";
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * One-line delivery summary for cards and the product page, e.g.
 * "Postage AU$12 · Pickup Noraville" / "Free postage" / "Pickup only".
 */
export function deliverySummary(terms: MeshListingTerms, pickupSuburb?: string | null): string {
  const parts: string[] = [];
  if (terms.offerPostage) {
    parts.push(
      terms.postageAudCents === 0
        ? "Free postage"
        : `Postage ${formatPostage(terms.postageAudCents)}`
    );
  }
  if (terms.localPickup) {
    parts.push(pickupSuburb ? `Pickup ${pickupSuburb}` : "Local pickup");
  }
  return parts.length > 0 ? parts.join(" · ") : "Delivery arranged in chat";
}

/** Postage line for the product page delivery panel. */
export function postageLine(terms: MeshListingTerms): string | null {
  if (!terms.offerPostage) return null;
  if (terms.postageAudCents === null) return "Postage worked out with you in chat before you pay";
  if (terms.postageAudCents === 0) return "Free postage, Australia-wide";
  return `Flat postage ${formatPostage(terms.postageAudCents)} Australia-wide`;
}
