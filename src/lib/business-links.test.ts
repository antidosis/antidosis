import { describe, expect, it } from "vitest";

import { parseBusinessSocialLinks, serializeBusinessSocialLinks } from "./business-links";

describe("parseBusinessSocialLinks", () => {
  it("returns [] for null, empty or malformed blobs", () => {
    expect(parseBusinessSocialLinks(null)).toEqual([]);
    expect(parseBusinessSocialLinks(undefined)).toEqual([]);
    expect(parseBusinessSocialLinks("not json")).toEqual([]);
    expect(parseBusinessSocialLinks('"string"')).toEqual([]);
    expect(parseBusinessSocialLinks("{}")).toEqual([]);
  });

  it("keeps only well-formed entries", () => {
    const raw = JSON.stringify([
      { platform: "website", url: "https://example.com.au" },
      { platform: "", url: "https://dropped.com" },
      { platform: "instagram" },
      "garbage",
      null,
    ]);
    expect(parseBusinessSocialLinks(raw)).toEqual([
      { platform: "website", url: "https://example.com.au" },
    ]);
  });

  it("caps the list at 20 links", () => {
    const raw = JSON.stringify(
      Array.from({ length: 30 }, (_, i) => ({ platform: "link", url: `https://x.com/${i}` }))
    );
    expect(parseBusinessSocialLinks(raw)).toHaveLength(20);
  });
});

describe("serializeBusinessSocialLinks", () => {
  it("drops empty rows and trims values", () => {
    expect(
      JSON.parse(
        serializeBusinessSocialLinks([
          { platform: " website ", url: " https://example.com.au " },
          { platform: "", url: "" },
        ])
      )
    ).toEqual([{ platform: "website", url: "https://example.com.au" }]);
  });

  it("round-trips through parse", () => {
    const links = [{ platform: "instagram", url: "https://instagram.com/acme" }];
    expect(parseBusinessSocialLinks(serializeBusinessSocialLinks(links))).toEqual(links);
  });
});
