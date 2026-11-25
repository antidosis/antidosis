-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "business_social_links" TEXT;

-- AlterTable
ALTER TABLE "support_requests" ALTER COLUMN "reference" DROP DEFAULT;
