-- Add cancellation request fields to contracts
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "cancel_requested_by_id" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "cancel_requested_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "cancel_response" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "cancel_response_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "cancel_escalated_at" TIMESTAMP(3);
