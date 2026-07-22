-- AlterTable
ALTER TABLE "mobile_verification_codes" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "banned_at" TIMESTAMP(3),
ADD COLUMN     "banned_reason" TEXT;
