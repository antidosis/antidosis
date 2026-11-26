-- Accepted payment/exchange forms for directory listings (JSON array of mode keys).
ALTER TABLE "profiles" ADD COLUMN "accepted_exchanges" TEXT;
