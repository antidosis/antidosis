-- Add requiresContract flag to needs
ALTER TABLE "needs" ADD COLUMN IF NOT EXISTS "requires_contract" BOOLEAN NOT NULL DEFAULT false;
