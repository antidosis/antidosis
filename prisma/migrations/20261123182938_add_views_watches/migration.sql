-- CreateTable
CREATE TABLE "need_views" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "viewer_id" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "need_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "need_watches" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "need_watches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "need_views_need_id_created_at_idx" ON "need_views"("need_id", "created_at");

-- CreateIndex
CREATE INDEX "need_views_need_id_viewer_id_idx" ON "need_views"("need_id", "viewer_id");

-- CreateIndex
CREATE INDEX "need_views_need_id_ip_hash_idx" ON "need_views"("need_id", "ip_hash");

-- CreateIndex
CREATE INDEX "need_watches_user_id_idx" ON "need_watches"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "need_watches_need_id_user_id_key" ON "need_watches"("need_id", "user_id");

-- AddForeignKey
ALTER TABLE "need_views" ADD CONSTRAINT "need_views_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_watches" ADD CONSTRAINT "need_watches_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_watches" ADD CONSTRAINT "need_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
