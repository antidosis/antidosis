-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "play_store_auto_renewing" BOOLEAN,
ADD COLUMN     "play_store_product_id" TEXT,
ADD COLUMN     "play_store_purchase_token" TEXT;
