import { describe, expect, it } from "vitest";

import {
  businessPresenceLabel,
  businessPresenceLine,
  parseBusinessSocialLinks,
  serializeBusinessSocialLinks,
} from "./business-links";

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

describe("businessPresenceLabel", () => {
  it("collapses websites to their bare domain", () => {
    expect(businessPresenceLabel({ platform: "website", url: "https://www.hekaweb.com/au" })).toBe(
      "hekaweb.com"
    );
  });

  it("reads social handles from the URL path", () => {
    expect(
      businessPresenceLabel({ platform: "instagram", url: "https://instagram.com/@hekaweb" })
    ).toBe("instagram @hekaweb");
    expect(
      businessPresenceLabel({ platform: "facebook", url: "https://facebook.com/hekaweb" })
    ).toBe("facebook @hekaweb");
  });

  it("falls back to the host when a social URL has no handle", () => {
    expect(businessPresenceLabel({ platform: "instagram", url: "https://instagram.com/" })).toBe(
      "instagram.com"
    );
  });

  it("survives a non-URL value", () => {
    expect(businessPresenceLabel({ platform: "website", url: "not a url" })).toBe("not a url");
  });
});

describe("businessPresenceLine", () => {
  it("joins labels and caps the count", () => {
    const links = [
      { platform: "website", url: "https://hekaweb.com" },
      { platform: "instagram", url: "https://instagram.com/hekaweb" },
      { platform: "facebook", url: "https://facebook.com/hekaweb" },
    ];
    expect(businessPresenceLine(links, 2)).toBe("hekaweb.com  ·  instagram @hekaweb");
    expect(businessPresenceLine([])).toBe("");
  });
});
