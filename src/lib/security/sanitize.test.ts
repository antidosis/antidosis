import { describe, it, expect } from "vitest";

import { sanitizePlainText, sanitizeRichText } from "./sanitize";

describe("sanitizePlainText", () => {
  it("strips HTML tags", () => {
    expect(sanitizePlainText("<p>Hello</p>")).toBe("Hello");
  });

  it("strips nested HTML tags", () => {
    expect(sanitizePlainText("<div><p>Hello <strong>world</strong></p></div>")).toBe("Hello world");
  });

  it("decodes &amp; entity", () => {
    expect(sanitizePlainText("Foo &amp; Bar")).toBe("Foo & Bar");
  });

  it("decodes &lt; and &gt; entities", () => {
    expect(sanitizePlainText("&lt;script&gt;")).toBe("<script>");
  });

  it("decodes &quot; entity", () => {
    expect(sanitizePlainText("&quot;hello&quot;")).toBe('"hello"');
  });

  it("decodes &#39; entity", () => {
    expect(sanitizePlainText("&#39;hello&#39;")).toBe("'hello'");
  });

  it("decodes &nbsp; entity", () => {
    expect(sanitizePlainText("Hello&nbsp;World")).toBe("Hello World");
  });

  it("trims whitespace", () => {
    expect(sanitizePlainText("  hello  ")).toBe("hello");
  });

  it("returns empty string for null/undefined", () => {
    expect(sanitizePlainText("")).toBe("");
    // @ts-expect-error testing null input
    expect(sanitizePlainText(null)).toBe("");
    // @ts-expect-error testing undefined input
    expect(sanitizePlainText(undefined)).toBe("");
  });

  it("handles script tags with attributes", () => {
    expect(sanitizePlainText('<script src="evil.js">alert(1)</script>')).toBe("alert(1)");
  });

  it("handles complex HTML document", () => {
    const html = `<!DOCTYPE html>
<html>
<body>
  <h1>Title</h1>
  <p>Paragraph with <a href="http://example.com">link</a></p>
</body>
</html>`;
    const result = sanitizePlainText(html);
    expect(result).not.toContain("<");
    expect(result).toContain("Title");
    expect(result).toContain("Paragraph with");
    expect(result).toContain("link");
  });
});

describe("sanitizeRichText", () => {
  it("delegates to sanitizePlainText", () => {
    expect(sanitizeRichText("<p>Hello</p>")).toBe("Hello");
  });
});
