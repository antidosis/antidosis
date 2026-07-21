-- Add performance indexes for frequently queried columns

-- Need: public feed filtering + poster lookups
CREATE INDEX IF NOT EXISTS "needs_status_created_at_idx" ON "needs"("status", "created_at");
CREATE INDEX IF NOT EXISTS "needs_poster_id_idx" ON "needs"("poster_id");

-- NeedSkill: skill filtering
CREATE INDEX IF NOT EXISTS "need_skills_need_id_name_idx" ON "need_skills"("need_id", "name");

-- Review: receiver ratings + contract lookups
CREATE INDEX IF NOT EXISTS "reviews_receiver_id_idx" ON "reviews"("receiver_id");
CREATE INDEX IF NOT EXISTS "reviews_contract_id_idx" ON "reviews"("contract_id");

-- Credential: public profile + admin pending
CREATE INDEX IF NOT EXISTS "credentials_profile_id_is_public_idx" ON "credentials"("profile_id", "is_public");
CREATE INDEX IF NOT EXISTS "credentials_is_verified_idx" ON "credentials"("is_verified");

-- NeedMessage: message lists sorted by time
CREATE INDEX IF NOT EXISTS "need_messages_need_id_created_at_idx" ON "need_messages"("need_id", "created_at");

-- Message: contract message lists sorted by time
CREATE INDEX IF NOT EXISTS "messages_contract_id_created_at_idx" ON "messages"("contract_id", "created_at");

-- Profile: pro directory + stripe webhook
CREATE INDEX IF NOT EXISTS "profiles_is_pro_idx" ON "profiles"("is_pro");
CREATE INDEX IF NOT EXISTS "profiles_stripe_customer_id_idx" ON "profiles"("stripe_customer_id");
