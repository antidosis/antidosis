/**
 * Profile link policy.
 * Beyond scheme safety (see url.ts), profile and listing links must be real
 * destinations a visitor can judge — not shorteners that hide the target, or
 * file hosts that hand you a download. Applies to personal social links and
 * business web presence alike.
 */

export type LinkAssessment = { ok: true } | { ok: false; reason: string };

/** Hosts that obscure the destination or deliver files rather than pages. */
const BLOCKED_HOSTS: { pattern: RegExp; label: string }[] = [
  // URL shorteners — the visitor can't see where they're going
  { pattern: /(^|\.)bit\.ly$/, label: "link shorteners" },
  { pattern: /(^|\.)tinyurl\.com$/, label: "link shorteners" },
  { pattern: /(^|\.)t\.co$/, label: "link shorteners" },
  { pattern: /(^|\.)goo\.gl$/, label: "link shorteners" },
  { pattern: /(^|\.)is\.gd$/, label: "link shorteners" },
  { pattern: /(^|\.)buff\.ly$/, label: "link shorteners" },
  { pattern: /(^|\.)ow\.ly$/, label: "link shorteners" },
  { pattern: /(^|\.)tiny\.cc$/, label: "link shorteners" },
  { pattern: /(^|\.)cutt\.ly$/, label: "link shorteners" },
  { pattern: /(^|\.)rebrand\.ly$/, label: "link shorteners" },
  { pattern: /(^|\.)rb\.gy$/, label: "link shorteners" },
  { pattern: /(^|\.)shorturl\.at$/, label: "link shorteners" },
  // File hosts / transfer services — profiles link pages, not downloads
  { pattern: /(^|\.)dropbox\.com$/, label: "file hosting" },
  { pattern: /(^|\.)dropboxusercontent\.com$/, label: "file hosting" },
  { pattern: /(^|\.)drive\.google\.com$/, label: "file hosting" },
  { pattern: /(^|\.)docs\.google\.com$/, label: "file hosting" },
  { pattern: /(^|\.)mega\.nz$/, label: "file hosting" },
  { pattern: /(^|\.)mediafire\.com$/, label: "file hosting" },
  { pattern: /(^|\.)wetransfer\.com$/, label: "file hosting" },
  { pattern: /(^|\.)we\.tl$/, label: "file hosting" },
  { pattern: /(^|\.)box\.com$/, label: "file hosting" },
  { pattern: /(^|\.)onedrive\.live\.com$/, label: "file hosting" },
  { pattern: /(^|\.)1drv\.ms$/, label: "file hosting" },
  { pattern: /(^|\.)pixeldrain\.net$/, label: "file hosting" },
  { pattern: /(^|\.)catbox\.moe$/, label: "file hosting" },
  { pattern: /(^|\.)file\.io$/, label: "file hosting" },
  { pattern: /(^|\.)sendspace\.com$/, label: "file hosting" },
  // Paste/drop sites — classic phishing payload delivery
  { pattern: /(^|\.)pastebin\.com$/, label: "paste sites" },
  { pattern: /(^|\.)controlc\.com$/, label: "paste sites" },
];

const IP_HOST = /^(\d{1,3}\.){3}\d{1,3}$/;

/**
 * Assess a profile/listing URL. Returns ok:false with a human reason when the
 * link class is not allowed on profiles. Scheme-level safety is handled by
 * sanitizeUrl — this layer judges destination classes.
 */
export function assessProfileLink(rawUrl: string): LinkAssessment {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "that link isn't a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "only http(s) links are allowed" };
  }
  // Credentials embedded in a link (https://user:pass@host) are a phishing tell.
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "links with embedded login details aren't allowed" };
  }
  const host = parsed.hostname.toLowerCase();
  if (IP_HOST.test(host)) {
    return { ok: false, reason: "raw IP address links aren't allowed — use your site's domain" };
  }
  for (const { pattern, label } of BLOCKED_HOSTS) {
    if (pattern.test(host)) {
      return {
        ok: false,
        reason: `links to ${label} aren't allowed on profiles — use the full address of your page (for example https://instagram.com/you)`,
      };
    }
  }
  return { ok: true };
}

/** Hostname for plain-text display next to a link chip — visitors see the
 *  destination before they click it. */
export function displayHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}
