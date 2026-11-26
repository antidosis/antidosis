-- AlterTable
ALTER TABLE "needs" ADD COLUMN     "posted_as" TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN     "poster_abn" TEXT,
ADD COLUMN     "poster_business_name" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "business_rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "business_rating_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "receiver_context" TEXT NOT NULL DEFAULT 'personal';

