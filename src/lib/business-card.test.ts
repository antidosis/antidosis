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
    expect(svg).toContain("+2");
    expect(svg).not.toContain("Gardener");
    expect(svg).not.toContain("Tutor");
  });

  it("pills stay inside the frame and keep the rounded card shape", () => {
    const svg = render({
      specialties: ["Web developer", "App developer", "Graphic designer", "Digital marketer / SEO"],
    });
    const rects = [...svg.matchAll(/<rect x="(\d+)" y="318" width="(\d+)"/g)];
    expect(rects.length).toBe(4);
    for (const rect of rects) {
      expect(Number(rect[1]) + Number(rect[2])).toBeLessThanOrEqual(1112);
    }
    // Texture overlays are clipped to the rounded card — no square corners.
    expect(svg).toContain('clip-path="url(#bc-clip)"');
    expect(svg).toContain('<clipPath id="bc-clip"><rect width="1200" height="630" rx="32"/>');
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

  it("topo pattern tiles seamlessly — every corner shares one radius set", () => {
    const topo = BUSINESS_CARD_TEXTURES.find((option) => option.id === "topo")!;
    const byCenter = new Map<string, string[]>();
    for (const match of topo.svgDefs.matchAll(/<circle([^>]*)\/>/g)) {
      const attrs = match[1];
      const cx = /cx="(\d+)"/.exec(attrs)?.[1] ?? "0";
      const cy = /cy="(\d+)"/.exec(attrs)?.[1] ?? "0";
      const r = /r="(\d+)"/.exec(attrs)?.[1];
      if (!r) continue;
      const key = `${cx},${cy}`;
      byCenter.set(key, [...(byCenter.get(key) ?? []), r]);
    }
    // Circles centred on a tile corner are clipped by the tile edge; the four
    // corners only join into continuous rings if they share identical radii.
    const origin = (byCenter.get("0,0") ?? []).sort();
    expect(origin.length).toBeGreaterThan(0);
    expect((byCenter.get("160,0") ?? []).sort()).toEqual(origin);
    expect((byCenter.get("0,160") ?? []).sort()).toEqual(origin);
    expect((byCenter.get("160,160") ?? []).sort()).toEqual(origin);
  });

  it("footer text clears the inner frame (bottom edge y=586)", () => {
    const svg = render();
    expect(svg).toContain('y="540"');
    expect(svg).not.toContain('y="596"');
  });

  it("renders the presence line when links exist, and shifts the chips down", () => {
    const svg = render({ presence: "hekaweb.com  ·  instagram @hekaweb" });
    expect(svg).toContain("hekaweb.com");
    expect(svg).toContain("WEB ");
    // Chips drop from y=318 to y=330 to make room for the presence line.
    expect(svg).toContain('y="330"');
    expect(render()).not.toContain("WEB ");
  });

  it("embeds the QR plate and keeps ACCEPTS/ABN clear of it", () => {
    const qrDataUrl = "data:image/png;base64,AAAA";
    const svg = render({ qrDataUrl });
    expect(svg).toContain(`href="${qrDataUrl}"`);
    expect(svg).toContain("SCAN FOR FULL LISTING");
    // ABN end-anchors left of the plate (x=972) instead of the frame edge.
    expect(svg).toContain('x="972"');
    expect(svg).not.toContain('<text x="1112" y="540"');
    expect(render({ qrDataUrl: null })).not.toContain("SCAN FOR FULL LISTING");
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
    expect(svg).toContain(fitCardText(longName, 780, 34));
  });
});
