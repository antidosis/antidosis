/**
 * The directory listing's own web presence — stored as a JSON array on the
 * profile (`business_social_links`), fully independent from the personal
 * `socialLinks` relation so a member's private accounts never leak onto
 * their business card and vice versa.
 */
export interface BusinessSocialLink {
  platform: string;
  url: string;
}

const PLATFORM_MAX = 40;
const URL_MAX = 500;

/** Parse the stored JSON blob defensively — anything malformed yields []. */
export function parseBusinessSocialLinks(raw: string | null | undefined): BusinessSocialLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const links: BusinessSocialLink[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const { platform, url } = item as Record<string, unknown>;
      if (typeof platform !== "string" || typeof url !== "string") continue;
      const cleanPlatform = platform.trim().slice(0, PLATFORM_MAX);
      const cleanUrl = url.trim().slice(0, URL_MAX);
      if (cleanPlatform && cleanUrl) links.push({ platform: cleanPlatform, url: cleanUrl });
    }
    return links.slice(0, 20);
  } catch {
    return [];
  }
}

/** Serialise client input for storage; drops empty rows. */
export function serializeBusinessSocialLinks(links: { platform: string; url: string }[]): string {
  const cleaned = links
    .map((link) => ({
      platform: String(link.platform ?? "")
        .trim()
        .slice(0, PLATFORM_MAX),
      url: String(link.url ?? "")
        .trim()
        .slice(0, URL_MAX),
    }))
    .filter((link) => link.platform && link.url)
    .slice(0, 20);
  return JSON.stringify(cleaned);
}

/**
 * Compact display label for one presence link — the form that fits on a
 * business card: websites collapse to their domain ("hekaweb.com"), social
 * profiles to "platform @handle" where a handle can be read from the path.
 */
export function businessPresenceLabel(link: BusinessSocialLink): string {
  const platform = link.platform.trim().toLowerCase();
  try {
    const url = new URL(link.url);
    const host = url.hostname.replace(/^www\./, "");
    if (platform === "website" || platform === "web" || platform === "site") return host;
    const segment = url.pathname.split("/").filter(Boolean)[0] ?? "";
    const handle = segment.replace(/^@/, "");
    return handle ? `${platform} @${handle}` : host;
  } catch {
    return link.url.slice(0, 40);
  }
}

/** One-line presence summary for cards: "hekaweb.com · instagram @hekaweb". */
export function businessPresenceLine(links: BusinessSocialLink[], max = 4): string {
  return links.slice(0, max).map(businessPresenceLabel).filter(Boolean).join("  ·  ");
}
