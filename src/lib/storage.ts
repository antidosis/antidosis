import { createServiceClient } from "./supabase/service";

const BUCKET_NAME = "uploads";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extract the storage object path from a Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/abc.jpg"
 *      → "credentials/123/abc.jpg"
 */
function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    // Path will be like: /storage/v1/object/public/uploads/credentials/123/abc.jpg
    const pathParts = url.pathname.split("/");
    // Find the bucket name in the path
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex === -1) return null;
    // Everything after the bucket name is the object path
    return pathParts.slice(bucketIndex + 1).join("/");
  } catch {
    return null;
  }
}

/**
 * Generate a signed URL for a private Supabase storage object.
 * Returns null if the publicUrl is invalid or the object doesn't exist.
 */
export async function createSignedUrl(
  publicUrl: string | null | undefined
): Promise<string | null> {
  const path = extractStoragePath(publicUrl);
  if (!path) return null;

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Generate signed URLs for both front and back of a credential.
 */
export async function createCredentialSignedUrls(credential: {
  fileUrl?: string | null;
  backFileUrl?: string | null;
}): Promise<{ signedUrl: string | null; signedBackUrl: string | null }> {
  const [signedUrl, signedBackUrl] = await Promise.all([
    createSignedUrl(credential.fileUrl),
    createSignedUrl(credential.backFileUrl),
  ]);

  return { signedUrl, signedBackUrl };
}
