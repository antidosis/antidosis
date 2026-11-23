import { describe, it, expect } from "vitest";

import {
  extractOgImage,
  fetchImage,
  fetchOgImage,
  MAX_AVATAR_BYTES,
  parseSocialAvatarTarget,
} from "./social-avatar";

describe("parseSocialAvatarTarget", () => {
  it("accepts allowlisted https profile URLs", () => {
    const fb = parseSocialAvatarTarget("https://www.facebook.com/some.cafe");
    expect(fb?.host).toBe("facebook.com");
    expect(fb?.pageUrl).toBe("https://www.facebook.com/some.cafe");

    for (const url of [
      "https://instagram.com/creator",
      "https://m.tiktok.com/@creator",
      "https://www.youtube.com/@creator",
      "https://x.com/creator",
      "https://mobile.twitter.com/creator",
      "https://www.linkedin.com/in/creator",
      "https://www.threads.net/@creator",
    ]) {
      expect(parseSocialAvatarTarget(url)).not.toBeNull();
    }
  });

  it("rejects non-allowlisted hosts (SSRF guard)", () => {
    for (const url of [
      "https://evil.example.com/facebook.com",
      "https://localhost/facebook.com",
      "https://169.254.169.254/latest",
      "ftp://facebook.com/x",
      "https://facebook.com.evil.io/x",
      "not a url",
      "",
    ]) {
      expect(parseSocialAvatarTarget(url)).toBeNull();
    }
  });

  it("rejects http-only-by-mistake garbage but accepts plain http for allowlisted hosts", () => {
    expect(parseSocialAvatarTarget("https://")).toBeNull();
    expect(parseSocialAvatarTarget("http://facebook.com/page")?.host).toBe("facebook.com");
  });

  it("strips hash fragments", () => {
    const target = parseSocialAvatarTarget("https://facebook.com/page#section");
    expect(target?.pageUrl).not.toContain("#");
  });
});

describe("extractOgImage", () => {
  it("extracts content after property", () => {
    const html = `<html><head><meta property="og:image" content="https://cdn.example.com/pic.jpg" /></head></html>`;
    expect(extractOgImage(html)).toBe("https://cdn.example.com/pic.jpg");
  });

  it("extracts content before property", () => {
    const html = `<meta content="https://cdn.example.com/pic.jpg" property="og:image">`;
    expect(extractOgImage(html)).toBe("https://cdn.example.com/pic.jpg");
  });

  it("decodes HTML entities", () => {
    const html = `<meta property="og:image" content="https://cdn.example.com/pic.jpg?a=1&amp;b=2">`;
    expect(extractOgImage(html)).toBe("https://cdn.example.com/pic.jpg?a=1&b=2");
  });

  it("returns null when absent or not an http(s) URL", () => {
    expect(extractOgImage("<html><head></head></html>")).toBeNull();
    expect(extractOgImage(`<meta property="og:image" content="javascript:alert(1)">`)).toBeNull();
    expect(extractOgImage("")).toBeNull();
  });
});

describe("fetchOgImage", () => {
  it("returns the og:image of a fetched page", async () => {
    const fetchImpl = (async () =>
      new Response(`<meta property="og:image" content="https://cdn.example.com/pic.jpg">`, {
        status: 200,
      })) as unknown as typeof fetch;
    await expect(fetchOgImage("https://facebook.com/x", fetchImpl)).resolves.toBe(
      "https://cdn.example.com/pic.jpg"
    );
  });

  it("throws a clear error when the page has no og:image", async () => {
    const fetchImpl = (async () =>
      new Response("<html></html>", { status: 200 })) as unknown as typeof fetch;
    await expect(fetchOgImage("https://instagram.com/x", fetchImpl)).rejects.toThrow(
      /No public profile picture/
    );
  });

  it("throws when the page request fails", async () => {
    const fetchImpl = (async () => new Response("", { status: 404 })) as unknown as typeof fetch;
    await expect(fetchOgImage("https://facebook.com/x", fetchImpl)).rejects.toThrow("404");
  });
});

describe("fetchImage", () => {
  function imageResponse(contentType: string, bytes: number, status = 200) {
    return (async () =>
      new Response(new Uint8Array(bytes).buffer as ArrayBuffer, {
        status,
        headers: { "content-type": contentType },
      })) as unknown as typeof fetch;
  }

  it("returns buffer and extension for a valid image", async () => {
    const img = await fetchImage("https://cdn.example.com/p.jpg", imageResponse("image/jpeg", 100));
    expect(img.ext).toBe("jpg");
    expect(img.bytes).toBe(100);
  });

  it("rejects non-image content types", async () => {
    await expect(fetchImage("https://x/p", imageResponse("text/html", 100))).rejects.toThrow(
      /Unsupported image type/
    );
  });

  it("rejects oversized images", async () => {
    await expect(
      fetchImage("https://x/p", imageResponse("image/png", MAX_AVATAR_BYTES + 1))
    ).rejects.toThrow(/5MB/);
  });

  it("rejects failed responses and empty bodies", async () => {
    await expect(fetchImage("https://x/p", imageResponse("image/png", 0, 500))).rejects.toThrow(
      "500"
    );
    await expect(fetchImage("https://x/p", imageResponse("image/png", 0))).rejects.toThrow(
      /Empty image/
    );
  });
});
