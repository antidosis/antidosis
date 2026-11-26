import { describe, expect, it } from "vitest";

import { FREE_PRODUCT_SLOTS, isFeatured, MAX_PRODUCT_SLOTS, productSlotLimit } from "./store-slots";

describe("productSlotLimit", () => {
  it("gives every builder the free tier by default", () => {
    expect(productSlotLimit({ extraSlots: 0 })).toBe(FREE_PRODUCT_SLOTS);
  });

  it("adds granted extra slots", () => {
    expect(productSlotLimit({ extraSlots: 5 })).toBe(FREE_PRODUCT_SLOTS + 5);
  });

  it("never goes below the free tier", () => {
    expect(productSlotLimit({ extraSlots: -10 })).toBe(FREE_PRODUCT_SLOTS);
  });

  it("caps at the absolute ceiling", () => {
    expect(productSlotLimit({ extraSlots: 10_000 })).toBe(MAX_PRODUCT_SLOTS);
  });
});

describe("isFeatured", () => {
  const now = new Date("2026-12-01T00:00:00Z");

  it("is false with no rental window", () => {
    expect(isFeatured(null, now)).toBe(false);
  });

  it("is false once the window has closed", () => {
    expect(isFeatured(new Date("2026-11-30T23:59:59Z"), now)).toBe(false);
  });

  it("is true while the window is open", () => {
    expect(isFeatured(new Date("2026-12-08T00:00:00Z"), now)).toBe(true);
  });
});
