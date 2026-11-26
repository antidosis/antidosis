-- Mesh store monetisation groundwork: rentable product slots + featured placement.
-- Free tier: 3 product slots per builder; extraSlots is granted by admin during
-- the pilot and will be incremented by the rental purchase flow later.
-- featuredUntil pins a product to the top of the store floor until that time.

ALTER TABLE "mesh_builders" ADD COLUMN "extra_slots" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mesh_products" ADD COLUMN "featured_until" TIMESTAMP(3);
