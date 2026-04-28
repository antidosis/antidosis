-- AlterTable Contract: add per-party terms, shared optional terms, and message-terms flags
ALTER TABLE "contracts"
ADD COLUMN "party_a_terms" TEXT,
ADD COLUMN "party_b_terms" TEXT,
ADD COLUMN "deadline_terms" TEXT,
ADD COLUMN "completion_method_terms" TEXT,
ADD COLUMN "additional_terms" TEXT,
ADD COLUMN "party_a_use_message_terms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "party_b_use_message_terms" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Review: add private feedback
ALTER TABLE "reviews"
ADD COLUMN "private_feedback" TEXT;
