import { describe, expect, it } from "vitest";

import {
  FREE_SPECIALTY_SLOTS,
  MAX_SPECIALTY_SLOTS,
  PROFESSIONS,
  attributeHighlights,
  getProfession,
  parseAttributes,
  professionDisplayLabel,
  professionKeyFromInput,
} from "./professions";

describe("professions taxonomy", () => {
  it("has unique keys", () => {
    const keys = PROFESSIONS.map((profession) => profession.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every profession has a label, category, pitch and at least one field", () => {
    for (const profession of PROFESSIONS) {
      expect(profession.label.length).toBeGreaterThan(0);
      expect(profession.pitch.length).toBeGreaterThan(0);
      expect(profession.fields.length).toBeGreaterThan(0);
    }
  });

  it("field keys are unique within each profession", () => {
    for (const profession of PROFESSIONS) {
      const keys = profession.fields.map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("select and multi fields have non-empty option lists", () => {
    for (const profession of PROFESSIONS) {
      for (const field of profession.fields) {
        if (field.kind === "select" || field.kind === "multi") {
          expect(field.options.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("slot constants are coherent", () => {
    expect(FREE_SPECIALTY_SLOTS).toBeGreaterThan(0);
    expect(FREE_SPECIALTY_SLOTS).toBeLessThan(MAX_SPECIALTY_SLOTS);
  });

  it("every profession maps to a declared industry, and order covers them all", async () => {
    const { INDUSTRIES, INDUSTRY_ORDER, professionsByIndustry } = await import("./professions");
    for (const profession of PROFESSIONS) {
      expect(INDUSTRIES[profession.industry], profession.key).toBeDefined();
    }
    expect(new Set(INDUSTRY_ORDER).size).toBe(Object.keys(INDUSTRIES).length);
    const grouped = professionsByIndustry();
    const total = Object.values(grouped).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(PROFESSIONS.length);
  });

  it("industryOfProfession resolves registry keys and nulls custom ones", async () => {
    const { industryOfProfession } = await import("./professions");
    expect(industryOfProfession("web_developer")).toBe("tech");
    expect(industryOfProfession("plumber")).toBe("trades");
    expect(industryOfProfession("rocket_surgeon")).toBeNull();
  });

  it("getProfession resolves known keys and rejects unknown ones", () => {
    expect(getProfession("plumber")?.label).toBe("Plumber");
    expect(getProfession("astronaut")).toBeUndefined();
  });
});

describe("professionKeyFromInput", () => {
  it("resolves exact and fuzzy matches to canonical profession keys", () => {
    expect(professionKeyFromInput("plumber")).toBe("plumber");
    expect(professionKeyFromInput("  Plumber ")).toBe("plumber");
    // "Electrical" should land on the electrician profession, not a custom key
    expect(professionKeyFromInput("Electrical")).toBe(getProfession("electrician")?.key);
  });

  it("slugs free text into a storage key for custom professions", () => {
    expect(professionKeyFromInput("Rocket Surgeon!")).toBe("rocket_surgeon");
    expect(professionKeyFromInput("solar panel cleaning")).toBe("solar_panel_cleaning");
  });
});

describe("professionDisplayLabel", () => {
  it("uses the canonical label for known professions", () => {
    expect(professionDisplayLabel("plumber")).toBe("Plumber");
  });

  it("humanises custom keys", () => {
    expect(professionDisplayLabel("rocket_surgeon")).toBe("Rocket Surgeon");
    expect(professionDisplayLabel("solar_panel_cleaning")).toBe("Solar Panel Cleaning");
  });
});

describe("parseAttributes", () => {
  it("returns an empty object for null, invalid JSON and non-objects", () => {
    expect(parseAttributes(null)).toEqual({});
    expect(parseAttributes(undefined)).toEqual({});
    expect(parseAttributes("not json")).toEqual({});
    expect(parseAttributes("[1,2]")).toEqual({});
  });

  it("round-trips a stored attributes blob", () => {
    const blob = JSON.stringify({ emergency_24_7: true, services: ["Blocked drains"] });
    expect(parseAttributes(blob)).toEqual({ emergency_24_7: true, services: ["Blocked drains"] });
  });
});

describe("attributeHighlights", () => {
  it("surfaces true booleans and multi values, capped at four", () => {
    const plumber = getProfession("plumber")!;
    const highlights = attributeHighlights(plumber, {
      emergency_24_7: true,
      licensed: true,
      services: ["Blocked drains", "Gas fitting", "Leak detection", "Hot water systems"],
    });
    expect(highlights).toHaveLength(4);
    expect(highlights).toContain("Available 24/7 for emergencies");
  });

  it("skips false booleans and empty values", () => {
    const plumber = getProfession("plumber")!;
    const highlights = attributeHighlights(plumber, { emergency_24_7: false, licensed: false });
    expect(highlights).toEqual([]);
  });
});
