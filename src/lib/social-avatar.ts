/**
 * Social profile-picture import.
 *
 * Public social profile pages expose an `og:image` meta tag pointing at the
 * member's current profile picture. We fetch that image server-side and store
 * a copy in our own storage (never hotlink — the remote URL would rot).
 *
 * Platform reality:
 *   • Facebook — og:image is public; works reliably.
 *   • TikTok, YouTube, X, LinkedIn — og:image generally public.
 *   • Instagram — login-walls most profile pages; import usually fails with a
 *     clear error. Best-effort by design.
 *
 * Security: only hosts on the allowlist below are ever fetched (SSRF guard),
 * and only http(s) URLs. Everything else is rejected before any network call.
 */

const ALLOWED_HOSTS = new Set([
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "threads.net",
]);

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const FETCH_TIMEOUT_MS = 8_000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 antidosis-avatar-bot/1.0";

export interface SocialAvatarTarget {
  /** Canonical page URL that will be fetched. */
  pageUrl: string;
  /** Registered domain, for messaging ("facebook.com"). */
  host: string;
}

/**
 * Validate a social profile URL. Returns null when the host is not on the
 * allowlist or the URL is not http(s).
 */
export function parseSocialAvatarTarget(raw: string): SocialAvatarTarget | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
  const registrable = host.split(".").slice(-2).join(".");
  if (!ALLOWED_HOSTS.has(registrable)) return null;

  url.hash = "";
  return { pageUrl: url.toString(), host: registrable };
}

/**
 * Extract the og:image URL from an HTML document. Handles attribute order
 * variation and common HTML entities. Returns null when absent.
 */
export function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) {
      const decoded = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&#x2F;/gi, "/")
        .replace(/&quot;/g, '"')
        .trim();
      if (/^https?:\/\//i.test(decoded)) return decoded;
    }
  }
  return null;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface FetchedImage {
  buffer: ArrayBuffer;
  ext: string;
  bytes: number;
}

/** Fetch an image URL with size and type guards. Throws on failure. */
export async function fetchImage(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<FetchedImage> {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Image fetch failed with ${res.status}`);

  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = EXT_BY_MIME[contentType];
  if (!ext) throw new Error(`Unsupported image type: ${contentType || "unknown"}`);

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("Empty image response");
  if (buffer.byteLength > MAX_AVATAR_BYTES) throw new Error("Image exceeds 5MB limit");

  return { buffer, ext, bytes: buffer.byteLength };
}

/** Fetch a profile page and return its og:image URL. Throws on failure. */
export async function fetchOgImage(
  pageUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const res = await fetchImpl(pageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Profile page returned ${res.status}`);
  const html = await res.text();
  const og = extractOgImage(html);
  if (!og) {
    throw new Error(
      "No public profile picture found — the profile may be private or the platform may require login (Instagram commonly does)"
    );
  }
  return og;
}
