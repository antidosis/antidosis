/**
 * URL security utilities.
 * Blocks dangerous schemes that could lead to XSS or unexpected behavior.
 */

const BLOCKED_SCHEMES = ["javascript:", "data:", "blob:", "vbscript:", "file:"];

/**
 * Check if a URL string is safe to store and render.
 * Must be a valid URL and use http(s) scheme.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return true; // null/undefined is safe (treated as empty)
  const lower = url.trim().toLowerCase();
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) return false;
  }
  return true;
}

/**
 * Filter a URL to only allow http(s) schemes.
 * Returns null if the URL is unsafe or invalid.
 */
export function sanitizeUrl(
  url: string | null | undefined,
  options: { allowEmpty?: boolean } = {}
): string | null {
  if (!url || url.trim() === "") {
    return options.allowEmpty ? null : null;
  }
  if (!isSafeUrl(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return url.trim();
  } catch {
    return null;
  }
}

/**
 * Validate that an array of strings are all safe URLs.
 */
export function sanitizeUrlArray(urls: string[]): string[] {
  return urls.map((u) => sanitizeUrl(u)).filter(Boolean) as string[];
}
