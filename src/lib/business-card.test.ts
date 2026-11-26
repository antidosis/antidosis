import { describe, expect, it } from "vitest";

import { BUSINESS_CARD_TEXTURES, formatAbnDisplay, renderBusinessCardSvg } from "./business-card";
import { fitCardText, renderShareCardSvg, SHARE_CARD_THEMES } from "./share-card";

const texture = BUSINESS_CARD_TEXTURES[0];

function render(overrides: Partial<Parameters<typeof renderBusinessCardSvg>[0]> = {}) {
  return renderBusinessCardSvg({
    name: "Khoury Plumbing Co",
    subtitle: "Plumber",
    line: "Noraville NSW  ·  0400 000 000",
    specialties: ["Plumber"],
    accepts: ["Cash & bank transfer", "Goods", "Services"],
    abn: "12 345 678 901",
    cta: "Find us in the Antidosis directory.",
    url: "antidosis.com/pros/abc-123",
    texture,
    ...overrides,
  });
}

describe("renderBusinessCardSvg", () => {
  it("paints the chosen texture over the base", () => {
    const svg = render();
    expect(svg).toContain('id="tex-carbon"');
    expect(svg).toContain('fill="url(#tex-carbon)"');
    expect(svg).toContain(`fill="${texture.base}"`);
  });

  it("carries the accepted exchange forms on the face", () => {
    const svg = render();
    expect(svg).toContain("ACCEPTS");
    expect(svg).toContain("CASH &amp; BANK TRANSFER");
    expect(svg).toContain("GOODS");
    expect(svg).toContain("SERVICES");
  });

  it("shows the formatted ABN", () => {
    expect(render()).toContain("ABN 12 345 678 901");
    expect(render({ abn: null })).not.toContain("ABN");
  });

  it("truncates a long trading name instead of overflowing the frame", () => {
    const longName = "The Absolutely Enormous Plumbing And Roofing Company Of Greater Gosford";
    const svg = render({ name: longName });
    expect(svg).not.toContain(longName);
    expect(svg).toContain("…");
  });

  it("collapses specialty overflow into a +n chip", () => {
    const svg = render({
      specialties: ["Plumber", "Electrician", "Carpenter", "Cleaner", "Gardener", "Tutor"],
    });
    expect(svg).toContain("+3");
    expect(svg).not.toContain("Gardener");
    expect(svg).not.toContain("Tutor");
  });

  it("omits the ACCEPTS line when nothing is selected", () => {
    expect(render({ accepts: [] })).not.toContain("ACCEPTS");
  });

  it("escapes XML special characters in the trading name", () => {
    const svg = render({ name: "A & B <Builders>" });
    expect(svg).not.toContain("A & B");
    expect(svg).toContain("A &amp; B &lt;Builders&gt;");
  });

  it("every texture renders a complete document", () => {
    for (const option of BUSINESS_CARD_TEXTURES) {
      const svg = render({ texture: option });
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain(option.base);
    }
  });
});

describe("fitCardText", () => {
  it("returns short text untouched", () => {
    expect(fitCardText("Plumber", 300, 7.6)).toBe("Plumber");
  });

  it("truncates with an ellipsis when over the estimated width", () => {
    const fitted = fitCardText("a".repeat(100), 100, 10);
    expect(fitted.endsWith("…")).toBe(true);
    expect(fitted.length).toBeLessThan(100);
  });
});

describe("formatAbnDisplay", () => {
  it("groups an 11-digit ABN", () => {
    expect(formatAbnDisplay("12345678901")).toBe("12 345 678 901");
    expect(formatAbnDisplay("12 345 678 901")).toBe("12 345 678 901");
  });

  it("passes anything else through unchanged", () => {
    expect(formatAbnDisplay("not-an-abn")).toBe("not-an-abn");
  });
});

describe("renderShareCardSvg text fitting", () => {
  it("truncates an overlong name so it cannot paint over the frame", () => {
    const longName = "A".repeat(80);
    const svg = renderShareCardSvg({
      badge: "CONNECTION CARD",
      name: longName,
      cta: "Connect with me on the local exchange network.",
      url: "antidosis.com/connect/x",
      theme: SHARE_CARD_THEMES[0],
    });
    expect(svg).not.toContain(longName);
    expect(svg).toContain(fitCardText(longName, 984, 40));
  });
});
