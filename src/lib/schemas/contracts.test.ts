import { describe, it, expect } from "vitest";

import {
  signContractSchema,
  requestCancelSchema,
  respondCancelSchema,
  cancelContractSchema,
  patchContractSchema,
} from "./contracts";

describe("signContractSchema", () => {
  it("accepts a valid signature", () => {
    const result = signContractSchema.safeParse({ signature: "John Doe" });
    expect(result.success).toBe(true);
  });

  it("rejects empty signature", () => {
    const result = signContractSchema.safeParse({ signature: "" });
    expect(result.success).toBe(false);
  });

  it("rejects signature over 200 chars", () => {
    const result = signContractSchema.safeParse({ signature: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects missing signature", () => {
    const result = signContractSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("requestCancelSchema", () => {
  it("accepts empty object", () => {
    const result = requestCancelSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a reason", () => {
    const result = requestCancelSchema.safeParse({ reason: "Changed my mind" });
    expect(result.success).toBe(true);
  });

  it("rejects reason over 500 chars", () => {
    const result = requestCancelSchema.safeParse({ reason: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("respondCancelSchema", () => {
  it("requires accept field", () => {
    const result = respondCancelSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts accept=true with response", () => {
    const result = respondCancelSchema.safeParse({
      accept: true,
      response: "I agree",
    });
    expect(result.success).toBe(true);
  });

  it("accepts accept=false without response", () => {
    const result = respondCancelSchema.safeParse({ accept: false });
    expect(result.success).toBe(true);
  });

  it("rejects response over 500 chars", () => {
    const result = respondCancelSchema.safeParse({
      accept: true,
      response: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean accept", () => {
    const result = respondCancelSchema.safeParse({ accept: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("cancelContractSchema", () => {
  it("accepts empty object", () => {
    const result = cancelContractSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a cancel reason", () => {
    const result = cancelContractSchema.safeParse({ cancelReason: "No longer needed" });
    expect(result.success).toBe(true);
  });

  it("rejects reason over 500 chars", () => {
    const result = cancelContractSchema.safeParse({ cancelReason: "x".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("patchContractSchema", () => {
  it("accepts empty object", () => {
    const result = patchContractSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts terms update", () => {
    const result = patchContractSchema.safeParse({ terms: "New payment terms" });
    expect(result.success).toBe(true);
  });

  it("accepts agree flag", () => {
    const result = patchContractSchema.safeParse({ agree: true });
    expect(result.success).toBe(true);
  });

  it("accepts party terms", () => {
    const result = patchContractSchema.safeParse({
      partyATerms: "My terms",
      partyBTerms: "Their terms",
      partyAUseMessageTerms: true,
      partyBUseMessageTerms: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty terms string", () => {
    const result = patchContractSchema.safeParse({ terms: "" });
    expect(result.success).toBe(false);
  });

  it("rejects terms over 10000 chars", () => {
    const result = patchContractSchema.safeParse({ terms: "x".repeat(10001) });
    expect(result.success).toBe(false);
  });

  it("rejects party terms over 5000 chars", () => {
    const result = patchContractSchema.safeParse({ partyATerms: "x".repeat(5001) });
    expect(result.success).toBe(false);
  });
});
