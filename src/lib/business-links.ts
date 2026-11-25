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
