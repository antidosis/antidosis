-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "handle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_handle_key" ON "profiles"("handle");
