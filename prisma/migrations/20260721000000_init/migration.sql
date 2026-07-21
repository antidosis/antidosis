-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "location_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "public_phone" TEXT,
    "private_phone" TEXT,
    "mobile" TEXT,
    "mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_pro" BOOLEAN NOT NULL DEFAULT false,
    "pro_activated_at" TIMESTAMP(3),
    "pro_source" TEXT,
    "pro_expires_at" TIMESTAMP(3),
    "show_in_directory" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "play_store_purchase_token" TEXT,
    "play_store_product_id" TEXT,
    "play_store_auto_renewing" BOOLEAN,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "jobs_completed" INTEGER NOT NULL DEFAULT 0,
    "abn" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "proof_url" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs" (
    "id" TEXT NOT NULL,
    "poster_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "need_category" TEXT,
    "offer_type" TEXT NOT NULL,
    "offer_description" TEXT NOT NULL,
    "offer_value" DOUBLE PRECISION,
    "is_local" BOOLEAN NOT NULL DEFAULT true,
    "location_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'open',
    "requires_contract" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "time_range" TEXT,
    "images" TEXT[],
    "offer_images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "need_skills" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "need_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acceptances" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "poster_marked_complete" BOOLEAN NOT NULL DEFAULT false,
    "fulfiller_marked_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "acceptance_id" TEXT,
    "party_a_id" TEXT NOT NULL,
    "party_b_id" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "party_a_terms" TEXT,
    "party_b_terms" TEXT,
    "deadline_terms" TEXT,
    "completion_method_terms" TEXT,
    "additional_terms" TEXT,
    "party_a_use_message_terms" BOOLEAN NOT NULL DEFAULT false,
    "party_b_use_message_terms" BOOLEAN NOT NULL DEFAULT false,
    "negotiation_messages" JSONB,
    "pdf_url" TEXT,
    "party_a_submitted_at" TIMESTAMP(3),
    "party_b_submitted_at" TIMESTAMP(3),
    "party_a_agreed_at" TIMESTAMP(3),
    "party_b_agreed_at" TIMESTAMP(3),
    "terms_locked_at" TIMESTAMP(3),
    "party_a_signed_at" TIMESTAMP(3),
    "party_b_signed_at" TIMESTAMP(3),
    "party_a_signature" TEXT,
    "party_b_signature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "a_marked_complete" BOOLEAN NOT NULL DEFAULT false,
    "b_marked_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" TEXT,
    "cancel_reason" TEXT,
    "cancel_requested_by_id" TEXT,
    "cancel_requested_at" TIMESTAMP(3),
    "cancel_response" TEXT,
    "cancel_response_at" TIMESTAMP(3),
    "cancel_escalated_at" TIMESTAMP(3),
    "last_sign_reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "need_messages" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "acceptance_id" TEXT,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "need_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT,
    "acceptance_id" TEXT,
    "giver_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "private_feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sub_type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "document_number" TEXT,
    "issued_by" TEXT,
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "file_url" TEXT,
    "back_file_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_verification_codes" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminal_channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'public',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminal_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminal_messages" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminal_message_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminal_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_message_threads" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB DEFAULT '[]',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_message_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_mobile_key" ON "profiles"("mobile");

-- CreateIndex
CREATE INDEX "profiles_is_pro_idx" ON "profiles"("is_pro");

-- CreateIndex
CREATE INDEX "profiles_stripe_customer_id_idx" ON "profiles"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "needs_status_created_at_idx" ON "needs"("status", "created_at");

-- CreateIndex
CREATE INDEX "needs_poster_id_idx" ON "needs"("poster_id");

-- CreateIndex
CREATE INDEX "needs_need_category_idx" ON "needs"("need_category");

-- CreateIndex
CREATE INDEX "need_skills_need_id_name_idx" ON "need_skills"("need_id", "name");

-- CreateIndex
CREATE INDEX "acceptances_need_id_idx" ON "acceptances"("need_id");

-- CreateIndex
CREATE INDEX "acceptances_user_id_idx" ON "acceptances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_acceptance_id_key" ON "contracts"("acceptance_id");

-- CreateIndex
CREATE INDEX "contracts_need_id_idx" ON "contracts"("need_id");

-- CreateIndex
CREATE INDEX "contracts_party_a_id_idx" ON "contracts"("party_a_id");

