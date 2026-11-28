import { describe, it, expect } from "vitest";

import {
  AUTO_EXCHANGE_MODE,
  EXCHANGE_MODES,
  EXCHANGE_MODE_VALUES,
  compatibleExchangeModes,
  deriveNeedType,
  exchangeNeedSide,
  getExchangeMode,
  INCOMPATIBLE_EXCHANGE_MODES,
  type NeedTypeChoice,
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
    expect(values).toContain("promotion");
  });

  it("has unique values", () => {
    const values = EXCHANGE_MODES.map((m) => m.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("each mode has required fields", () => {
    for (const mode of EXCHANGE_MODES) {
      expect(mode.value).toBeTruthy();
      expect(mode.label).toBeTruthy();
      expect(mode.color).toMatch(/^(#|var\(--x-)/);
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
    expect(mode?.color).toBe("var(--x-35e87a)");
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

  it("promotion mode is available for every offer type", () => {
    for (const modes of Object.values(INCOMPATIBLE_EXCHANGE_MODES)) {
      expect(modes).not.toContain("promotion");
    }
  });

  it("all incompatible values are valid exchange modes", () => {
    for (const modes of Object.values(INCOMPATIBLE_EXCHANGE_MODES)) {
      for (const mode of modes) {
        expect(EXCHANGE_MODE_VALUES).toContain(mode);
      }
    }
  });
});

describe("cascade helpers", () => {
  it("classifies every exchange mode's need side", () => {
    for (const mode of EXCHANGE_MODES) {
      expect(["service", "goods", "money", "open"]).toContain(exchangeNeedSide(mode.value));
    }
    expect(exchangeNeedSide("goods-swap")).toBe("goods");
    expect(exchangeNeedSide("money-for-service")).toBe("service");
    expect(exchangeNeedSide("eccentric")).toBe("open");
    expect(exchangeNeedSide("nonexistent")).toBe("open");
    expect(exchangeNeedSide(null)).toBe("open");
  });

  it("derives the need-type chip from an existing exchange mode", () => {
    expect(deriveNeedType("goods-swap")).toBe("item");
    expect(deriveNeedType("skill-swap")).toBe("service");
    expect(deriveNeedType("goods-for-money")).toBe("money");
    expect(deriveNeedType("eccentric")).toBeNull();
    expect(deriveNeedType(undefined)).toBeNull();
  });

  it("narrows by both sides of the pair", () => {
    // Service for service: the skill swap must survive, goods-needing modes must not.
    const values = compatibleExchangeModes("service", "service").map((m) => m.value);
    expect(values).toContain("skill-swap");
    expect(values).not.toContain("service-for-goods");
    expect(values).not.toContain("service-for-money");
    // Social "open" modes are never hidden by the need side.
    expect(values).toContain("eccentric");
    expect(values).toContain("promotion");
  });

  it("need side alone filters when no offer constraint applies", () => {
    const values = compatibleExchangeModes("money", "item").map((m) => m.value);
    expect(values).toContain("money-for-goods");
    expect(values).not.toContain("money-for-service");
    expect(values).not.toContain("paid-work");
  });

  it("every auto-pair maps to a real mode compatible with that pair", () => {
    for (const [pair, mode] of Object.entries(AUTO_EXCHANGE_MODE)) {
      const [offer, need] = pair.split("+") as [string, NeedTypeChoice];
      expect(EXCHANGE_MODE_VALUES).toContain(mode);
      expect(compatibleExchangeModes(offer, need).map((m) => m.value)).toContain(mode);
    }
  });

  it("ambiguous pairs have no auto mode", () => {
    expect(AUTO_EXCHANGE_MODE["service+item"]).toBeUndefined();
    expect(AUTO_EXCHANGE_MODE["money+service"]).toBeUndefined();
    expect(AUTO_EXCHANGE_MODE["money+money"]).toBeUndefined();
  });
});
