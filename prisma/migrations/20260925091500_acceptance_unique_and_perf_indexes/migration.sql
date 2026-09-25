-- Deduplicate acceptances (keep the earliest row per need/user pair)
-- before adding the uniqueness constraint.
DELETE FROM "acceptances" a
USING "acceptances" b
WHERE a."need_id" = b."need_id"
  AND a."user_id" = b."user_id"
  AND (a."created_at", a."id") > (b."created_at", b."id");

-- Unique constraint: one acceptance per user per need
CREATE UNIQUE INDEX "acceptances_need_id_user_id_key" ON "acceptances"("need_id", "user_id");

-- Query-hot indexes
CREATE INDEX "profiles_show_in_directory_idx" ON "profiles"("show_in_directory");
CREATE INDEX "profiles_last_seen_at_idx" ON "profiles"("last_seen_at");
CREATE INDEX "need_messages_need_id_sender_id_is_read_idx" ON "need_messages"("need_id", "sender_id", "is_read");
CREATE INDEX "messages_contract_id_sender_id_is_read_idx" ON "messages"("contract_id", "sender_id", "is_read");
CREATE INDEX "mobile_verification_codes_expires_at_idx" ON "mobile_verification_codes"("expires_at");
