import { createServiceClient } from "./supabase/service";

/**
 * Two-bucket storage model:
 * - `uploads` (public): listing images, avatars, audio — meant to be public.
 * - `uploads-private` (no public access): identity documents (credentials/*)
 *   and signed contract PDFs (contracts/*) — served only through short-lived
 *   signed URLs generated after server-side ownership/admin checks.
 *
 * Stored file URLs keep the public-URL *shape* as a stable identifier; access
 * is always via createSignedUrl. During the bucket migration window, signing
 * fails for not-yet-moved objects and callers fall back to the stored URL.
 */
export const PUBLIC_BUCKET = "uploads";
export const PRIVATE_BUCKET = "uploads-private";

/** Top-level folders whose objects belong in the private bucket. */
const PRIVATE_FOLDERS = ["credentials", "contracts"];

const SIGNED_URL_EXPIRY = 3600; // 1 hour

export function isPrivatePath(path: string): boolean {
  return PRIVATE_FOLDERS.some((f) => path === f || path.startsWith(`${f}/`));
}

/** The bucket an object path belongs to. */
export function bucketForPath(path: string): string {
  return isPrivatePath(path) ? PRIVATE_BUCKET : PUBLIC_BUCKET;
}

/**
 * Extract the storage object path from a stored URL or pass through a raw
 * object path.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/uploads/credentials/123/abc.jpg"
 *      → "credentials/123/abc.jpg"
 */
export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  if (!/^https?:\/\//i.test(publicUrl)) {
    // Already an object path
    return publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  }
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.findIndex((p) => p === PUBLIC_BUCKET || p === PRIVATE_BUCKET);
    if (bucketIndex === -1) return null;
    return pathParts.slice(bucketIndex + 1).join("/");
  } catch {
    return null;
  }
}

/**
 * Generate a signed URL for a storage object. Returns null if the reference
 * is invalid or the object isn't in its bucket yet (e.g. pre-migration).
 */
export async function createSignedUrl(
  publicUrl: string | null | undefined
): Promise<string | null> {
  const path = extractStoragePath(publicUrl);
  if (!path) return null;

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.storage
    .from(bucketForPath(path))
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Signed URL when possible, otherwise the stored URL unchanged — keeps
 * pre-migration objects working until the bucket move completes.
 */
export async function createSignedUrlOrFallback(
  publicUrl: string | null | undefined
): Promise<string | null> {
  if (!publicUrl) return null;
  const signed = await createSignedUrl(publicUrl);
  return signed ?? publicUrl;
}

/**
 * Generate signed URLs for both front and back of a credential.
 */
export async function createCredentialSignedUrls(credential: {
  fileUrl?: string | null;
  backFileUrl?: string | null;
}): Promise<{ signedUrl: string | null; signedBackUrl: string | null }> {
  const [signedUrl, signedBackUrl] = await Promise.all([
    createSignedUrlOrFallback(credential.fileUrl),
    createSignedUrlOrFallback(credential.backFileUrl),
  ]);

  return { signedUrl, signedBackUrl };
}
