-- Add acceptance_id to contracts to track which acceptance spawned the contract
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "acceptance_id" TEXT;

-- Make acceptance_id unique (one contract per acceptance)
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_acceptance_id_key" ON "contracts"("acceptance_id");

-- Remove unique constraint on need_id to allow multiple contracts per need
DROP INDEX IF EXISTS "contracts_need_id_key";

-- Add regular index on need_id for performance (may already exist from prior db push)
CREATE INDEX IF NOT EXISTS "contracts_need_id_idx" ON "contracts"("need_id");
