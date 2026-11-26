-- CreateTable
CREATE TABLE "mesh_interests" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "suburb" TEXT,
    "device_model" TEXT,
    "business_name" TEXT,
    "message" TEXT,
    "profile_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesh_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesh_interests_email_kind_key" ON "mesh_interests"("email", "kind");

-- CreateIndex
CREATE INDEX "mesh_interests_status_created_at_idx" ON "mesh_interests"("status", "created_at");

-- CreateIndex
CREATE INDEX "mesh_interests_kind_created_at_idx" ON "mesh_interests"("kind", "created_at");

-- AddForeignKey
ALTER TABLE "mesh_interests" ADD CONSTRAINT "mesh_interests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
