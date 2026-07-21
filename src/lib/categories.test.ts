import { describe, it, expect } from "vitest";

import {
  EXCHANGE_MODES,
  EXCHANGE_MODE_VALUES,
  getExchangeMode,
  INCOMPATIBLE_EXCHANGE_MODES,
} from "./categories";

describe("EXCHANGE_MODES", () => {
  it("contains all expected categories", () => {
    const values = EXCHANGE_MODES.map((m) => m.value);
    expect(values).toContain("goods-swap");
    expect(values).toContain("skill-swap");
    expect(values).toContain("money-for-anything");
    expect(values).toContain("community-help");
    expect(values).toContain("creative");
    expect(values).toContain("eccentric");
  });

  it("has unique values", () => {
    const values = EXCHANGE_MODES.map((m) => m.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("each mode has required fields", () => {
    for (const mode of EXCHANGE_MODES) {
      expect(mode.value).toBeTruthy();
      expect(mode.label).toBeTruthy();
      expect(mode.color).toMatch(/^#/);
      expect(mode.twText).toContain("text-");
    }
  });
});

describe("EXCHANGE_MODE_VALUES", () => {
  it("matches EXCHANGE_MODES values", () => {
    expect(EXCHANGE_MODE_VALUES).toEqual(EXCHANGE_MODES.map((m) => m.value));
  });
});

describe("getExchangeMode", () => {
  it("returns matching mode", () => {
    const mode = getExchangeMode("goods-swap");
    expect(mode).not.toBeNull();
    expect(mode?.label).toBe("Goods ↔ Goods");
    expect(mode?.color).toBe("#35e87a");
  });

  it("returns null for invalid value", () => {
    expect(getExchangeMode("invalid-mode")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(getExchangeMode(null)).toBeNull();
    expect(getExchangeMode(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getExchangeMode("")).toBeNull();
  });
});

describe("INCOMPATIBLE_EXCHANGE_MODES", () => {
  it("has entries for service, item, money", () => {
    expect(INCOMPATIBLE_EXCHANGE_MODES).toHaveProperty("service");
    expect(INCOMPATIBLE_EXCHANGE_MODES).toHaveProperty("item");
    expect(INCOMPATIBLE_EXCHANGE_MODES).toHaveProperty("money");
  });

  it("service incompatibles include goods modes", () => {
    expect(INCOMPATIBLE_EXCHANGE_MODES.service).toContain("goods-swap");
    expect(INCOMPATIBLE_EXCHANGE_MODES.service).toContain("goods-for-service");
  });

  it("item incompatibles include skill modes", () => {
    expect(INCOMPATIBLE_EXCHANGE_MODES.item).toContain("skill-swap");
    expect(INCOMPATIBLE_EXCHANGE_MODES.item).toContain("service-for-goods");
  });

  it("money incompatibles include swap modes", () => {
    expect(INCOMPATIBLE_EXCHANGE_MODES.money).toContain("goods-swap");
    expect(INCOMPATIBLE_EXCHANGE_MODES.money).toContain("skill-swap");
  });

  it("all incompatible values are valid exchange modes", () => {
    for (const modes of Object.values(INCOMPATIBLE_EXCHANGE_MODES)) {
      for (const mode of modes) {
        expect(EXCHANGE_MODE_VALUES).toContain(mode);
      }
    }
  });
});
