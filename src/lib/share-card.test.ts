import { describe, expect, it } from "vitest";

import { renderShareCardSvg, SHARE_CARD_THEMES, xmlEscape } from "./share-card";

const theme = SHARE_CARD_THEMES[0];

describe("renderShareCardSvg", () => {
  it("renders every skill chip, not just the first three", () => {
    const svg = renderShareCardSvg({
      badge: "CONNECTION CARD",
      name: "Martin Khoury",
      subtitle: "@admin",
      chips: ["Web Development", "Content Creation", "Mobile App Development", "Graphic Design"],
      cta: "Connect with me on the local exchange network.",
      url: "antidosis.com/connect/admin",
      theme,
    });

    expect(svg).toContain("Web Development");
    expect(svg).toContain("Content Creation");
    expect(svg).toContain("Mobile App Development");
    expect(svg).toContain("Graphic Design");
  });

  it("caps chips at six and truncates long labels", () => {
    const svg = renderShareCardSvg({
      badge: "BUSINESS CARD",
      name: "Khoury Plumbing Co",
      chips: [
        "One very long profession label that goes on",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
      ],
      cta: "Find us in the Antidosis directory.",
      url: "antidosis.com/pros/abc",
      theme,
    });

    // Eight requested, six rendered.
    expect(svg.match(/<g><rect/g)?.length).toBe(6);
    expect(svg).not.toContain("Seven");
  });

  it("escapes XML special characters in text fields", () => {
    const svg = renderShareCardSvg({
      badge: "CONNECTION CARD",
      name: "A & B <Builders>",
      cta: 'Say "hello" & connect',
      url: "antidosis.com/connect/x",
      theme,
    });

    expect(svg).not.toContain("A & B");
    expect(svg).toContain(xmlEscape("A & B <Builders>"));
    expect(svg).toContain(xmlEscape('Say "hello" & connect'));
  });

  it("renders rating and meta lines when provided", () => {
    const svg = renderShareCardSvg({
      badge: "BUSINESS CARD",
      name: "Khoury Plumbing Co",
      meta: "★ 4.8 · 12 reviews  ·  ABN 12 345 678 901",
      cta: "Find us in the Antidosis directory.",
      url: "antidosis.com/pros/abc",
      theme,
    });

    expect(svg).toContain("★ 4.8 · 12 reviews");
    expect(svg).toContain("ABN 12 345 678 901");
  });
});

describe("xmlEscape", () => {
  it("escapes the five XML entities", () => {
    expect(xmlEscape(`<a href="x">&amp;'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;amp;&apos;");
  });
});
