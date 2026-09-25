-- CreateTable
CREATE TABLE "banned_mobiles" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "reason" TEXT,
    "banned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banned_mobiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banned_mobiles_mobile_key" ON "banned_mobiles"("mobile");

-- CreateIndex
CREATE INDEX "banned_mobiles_profile_id_idx" ON "banned_mobiles"("profile_id");
