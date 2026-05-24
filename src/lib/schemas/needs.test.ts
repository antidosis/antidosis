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

  it("rejects negative offerValue", () => {
    const result = createNeedSchema.safeParse({ ...valid, offerValue: -1 });
    expect(result.success).toBe(false);
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