-- CreateIndex
CREATE INDEX "contracts_party_b_id_idx" ON "contracts"("party_b_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "need_messages_need_id_idx" ON "need_messages"("need_id");

-- CreateIndex
CREATE INDEX "need_messages_need_id_created_at_idx" ON "need_messages"("need_id", "created_at");

-- CreateIndex
CREATE INDEX "need_messages_sender_id_idx" ON "need_messages"("sender_id");

-- CreateIndex
CREATE INDEX "need_messages_acceptance_id_idx" ON "need_messages"("acceptance_id");

-- CreateIndex
CREATE INDEX "messages_contract_id_idx" ON "messages"("contract_id");

-- CreateIndex
CREATE INDEX "messages_contract_id_created_at_idx" ON "messages"("contract_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "reviews_receiver_id_idx" ON "reviews"("receiver_id");

-- CreateIndex
CREATE INDEX "reviews_contract_id_idx" ON "reviews"("contract_id");

-- CreateIndex
CREATE INDEX "reviews_acceptance_id_idx" ON "reviews"("acceptance_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_contract_id_giver_id_key" ON "reviews"("contract_id", "giver_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_acceptance_id_giver_id_key" ON "reviews"("acceptance_id", "giver_id");

-- CreateIndex
CREATE INDEX "credentials_profile_id_idx" ON "credentials"("profile_id");

-- CreateIndex
CREATE INDEX "credentials_profile_id_is_public_idx" ON "credentials"("profile_id", "is_public");

-- CreateIndex
CREATE INDEX "credentials_is_verified_idx" ON "credentials"("is_verified");

-- CreateIndex
CREATE INDEX "credentials_type_idx" ON "credentials"("type");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "mobile_verification_codes_mobile_idx" ON "mobile_verification_codes"("mobile");

-- CreateIndex
CREATE INDEX "mobile_verification_codes_profile_id_idx" ON "mobile_verification_codes"("profile_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_event_idx" ON "audit_logs"("event");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "terminal_channels_name_key" ON "terminal_channels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "terminal_channels_slug_key" ON "terminal_channels"("slug");

-- CreateIndex
CREATE INDEX "terminal_channels_type_idx" ON "terminal_channels"("type");

-- CreateIndex
CREATE INDEX "terminal_channels_order_idx" ON "terminal_channels"("order");

-- CreateIndex
CREATE INDEX "terminal_messages_channel_id_idx" ON "terminal_messages"("channel_id");

-- CreateIndex
CREATE INDEX "terminal_messages_channel_id_created_at_idx" ON "terminal_messages"("channel_id", "created_at");

-- CreateIndex
CREATE INDEX "terminal_messages_sender_id_idx" ON "terminal_messages"("sender_id");

-- CreateIndex
CREATE INDEX "terminal_message_reactions_message_id_idx" ON "terminal_message_reactions"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "terminal_message_reactions_message_id_user_id_emoji_key" ON "terminal_message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "direct_message_threads_user_a_id_idx" ON "direct_message_threads"("user_a_id");

-- CreateIndex
CREATE INDEX "direct_message_threads_user_b_id_idx" ON "direct_message_threads"("user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_message_threads_user_a_id_user_b_id_key" ON "direct_message_threads"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "direct_messages_thread_id_idx" ON "direct_messages"("thread_id");

-- CreateIndex
CREATE INDEX "direct_messages_thread_id_created_at_idx" ON "direct_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "direct_messages_sender_id_idx" ON "direct_messages"("sender_id");

-- CreateIndex
CREATE INDEX "direct_message_reactions_message_id_idx" ON "direct_message_reactions"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_message_reactions_message_id_user_id_emoji_key" ON "direct_message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "blocks_blocked_id_idx" ON "blocks"("blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_blocker_id_blocked_id_key" ON "blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "friends_user_b_id_idx" ON "friends"("user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "friends_user_a_id_user_b_id_key" ON "friends"("user_a_id", "user_b_id");

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_skills" ADD CONSTRAINT "need_skills_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptances" ADD CONSTRAINT "acceptances_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptances" ADD CONSTRAINT "acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_party_a_id_fkey" FOREIGN KEY ("party_a_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_party_b_id_fkey" FOREIGN KEY ("party_b_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_messages" ADD CONSTRAINT "need_messages_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_messages" ADD CONSTRAINT "need_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_messages" ADD CONSTRAINT "need_messages_acceptance_id_fkey" FOREIGN KEY ("acceptance_id") REFERENCES "acceptances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_acceptance_id_fkey" FOREIGN KEY ("acceptance_id") REFERENCES "acceptances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_giver_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminal_messages" ADD CONSTRAINT "terminal_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "terminal_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminal_messages" ADD CONSTRAINT "terminal_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminal_message_reactions" ADD CONSTRAINT "terminal_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "terminal_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message_threads" ADD CONSTRAINT "direct_message_threads_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message_threads" ADD CONSTRAINT "direct_message_threads_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "direct_message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message_reactions" ADD CONSTRAINT "direct_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

