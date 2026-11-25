-- AlterTable
ALTER TABLE "support_requests" ADD COLUMN "reference" TEXT NOT NULL DEFAULT '',
ADD COLUMN "response" TEXT,
ADD COLUMN "responded_at" TIMESTAMP(3);

-- Backfill ticket references from the row id (no rows in production yet, but
-- keep the unique constraint honest for any local data).
UPDATE "support_requests"
SET "reference" = 'SUP-' || upper(substr(replace("id"::text, '-', ''), 1, 8))
WHERE "reference" = '';

-- CreateIndex
CREATE UNIQUE INDEX "support_requests_reference_key" ON "support_requests"("reference");
