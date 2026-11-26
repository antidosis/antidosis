-- Mesh store: per-listing delivery and payment terms
ALTER TABLE "mesh_products"
  ADD COLUMN "offer_postage" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "postage_aud_cents" INTEGER,
  ADD COLUMN "local_pickup" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "postage_note" TEXT,
  ADD COLUMN "payment_terms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "payment_note" TEXT;
