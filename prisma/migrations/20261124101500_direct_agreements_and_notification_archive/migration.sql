-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "claimed_at" TIMESTAMP(3),
ADD COLUMN     "consideration_type" TEXT,
ADD COLUMN     "consideration_value" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "invite_email" TEXT,
ADD COLUMN     "invite_expires_at" TIMESTAMP(3),
ADD COLUMN     "invite_token_hash" TEXT,
ADD COLUMN     "invited_at" TIMESTAMP(3),
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'exchange',
ADD COLUMN     "title" TEXT,
ALTER COLUMN "need_id" DROP NOT NULL,
ALTER COLUMN "party_b_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_invite_token_hash_key" ON "contracts"("invite_token_hash");

-- CreateIndex
CREATE INDEX "contracts_kind_created_at_idx" ON "contracts"("kind", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_archived_at_created_at_idx" ON "notifications"("user_id", "archived_at", "created_at");
