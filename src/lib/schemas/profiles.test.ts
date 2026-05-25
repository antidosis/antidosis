import { describe, it, expect } from "vitest";

import { createProfileSchema, updateProfileSchema } from "./profiles";

describe("createProfileSchema", () => {
  it("accepts valid profile", () => {
    const result = createProfileSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      fullName: "John Doe",
      mobile: "+61 412 345 678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal profile", () => {
    const result = createProfileSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid userId", () => {
    const result = createProfileSchema.safeParse({
      userId: "not-a-uuid",
      email: "test@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createProfileSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = createProfileSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts empty update", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Updated Name",
      bio: "My bio",
    });
    expect(result.success).toBe(true);
  });

  it("accepts social links", () => {
    const result = updateProfileSchema.safeParse({
      socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/in/test", isPublic: true }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts coordinates", () => {
    const result = updateProfileSchema.safeParse({
      latitude: -33.45,
      longitude: 151.45,
    });
    expect(result.success).toBe(true);
  });

  it("rejects fullName over 100 chars", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects bio over 2000 chars", () => {
    const result = updateProfileSchema.safeParse({
      bio: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts null fields", () => {
    const result = updateProfileSchema.safeParse({
      fullName: null,
      bio: null,
      avatarUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects social link with empty platform", () => {
    const result = updateProfileSchema.safeParse({
      socialLinks: [{ platform: "", url: "https://example.com" }],
    });
    expect(result.success).toBe(false);
  });
});
