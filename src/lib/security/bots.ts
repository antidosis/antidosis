/**
 * Known bulk-crawler / AI-scraper user agents. These get a hard 403 on
 * contact-adjacent API routes — legitimate members never browse with these
 * agents, and robots.txt alone is honoured only by the polite ones.
 *
 * Matching is a lowercase substring check: UA strings vary by version
 * suffix, so exact matching would rot.
 */
const BLOCKED_AGENT_FRAGMENTS = [
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "ccbot",
  "perplexitybot",
  "perplexity-user",
  "bytespider",
  "amazonbot",
  "google-extended",
  "applebot-extended",
  "meta-externalagent",
  "facebookexternalhit",
  "cohere-ai",
  "diffbot",
  "omgilibot",
  "youbot",
  "timpibot",
  "scrapy",
  "python-requests",
  "python-urllib",
  "curl/",
  "wget/",
  "httpclient",
  "go-http-client",
  "libwww-perl",
] as const;

export function isBlockedAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // no UA at all is not a browser
  const ua = userAgent.toLowerCase();
  return BLOCKED_AGENT_FRAGMENTS.some((fragment) => ua.includes(fragment));
}
