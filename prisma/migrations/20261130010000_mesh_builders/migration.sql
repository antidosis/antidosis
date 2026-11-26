-- CreateTable
CREATE TABLE "mesh_builders" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "suburb" TEXT,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesh_builders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesh_products" (
    "id" TEXT NOT NULL,
    "builder_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specs" TEXT,
    "price_aud_cents" INTEGER,
    "stock_status" TEXT NOT NULL DEFAULT 'in_stock',
    "buy_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesh_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesh_builders_profile_id_key" ON "mesh_builders"("profile_id");

-- CreateIndex
CREATE INDEX "mesh_builders_status_created_at_idx" ON "mesh_builders"("status", "created_at");

-- CreateIndex
CREATE INDEX "mesh_products_builder_id_idx" ON "mesh_products"("builder_id");

-- AddForeignKey
ALTER TABLE "mesh_builders" ADD CONSTRAINT "mesh_builders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesh_products" ADD CONSTRAINT "mesh_products_builder_id_fkey" FOREIGN KEY ("builder_id") REFERENCES "mesh_builders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
