import { describe, it, expect } from "vitest";

import { isSafeUrl, sanitizeUrl, sanitizeUrlArray } from "./url";

describe("isSafeUrl", () => {
  it("allows null and undefined", () => {
    expect(isSafeUrl(null)).toBe(true);
    expect(isSafeUrl(undefined)).toBe(true);
  });

  it("allows empty string", () => {
    expect(isSafeUrl("")).toBe(true);
  });

  it("blocks javascript: scheme", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JaVaScRiPt:alert(1)")).toBe(false);
  });

  it("blocks data: scheme", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("blocks blob: scheme", () => {
    expect(isSafeUrl("blob:http://example.com/uuid")).toBe(false);
  });

  it("blocks vbscript: scheme", () => {
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("blocks file: scheme", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("allows https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
  });

  it("allows http URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("allows relative paths", () => {
    expect(isSafeUrl("/path/to/resource")).toBe(true);
  });
});

describe("sanitizeUrl", () => {
  it("returns null for null/empty input", () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl("")).toBeNull();
    expect(sanitizeUrl("   ")).toBeNull();
  });

  it("returns null for blocked schemes", () => {
    expect(sanitizeUrl("javascript:void(0)")).toBeNull();
    expect(sanitizeUrl("data:text/html,base64")).toBeNull();
  });

  it("returns trimmed https URL", () => {
    expect(sanitizeUrl("https://example.com/path ")).toBe("https://example.com/path");
  });

  it("returns null for invalid URLs", () => {
    expect(sanitizeUrl("not-a-valid-url")).toBeNull();
  });

  it("returns null for ftp URLs", () => {
    expect(sanitizeUrl("ftp://example.com/file")).toBeNull();
  });

  it("returns null for mailto URLs", () => {
    expect(sanitizeUrl("mailto:test@example.com")).toBeNull();
  });

  it("allows http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });
});

describe("sanitizeUrlArray", () => {
  it("filters out unsafe URLs", () => {
    const urls = [
      "https://example.com",
      "javascript:alert(1)",
      "http://safe.com",
      "data:text/html",
      "",
    ];
    const result = sanitizeUrlArray(urls);
    expect(result).toEqual(["https://example.com", "http://safe.com"]);
  });

  it("returns empty array for all unsafe URLs", () => {
    expect(sanitizeUrlArray(["javascript:1", "data:x"])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(sanitizeUrlArray([])).toEqual([]);
  });
});
