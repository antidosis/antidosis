import { describe, expect, it } from "vitest";

import { createNeedSchema, updateNeedSchema } from "./needs";

describe("createNeedSchema", () => {
  const valid = {
    title: "Need a plumber",
    description: "My kitchen sink is leaking and I need someone to fix it ASAP.",
    offerType: "service" as const,
    offerDescription: "I can help with garden work",
  };

  it("accepts a minimal valid need", () => {
    const result = createNeedSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isLocal).toBe(true);
      expect(result.data.requiredSkills).toEqual([]);
    }
  });

  it("rejects a title under 3 chars", () => {
    const result = createNeedSchema.safeParse({ ...valid, title: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 200 chars", () => {
    const result = createNeedSchema.safeParse({ ...valid, title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects a description under 10 chars", () => {
    const result = createNeedSchema.safeParse({ ...valid, description: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid offerType", () => {
    const result = createNeedSchema.safeParse({ ...valid, offerType: "cash" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createNeedSchema.safeParse({
      ...valid,
      offerValue: 50,
      locationName: "Terrigal",
      latitude: -33.45,
      longitude: 151.45,
      requiredSkills: ["plumbing"],
      images: ["https://example.com/img.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults to flexible urgency and no public phone contact", () => {
    const result = createNeedSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe(0);
      expect(result.data.allowUrgentContact).toBe(false);
    }
  });

  it("accepts urgent contact only at urgency 7 or above", () => {
    expect(
      createNeedSchema.safeParse({ ...valid, urgency: 7, allowUrgentContact: true }).success
    ).toBe(true);
    expect(
      createNeedSchema.safeParse({ ...valid, urgency: 6, allowUrgentContact: true }).success
    ).toBe(false);
  });

  it("rejects urgency outside the 0–9 scale", () => {
    expect(createNeedSchema.safeParse({ ...valid, urgency: -1 }).success).toBe(false);
    expect(createNeedSchema.safeParse({ ...valid, urgency: 10 }).success).toBe(false);
  });

  it("requires a destination for rideshare posts", () => {
    expect(createNeedSchema.safeParse({ ...valid, needCategory: "rideshare" }).success).toBe(false);
    expect(
      createNeedSchema.safeParse({
        ...valid,
        needCategory: "rideshare",
        destinationName: "Sydney Central, NSW",
      }).success
    ).toBe(true);
  });

  it("rejects negative offerValue", () => {
    const result = createNeedSchema.safeParse({ ...valid, offerValue: -1 });
    expect(result.success).toBe(false);
  });

  it("treats NaN offerValue (empty number input) as unset", () => {
    // RHF valueAsNumber yields NaN for an empty Estimated Value field —
    // posting a need without a value must not fail validation.
    const result = createNeedSchema.safeParse({ ...valid, offerValue: NaN });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offerValue == null).toBe(true);
    }
    const upd = updateNeedSchema.safeParse({ offerValue: NaN });
    expect(upd.success).toBe(true);
  });
});

describe("updateNeedSchema", () => {
  it("accepts empty update", () => {
    const result = updateNeedSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateNeedSchema.safeParse({ title: "Updated title" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated title");
    }
  });

  it("accepts status change", () => {
    const result = updateNeedSchema.safeParse({ status: "archived" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateNeedSchema.safeParse({ status: "deleted" });
    expect(result.success).toBe(false);
  });
});
