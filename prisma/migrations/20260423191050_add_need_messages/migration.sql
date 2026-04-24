-- CreateTable
CREATE TABLE "need_messages" (
    "id" TEXT NOT NULL,
    "need_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "need_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "need_messages" ADD CONSTRAINT "need_messages_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_messages" ADD CONSTRAINT "need_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
