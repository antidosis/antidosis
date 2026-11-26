import { describe, expect, it } from "vitest";

import { assessProfileLink, displayHostname } from "./link-policy";

describe("assessProfileLink", () => {
  it("accepts ordinary https profile links", () => {
    expect(assessProfileLink("https://instagram.com/someone")).toEqual({ ok: true });
    expect(assessProfileLink("https://www.khouryplumbing.com.au/services")).toEqual({ ok: true });
  });

  it("accepts http links", () => {
    expect(assessProfileLink("http://example.com")).toEqual({ ok: true });
  });

  it("rejects link shorteners", () => {
    for (const url of [
      "https://bit.ly/3xyz",
      "https://tinyurl.com/abc123",
      "https://t.co/abc",
      "https://cutt.ly/xyz",
    ]) {
      const result = assessProfileLink(url);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain("shorteners");
    }
  });

  it("rejects file hosting and transfer links", () => {
    for (const url of [
      "https://dropbox.com/s/abc/file.pdf",
      "https://drive.google.com/file/d/abc",
      "https://mega.nz/file/abc",
      "https://wetransfer.com/downloads/abc",
      "https://1drv.ms/u/abc",
    ]) {
      const result = assessProfileLink(url);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain("file hosting");
    }
  });

  it("rejects paste sites", () => {
    const result = assessProfileLink("https://pastebin.com/abc123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("paste sites");
  });

  it("rejects raw IP addresses", () => {
    const result = assessProfileLink("https://203.0.113.10/login");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("IP address");
  });

  it("rejects credentials embedded in the URL", () => {
    const result = assessProfileLink("https://user:password@example.com");
    expect(result.ok).toBe(false);
  });

  it("rejects non-http schemes and garbage", () => {
    expect(assessProfileLink("ftp://example.com").ok).toBe(false);
    expect(assessProfileLink("not a url").ok).toBe(false);
  });

  it("matches blocked hosts on subdomains", () => {
    const result = assessProfileLink("https://www.dropbox.com/s/abc");
    expect(result.ok).toBe(false);
  });
});

describe("displayHostname", () => {
  it("returns the bare hostname without www", () => {
    expect(displayHostname("https://www.instagram.com/someone")).toBe("instagram.com");
    expect(displayHostname("https://khouryplumbing.com.au:443/x")).toBe("khouryplumbing.com.au");
  });

  it("falls back to the raw value when unparseable", () => {
    expect(displayHostname("not a url")).toBe("not a url");
  });
});
