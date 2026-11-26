import { describe, it, expect } from "vitest";

import { createProfileSchema, isHttpUrl, socialLinkSchema, updateProfileSchema } from "./profiles";

describe("isHttpUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isHttpUrl("https://example.com/x")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects other schemes and non-URLs", () => {
    expect(isHttpUrl("ftp://example.com")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
  });
});

describe("socialLinkSchema", () => {
  it("accepts a valid https link with a client-side id", () => {
    const result = socialLinkSchema.safeParse({
      id: "link-1",
      platform: "linkedin",
      url: "https://linkedin.com/in/test",
      isPublic: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-http(s) URLs", () => {
    expect(socialLinkSchema.safeParse({ platform: "x", url: "ftp://example.com" }).success).toBe(
      false
    );
    expect(socialLinkSchema.safeParse({ platform: "x", url: "not a url" }).success).toBe(false);
  });
});

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

  it("accepts business contact details and clears them with empty strings", () => {
    const set = updateProfileSchema.safeParse({
      businessPhone: "02 4321 0987",
      businessEmail: "bookings@example.com.au",
    });
    expect(set.success).toBe(true);

    const cleared = updateProfileSchema.safeParse({
      businessPhone: "",
      businessEmail: "",
    });
    expect(cleared.success).toBe(true);
    if (cleared.success) {
      expect(cleared.data.businessPhone).toBe("");
      expect(cleared.data.businessEmail).toBe("");
    }
  });

  it("rejects a malformed business email", () => {
    const result = updateProfileSchema.safeParse({
      businessEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
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

  it("rejects businessName over 100 chars", () => {
    const result = updateProfileSchema.safeParse({
      businessName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid businessName", () => {
    const result = updateProfileSchema.safeParse({
      businessName: "Khoury Plumbing Co",
    });
    expect(result.success).toBe(true);
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

  it("rejects social link with a non-http(s) URL", () => {
    const result = updateProfileSchema.safeParse({
      socialLinks: [{ platform: "website", url: "not a url" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts social links carrying client-side ids", () => {
    const result = updateProfileSchema.safeParse({
      socialLinks: [{ id: "link-1", platform: "website", url: "https://example.com" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts accountType individual and business", () => {
    expect(updateProfileSchema.safeParse({ accountType: "individual" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ accountType: "business" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ accountType: null }).success).toBe(true);
  });

  it("rejects unknown accountType values", () => {
    expect(updateProfileSchema.safeParse({ accountType: "enterprise" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ accountType: "" }).success).toBe(false);
  });

  it("accepts ABNs in display form (digits and spaces)", () => {
    const result = updateProfileSchema.safeParse({ abn: "51 824 753 556" });
    expect(result.success).toBe(true);
  });

  it("rejects ABNs containing letters", () => {
    const result = updateProfileSchema.safeParse({ abn: "ABN 51824753556" });
    expect(result.success).toBe(false);
  });

  it("accepts audienceSize as an integer or null", () => {
    expect(updateProfileSchema.safeParse({ audienceSize: 3200 }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ audienceSize: 0 }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ audienceSize: null }).success).toBe(true);
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("rejects non-integer, negative, or absurd audienceSize values", () => {
    expect(updateProfileSchema.safeParse({ audienceSize: 3.5 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ audienceSize: -1 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ audienceSize: 3_000_000_000 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ audienceSize: "3200" }).success).toBe(false);
  });
});
