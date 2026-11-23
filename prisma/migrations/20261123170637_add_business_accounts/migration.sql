-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "abn_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "account_type" TEXT NOT NULL DEFAULT 'individual';

-- CreateIndex
CREATE INDEX "profiles_account_type_idx" ON "profiles"("account_type");
