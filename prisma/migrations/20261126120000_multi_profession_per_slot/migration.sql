-- DropIndex
DROP INDEX "directory_specialties_profile_id_slot_key";

-- CreateIndex
CREATE UNIQUE INDEX "directory_specialties_profile_id_profession_key" ON "directory_specialties"("profile_id", "profession");
