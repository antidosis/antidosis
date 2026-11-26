import { describe, it, expect } from "vitest";

import {
  EXCHANGE_MODES,
  exchangeModeLabel,
  isExchangeModeKey,
  parseExchangeModes,
  serializeExchangeModes,
} from "./exchange-modes";

describe("exchange-modes", () => {
  it("parses a stored JSON string into valid keys", () => {
    expect(parseExchangeModes('["cash","goods","bogus"]')).toEqual(["cash", "goods"]);
  });

  it("dedupes and drops unknown keys", () => {
    expect(parseExchangeModes(["cash", "cash", "nope", "iou"])).toEqual(["cash", "iou"]);
  });

  it("returns an empty array for garbage input", () => {
    expect(parseExchangeModes(null)).toEqual([]);
    expect(parseExchangeModes("not json")).toEqual([]);
    expect(parseExchangeModes({ cash: true })).toEqual([]);
    expect(parseExchangeModes(undefined)).toEqual([]);
  });

  it("serialises to canonical order and null when empty", () => {
    expect(serializeExchangeModes(["iou", "cash", "cash"])).toBe('["cash","iou"]');
    expect(serializeExchangeModes([])).toBeNull();
    expect(serializeExchangeModes(["unknown"])).toBeNull();
  });

  it("validates keys and resolves labels", () => {
    expect(isExchangeModeKey("services")).toBe(true);
    expect(isExchangeModeKey("bitcoin")).toBe(false);
    expect(exchangeModeLabel("goods")).toBe("Goods");
    expect(exchangeModeLabel("bitcoin")).toBe("bitcoin");
  });

  it("every mode has a key, label and hint", () => {
    for (const mode of EXCHANGE_MODES) {
      expect(mode.key.length).toBeGreaterThan(0);
      expect(mode.label.length).toBeGreaterThan(0);
      expect(mode.hint.length).toBeGreaterThan(0);
    }
  });
});
