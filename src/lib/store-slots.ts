/**
 * Mesh-store product slots. Every builder gets FREE_PRODUCT_SLOTS on the
 * shelf; beyond that, slots are rented (during the pilot, granted manually
 * by admin via MeshBuilder.extraSlots). Featured placement is rented by
 * time via MeshProduct.featuredUntil. No charges during the pilot.
 */
export const FREE_PRODUCT_SLOTS = 3;

/** Absolute ceiling regardless of granted slots — abuse guard. */
export const MAX_PRODUCT_SLOTS = 60;

export function productSlotLimit(builder: { extraSlots: number }): number {
  return Math.min(FREE_PRODUCT_SLOTS + Math.max(0, builder.extraSlots), MAX_PRODUCT_SLOTS);
}

/** A product is featured while its rental window is still open. */
export function isFeatured(featuredUntil: Date | null, now = new Date()): boolean {
  return featuredUntil !== null && featuredUntil.getTime() > now.getTime();
}
