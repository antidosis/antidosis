-- CreateTable
CREATE TABLE "mesh_identities" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "identity_type" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "mesh_name" TEXT NOT NULL,
    "order_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "mesh_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mesh_identities_profile_id_status_idx" ON "mesh_identities"("profile_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mesh_identities_identity_type_public_key_key" ON "mesh_identities"("identity_type", "public_key");

-- AddForeignKey
ALTER TABLE "mesh_identities" ADD CONSTRAINT "mesh_identities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesh_identities" ADD CONSTRAINT "mesh_identities_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "mesh_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

