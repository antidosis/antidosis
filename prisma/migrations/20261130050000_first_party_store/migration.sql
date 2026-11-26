-- First-party mesh store: member IDs, Antidosis-stocked listings, orders

-- Permanent human-facing member ID on every profile
ALTER TABLE "profiles" ADD COLUMN "member_code" TEXT;

-- Backfill existing profiles with unique codes from an unambiguous alphabet
-- (no I, L, O, 0, 1) so codes survive being read out over the phone.
DO $$
DECLARE
  alphabet CONSTANT text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  p RECORD;
  code text;
  i int;
BEGIN
  FOR p IN SELECT id FROM "profiles" WHERE member_code IS NULL LOOP
    LOOP
      code := 'ANT-';
      FOR i IN 1..6 LOOP
        code := code || substr(alphabet, floor(random() * 32 + 1)::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "profiles" WHERE member_code = code);
    END LOOP;
    UPDATE "profiles" SET member_code = code WHERE id = p.id;
  END LOOP;
END $$;

ALTER TABLE "profiles" ALTER COLUMN "member_code" SET NOT NULL;
CREATE UNIQUE INDEX "profiles_member_code_key" ON "profiles"("member_code");

-- First-party stock flags on products
ALTER TABLE "mesh_products"
  ADD COLUMN "sold_by_antidosis" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stock_count" INTEGER;

-- Store orders
CREATE TABLE "mesh_orders" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "order_ref" TEXT NOT NULL,
  "mesh_name" TEXT NOT NULL,
  "delivery_name" TEXT NOT NULL,
  "delivery_address" TEXT NOT NULL,
  "buyer_note" TEXT,
  "price_aud_cents" INTEGER NOT NULL,
  "postage_aud_cents" INTEGER NOT NULL,
  "total_aud_cents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'placed',
  "admin_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "mesh_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mesh_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "mesh_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "mesh_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "mesh_orders_order_ref_key" ON "mesh_orders"("order_ref");
CREATE INDEX "mesh_orders_buyer_id_created_at_idx" ON "mesh_orders"("buyer_id", "created_at");
CREATE INDEX "mesh_orders_status_created_at_idx" ON "mesh_orders"("status", "created_at");
