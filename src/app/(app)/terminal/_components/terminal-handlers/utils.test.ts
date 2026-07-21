import { describe, expect, it } from "vitest";

import { isSafeUrl, sanitizePath } from "./utils";

describe("isSafeUrl", () => {
  it("accepts HTTPS URL", () => {
    expect(isSafeUrl("https://example.com/path")).toBe(true);
  });

  it("accepts HTTP URL", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("rejects javascript: URL", () => {
    expect(isSafeUrl("javascript:alert(document.cookie)")).toBe(false);
  });

  it("rejects data: URL", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects ftp: URL", () => {
    expect(isSafeUrl("ftp://example.com/file.txt")).toBe(false);
  });

  it("rejects file: URL", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects invalid URL string", () => {
    expect(isSafeUrl("not-a-url")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeUrl("")).toBe(false);
  });

  it("rejects URL with javascript protocol and encoding", () => {
    expect(isSafeUrl("javascript://example.com/%0Aalert(1)")).toBe(false);
  });
});

describe("sanitizePath", () => {
  it("allows simple path", () => {
    expect(sanitizePath("needs")).toBe("needs");
  });

  it("allows nested path", () => {
    expect(sanitizePath("needs/new")).toBe("needs/new");
  });

  it("removes directory traversal", () => {
    expect(sanitizePath("../admin")).toBe("admin");
  });

  it("removes double dots", () => {
    expect(sanitizePath("....//admin")).toBe("/admin");
  });

  it("strips leading slash", () => {
    expect(sanitizePath("/needs")).toBe("needs");
  });

  it("removes special characters", () => {
    expect(sanitizePath("needs<script>")).toBe("needsscript");
  });

  it("returns empty for pure traversal", () => {
    expect(sanitizePath("..")).toBe("");
  });
});
