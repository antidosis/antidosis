-- Append-only audit trail for contracts. One row per action/state change.
CREATE TABLE "contract_events" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "status_before" TEXT,
    "status_after" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contract_events_contract_id_created_at_idx" ON "contract_events"("contract_id", "created_at");

ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
