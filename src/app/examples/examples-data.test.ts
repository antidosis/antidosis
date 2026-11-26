import { describe, expect, it } from "vitest";

import { EXCHANGE_MODE_VALUES, getExchangeMode } from "@/lib/categories";

import { examples } from "./examples-data";

describe("examples catalogue", () => {
  it("has at least 13 examples for every exchange mode", () => {
    const counts = new Map<string, number>();
    for (const example of examples) {
      counts.set(example.category, (counts.get(example.category) ?? 0) + 1);
    }
    for (const mode of EXCHANGE_MODE_VALUES) {
      expect(
        counts.get(mode) ?? 0,
        `exchange mode "${mode}" (${getExchangeMode(mode)?.label}) has fewer than 13 examples`
      ).toBeGreaterThanOrEqual(13);
    }
  });

  it("uses unique ids", () => {
    const ids = examples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses known exchange modes", () => {
    for (const example of examples) {
      expect(getExchangeMode(example.category), `unknown mode on example ${example.id}`).not.toBe(
        null
      );
    }
  });

  it("has non-empty content on every example", () => {
    for (const example of examples) {
      expect(example.needTitle.length).toBeGreaterThan(0);
      expect(example.needDescription.length).toBeGreaterThan(0);
      expect(example.offerDescription.length).toBeGreaterThan(0);
      expect(example.location.length).toBeGreaterThan(0);
    }
  });
});
