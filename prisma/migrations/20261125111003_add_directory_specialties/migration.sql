-- CreateTable
CREATE TABLE "directory_specialties" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "headline" TEXT,
    "attributes" TEXT,
    "slot" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "directory_specialties_profession_idx" ON "directory_specialties"("profession");

-- CreateIndex
CREATE UNIQUE INDEX "directory_specialties_profile_id_slot_key" ON "directory_specialties"("profile_id", "slot");

-- AddForeignKey
ALTER TABLE "directory_specialties" ADD CONSTRAINT "directory_specialties_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
