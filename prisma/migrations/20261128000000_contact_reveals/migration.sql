-- Contact reveal audit: every tap-to-reveal of a phone number, email,
-- website or social link is logged with viewer, target, scope and fields.
-- Doubles as the per-listing reveal analytics source. No FKs by design —
-- audit rows must survive account deletion.
CREATE TABLE "contact_reveals" (
    "id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "fields" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_reveals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_reveals_viewer_id_created_at_idx" ON "contact_reveals"("viewer_id", "created_at");
CREATE INDEX "contact_reveals_target_id_created_at_idx" ON "contact_reveals"("target_id", "created_at");
