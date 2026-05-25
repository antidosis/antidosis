import { describe, it, expect } from "vitest";

import { createCredentialSchema, updateCredentialSchema } from "./credentials";

describe("createCredentialSchema", () => {
  const valid = {
    type: "qualification" as const,
    title: "Bachelor of Nursing",
  };

  it("accepts minimal valid credential", () => {
    const result = createCredentialSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });

  it("accepts all valid types", () => {
    const types = [
      "license",
      "qualification",
      "certification",
      "ticket",
      "resume",
      "identification",
      "insurance",
      "wwcc",
      "criminal_history",
      "business_registration",
      "other",
    ] as const;

    for (const type of types) {
      const result = createCredentialSchema.safeParse({ ...valid, type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid type", () => {
    const result = createCredentialSchema.safeParse({
      ...valid,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createCredentialSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = createCredentialSchema.safeParse({
      ...valid,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 chars", () => {
    const result = createCredentialSchema.safeParse({
      ...valid,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createCredentialSchema.safeParse({
      ...valid,
      subType: "drivers_licence",
      description: "My degree",
      documentNumber: "DOC123",
      issuedBy: "University",
      issuedAt: "2020-01-01",
      expiresAt: "2025-01-01",
      fileUrl: "https://example.com/doc.pdf",
      backFileUrl: "https://example.com/back.pdf",
      isPublic: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects subType over 100 chars", () => {
    const result = createCredentialSchema.safeParse({
      ...valid,
      subType: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects fileUrl over 500 chars", () => {
    const result = createCredentialSchema.safeParse({
      ...valid,
      fileUrl: "https://" + "a".repeat(500),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCredentialSchema", () => {
  it("accepts empty update", () => {
    const result = updateCredentialSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateCredentialSchema.safeParse({ title: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts type change", () => {
    const result = updateCredentialSchema.safeParse({ type: "license" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = updateCredentialSchema.safeParse({ type: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = updateCredentialSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});
