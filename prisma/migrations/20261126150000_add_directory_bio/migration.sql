-- Directory listings get their own description; the personal profile bio
-- no longer appears on business listings.
ALTER TABLE "profiles" ADD COLUMN "directory_bio" TEXT;
