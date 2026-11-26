import { describe, expect, it } from "vitest";

import {
  applyMeshBuilderSchema,
  createMeshInterestSchema,
  createMeshProductSchema,
  updateMeshProductSchema,
} from "./store";

const VALID_PRODUCT = {
  name: "Field Node — T-Beam 915",
  category: "node",
  description: "Pre-flashed T-Beam with the antidosis channel configured and tested.",
  priceAud: 95,
  stockStatus: "in_stock",
  offerPostage: true,
  postageAud: 12,
  localPickup: true,
  paymentTerms: ["bank_transfer", "payid"],
  highlights: ["7-day battery", "5 km tested range", "915 MHz"],
};

describe("createMeshProductSchema", () => {
  it("accepts a complete listing", () => {
    const result = createMeshProductSchema.safeParse(VALID_PRODUCT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.highlights).toEqual(["7-day battery", "5 km tested range", "915 MHz"]);
      expect(result.data.paymentTerms).toEqual(["bank_transfer", "payid"]);
    }
  });

  it("defaults highlights to an empty list", () => {
    const { highlights: _omitted, ...rest } = VALID_PRODUCT;
    const result = createMeshProductSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.highlights).toEqual([]);
  });

  it("requires at least one delivery method", () => {
    const result = createMeshProductSchema.safeParse({
      ...VALID_PRODUCT,
      offerPostage: false,
      localPickup: false,
      postageAud: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a postage cost when postage is not offered", () => {
    const result = createMeshProductSchema.safeParse({
      ...VALID_PRODUCT,
      offerPostage: false,
      localPickup: true,
    });
    expect(result.success).toBe(false);
  });

  it("allows pickup-only listings", () => {
    const result = createMeshProductSchema.safeParse({
      ...VALID_PRODUCT,
      offerPostage: false,
      postageAud: null,
      localPickup: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one payment term and caps at four", () => {
    expect(createMeshProductSchema.safeParse({ ...VALID_PRODUCT, paymentTerms: [] }).success).toBe(
      false
    );
    expect(
      createMeshProductSchema.safeParse({
        ...VALID_PRODUCT,
        paymentTerms: ["bank_transfer", "payid", "cash_on_pickup", "card_checkout"],
      }).success
    ).toBe(true);
    expect(
      createMeshProductSchema.safeParse({
        ...VALID_PRODUCT,
        paymentTerms: [
          "bank_transfer",
          "payid",
          "cash_on_pickup",
          "card_checkout",
          "bank_transfer",
        ],
      }).success
    ).toBe(false);
  });

  it("rejects unknown payment terms", () => {
    expect(
      createMeshProductSchema.safeParse({ ...VALID_PRODUCT, paymentTerms: ["crypto"] }).success
    ).toBe(false);
  });

  it("caps highlights at 6 chips of 40 characters", () => {
    expect(
      createMeshProductSchema.safeParse({
        ...VALID_PRODUCT,
        highlights: ["1", "2", "3", "4", "5", "6", "7"],
      }).success
    ).toBe(false);
    expect(
      createMeshProductSchema.safeParse({
        ...VALID_PRODUCT,
        highlights: ["x".repeat(41)],
      }).success
    ).toBe(false);
    expect(createMeshProductSchema.safeParse({ ...VALID_PRODUCT, highlights: [""] }).success).toBe(
      false
    );
  });

  it("enforces price and length bounds", () => {
    expect(createMeshProductSchema.safeParse({ ...VALID_PRODUCT, priceAud: -1 }).success).toBe(
      false
    );
    expect(createMeshProductSchema.safeParse({ ...VALID_PRODUCT, priceAud: 100_001 }).success).toBe(
      false
    );
    expect(createMeshProductSchema.safeParse({ ...VALID_PRODUCT, name: "ab" }).success).toBe(false);
    expect(
      createMeshProductSchema.safeParse({ ...VALID_PRODUCT, description: "too short" }).success
    ).toBe(false);
  });

  it("allows price on application", () => {
    expect(createMeshProductSchema.safeParse({ ...VALID_PRODUCT, priceAud: null }).success).toBe(
      true
    );
  });
});

describe("updateMeshProductSchema", () => {
  it("accepts partial updates", () => {
    expect(updateMeshProductSchema.safeParse({ stockStatus: "out_of_stock" }).success).toBe(true);
    expect(updateMeshProductSchema.safeParse({ highlights: ["New firmware"] }).success).toBe(true);
  });

  it("still rejects an empty payment terms list", () => {
    expect(updateMeshProductSchema.safeParse({ paymentTerms: [] }).success).toBe(false);
  });

  it("rejects too many highlights", () => {
    expect(
      updateMeshProductSchema.safeParse({ highlights: ["1", "2", "3", "4", "5", "6", "7"] }).success
    ).toBe(false);
  });

  it("allows clearing nullable fields", () => {
    const result = updateMeshProductSchema.safeParse({
      specs: null,
      postageNote: null,
      paymentNote: null,
      buyUrl: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("applyMeshBuilderSchema", () => {
  it("requires a real description", () => {
    expect(
      applyMeshBuilderSchema.safeParse({
        businessName: "CoastMesh",
        description: "too short",
      }).success
    ).toBe(false);
    expect(
      applyMeshBuilderSchema.safeParse({
        businessName: "CoastMesh",
        description: "We build and range-test 915 MHz nodes for the Central Coast.",
      }).success
    ).toBe(true);
  });
});

describe("createMeshInterestSchema", () => {
  it("traps bots via the honeypot field", () => {
    expect(
      createMeshInterestSchema.safeParse({
        kind: "node",
        email: "buyer@example.com",
        company: "spammy",
      }).success
    ).toBe(false);
  });

  it("normalises the email", () => {
    const result = createMeshInterestSchema.safeParse({
      kind: "node",
      email: "  Buyer@Example.COM ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("buyer@example.com");
  });
});
