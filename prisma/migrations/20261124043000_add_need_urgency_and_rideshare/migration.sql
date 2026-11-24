ALTER TABLE "needs"
  ADD COLUMN "urgency" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "destination_name" TEXT,
  ADD COLUMN "allow_urgent_contact" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "needs"
  ADD CONSTRAINT "needs_urgency_range" CHECK ("urgency" BETWEEN 0 AND 9);

CREATE INDEX "needs_status_urgency_created_at_idx"
  ON "needs"("status", "urgency" DESC, "created_at" DESC);
