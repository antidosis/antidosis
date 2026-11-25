import { describe, expect, it } from "vitest";

import {
  FREE_SPECIALTY_SLOTS,
  MAX_SPECIALTY_SLOTS,
  PROFESSIONS,
  attributeHighlights,
  getProfession,
  parseAttributes,
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

  it("getProfession resolves known keys and rejects unknown ones", () => {
    expect(getProfession("plumber")?.label).toBe("Plumber");
    expect(getProfession("astronaut")).toBeUndefined();
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
