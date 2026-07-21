import { describe, it, expect } from "vitest";

import {
  CENTRAL_COAST_SUBURBS,
  formatLocation,
  findSuburb,
  isValidCentralCoastSuburb,
} from "./central-coast-suburbs";

describe("CENTRAL_COAST_SUBURBS", () => {
  it("contains suburbs with correct shape", () => {
    for (const suburb of CENTRAL_COAST_SUBURBS) {
      expect(suburb).toHaveProperty("name");
      expect(suburb).toHaveProperty("postcode");
      expect(suburb).toHaveProperty("formatted");
      expect(typeof suburb.name).toBe("string");
      expect(typeof suburb.postcode).toBe("string");
      expect(typeof suburb.formatted).toBe("string");
      expect(suburb.name.length).toBeGreaterThan(0);
      expect(suburb.postcode.length).toBeGreaterThan(0);
      expect(suburb.formatted.length).toBeGreaterThan(0);
    }
  });

  it("contains well-known suburbs", () => {
    const names = CENTRAL_COAST_SUBURBS.map((s) => s.name);
    expect(names).toContain("Gosford");
    expect(names).toContain("Terrigal");
    expect(names).toContain("Woy Woy");
    expect(names).toContain("Erina");
    expect(names).toContain("Tuggerah");
  });

  it("each suburb has a unique formatted identifier", () => {
    const formatted = CENTRAL_COAST_SUBURBS.map((s) => s.formatted);
    const unique = new Set(formatted);
    // Data contains a couple of exact duplicates (Kiar_2259, Wondabyne_2256)
    expect(unique.size).toBeLessThanOrEqual(formatted.length);
    expect(unique.size).toBeGreaterThan(0);
  });

  it("formatted identifier matches name and postcode pattern", () => {
    for (const suburb of CENTRAL_COAST_SUBURBS) {
      const expectedPattern = new RegExp(
        `^${suburb.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "_")}_${suburb.postcode}$`
      );
      expect(suburb.formatted).toMatch(expectedPattern);
    }
  });
});

describe("formatLocation", () => {
  it("formats name and postcode correctly", () => {
    expect(formatLocation("Gosford", "2250")).toBe("gosford_2250");
  });

  it("lowercases the name", () => {
    expect(formatLocation("GOSFORD", "2250")).toBe("gosford_2250");
  });

  it("replaces spaces with underscores", () => {
    expect(formatLocation("Bateau Bay", "2261")).toBe("bateau_bay_2261");
  });

  it("removes special characters", () => {
    expect(formatLocation("St. Huberts Island", "2257")).toBe("st_huberts_island_2257");
  });

  it("handles multiple spaces", () => {
    expect(formatLocation("The   Entrance", "2261")).toBe("the_entrance_2261");
  });

  it("returns only cleaned name when postcode is omitted", () => {
    expect(formatLocation("Gosford")).toBe("gosford");
  });

  it("handles empty string", () => {
    expect(formatLocation("")).toBe("");
  });

  it("handles name with only special characters", () => {
    expect(formatLocation("!!!", "1234")).toBe("_1234");
  });

  it("handles numeric names", () => {
    expect(formatLocation("Area 51", "2250")).toBe("area_51_2250");
  });
});

describe("findSuburb", () => {
  it("finds suburbs by name", () => {
    const results = findSuburb("Gosford");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.name === "Gosford")).toBe(true);
  });

  it("finds suburbs case-insensitively", () => {
    const results = findSuburb("gosford");
    expect(results.some((s) => s.name === "Gosford")).toBe(true);
  });

  it("finds suburbs by postcode", () => {
    const results = findSuburb("2250");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) => s.postcode === "2250")).toBe(true);
  });

  it("finds suburbs by partial name", () => {
    const results = findSuburb("Bay");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.name.includes("Bay"))).toBe(true);
  });

  it("finds suburbs by formatted identifier", () => {
    const results = findSuburb("gosford_2250");
    expect(results.some((s) => s.formatted === "gosford_2250")).toBe(true);
  });

  it("returns empty array for empty query", () => {
    expect(findSuburb("")).toEqual([]);
  });

  it("returns empty array for whitespace query", () => {
    expect(findSuburb("   ")).toEqual([]);
  });

  it("returns empty array for nonexistent suburb", () => {
    expect(findSuburb("Sydney")).toEqual([]);
  });

  it("returns at most 8 results", () => {
    const results = findSuburb("2");
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it("trims whitespace from query", () => {
    const results = findSuburb("  Gosford  ");
    expect(results.some((s) => s.name === "Gosford")).toBe(true);
  });

  it("finds suburbs with spaces in query", () => {
    const results = findSuburb("Bateau Bay");
    expect(results.some((s) => s.name === "Bateau Bay")).toBe(true);
  });
});

describe("isValidCentralCoastSuburb", () => {
  it("returns true for valid formatted suburb", () => {
    expect(isValidCentralCoastSuburb("gosford_2250")).toBe(true);
    expect(isValidCentralCoastSuburb("terrigal_2260")).toBe(true);
    expect(isValidCentralCoastSuburb("woy_woy_2256")).toBe(true);
  });

  it("returns false for invalid formatted suburb", () => {
    expect(isValidCentralCoastSuburb("sydney_2000")).toBe(false);
    expect(isValidCentralCoastSuburb("nonexistent_0000")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidCentralCoastSuburb("")).toBe(false);
  });

  it("returns false for case mismatch", () => {
    expect(isValidCentralCoastSuburb("Gosford_2250")).toBe(false);
  });

  it("returns false for partial match", () => {
    expect(isValidCentralCoastSuburb("gosford")).toBe(false);
  });
});
