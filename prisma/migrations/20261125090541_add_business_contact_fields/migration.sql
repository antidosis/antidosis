-- DropIndex
DROP INDEX "needs_status_urgency_created_at_idx";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "business_email" TEXT,
ADD COLUMN     "business_phone" TEXT;
