import { describe, expect, it } from "vitest";

import { isBlockedAgent } from "./bots";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const IPHONE_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36";

describe("isBlockedAgent", () => {
  it("allows real browsers, including mobile webviews (the Capacitor app)", () => {
    expect(isBlockedAgent(CHROME)).toBe(false);
    expect(isBlockedAgent(IPHONE_WEBVIEW)).toBe(false);
    expect(isBlockedAgent(ANDROID_WEBVIEW)).toBe(false);
  });

  it("blocks known AI scrapers and bulk crawlers", () => {
    expect(isBlockedAgent("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)")).toBe(
      true
    );
    expect(isBlockedAgent("Mozilla/5.0 (compatible; ClaudeBot/1.0)")).toBe(true);
    expect(isBlockedAgent("CCBot/2.0 (https://commoncrawl.org/faq/)")).toBe(true);
    expect(isBlockedAgent("PerplexityBot/1.0")).toBe(true);
    expect(isBlockedAgent("Bytespider")).toBe(true);
  });

  it("blocks scripting clients and missing user agents", () => {
    expect(isBlockedAgent("curl/8.7.1")).toBe(true);
    expect(isBlockedAgent("python-requests/2.32.3")).toBe(true);
    expect(isBlockedAgent("Scrapy/2.11 (+https://scrapy.org)")).toBe(true);
    expect(isBlockedAgent(null)).toBe(true);
    expect(isBlockedAgent(undefined)).toBe(true);
    expect(isBlockedAgent("")).toBe(true);
  });
});
