import { describe, it, expect } from "vitest";

import {
  uuidSchema,
  urlSchema,
  optionalUrlSchema,
  sanitizedStringSchema,
  coordinatesSchema,
  attachmentSchema,
  offerTypeSchema,
  needStatusSchema,
  contractStatusSchema,
} from "./common";

describe("uuidSchema", () => {
  it("accepts a valid UUID", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = uuidSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = uuidSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("urlSchema", () => {
  it("accepts a valid HTTPS URL", () => {
    const result = urlSchema.safeParse("https://example.com/path");
    expect(result.success).toBe(true);
  });

  it("accepts a valid HTTP URL", () => {
    const result = urlSchema.safeParse("http://example.com");
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = urlSchema.safeParse("not-a-url");
    expect(result.success).toBe(false);
  });

  it("rejects URL over 500 chars", () => {
    const result = urlSchema.safeParse("https://example.com/" + "a".repeat(500));
    expect(result.success).toBe(false);
  });
});

describe("optionalUrlSchema", () => {
  it("accepts null", () => {
    const result = optionalUrlSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("accepts undefined", () => {
    const result = optionalUrlSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("accepts empty string", () => {
    const result = optionalUrlSchema.safeParse("");
    expect(result.success).toBe(true);
  });

  it("accepts valid URL", () => {
    const result = optionalUrlSchema.safeParse("https://example.com");
    expect(result.success).toBe(true);
  });
});

describe("sanitizedStringSchema", () => {
  const schema = sanitizedStringSchema(50);

  it("accepts valid string", () => {
    const result = schema.safeParse("Hello world");
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects string over max", () => {
    const result = schema.safeParse("a".repeat(51));
    expect(result.success).toBe(false);
  });

  it("accepts string at max length", () => {
    const result = schema.safeParse("a".repeat(50));
    expect(result.success).toBe(true);
  });
});

describe("coordinatesSchema", () => {
  it("accepts null coordinates", () => {
    const result = coordinatesSchema.safeParse({ latitude: null, longitude: null });
    expect(result.success).toBe(true);
  });

  it("accepts valid coordinates", () => {
    const result = coordinatesSchema.safeParse({
      latitude: -33.45,
      longitude: 151.45,
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial coordinates", () => {
    const result = coordinatesSchema.safeParse({ latitude: -33.45 });
    expect(result.success).toBe(true);
  });

  it("rejects non-number latitude", () => {
    const result = coordinatesSchema.safeParse({ latitude: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("attachmentSchema", () => {
  it("accepts valid attachment", () => {
    const result = attachmentSchema.safeParse({
      url: "https://example.com/file.pdf",
      type: "application/pdf",
      name: "document.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("accepts HTTP URL", () => {
    const result = attachmentSchema.safeParse({
      url: "http://example.com/file.pdf",
      type: "application/pdf",
      name: "document.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = attachmentSchema.safeParse({ url: "https://example.com/file.pdf" });
    expect(result.success).toBe(false);
  });

  it("rejects javascript: URL", () => {
    const result = attachmentSchema.safeParse({
      url: "javascript:alert(1)",
      type: "application/pdf",
      name: "evil.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects data: URL", () => {
    const result = attachmentSchema.safeParse({
      url: "data:text/html,<script>alert(1)</script>",
      type: "application/pdf",
      name: "evil.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects ftp: URL", () => {
    const result = attachmentSchema.safeParse({
      url: "ftp://example.com/file.pdf",
      type: "application/pdf",
      name: "evil.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL string", () => {
    const result = attachmentSchema.safeParse({
      url: "not-a-url",
      type: "application/pdf",
      name: "bad.pdf",
    });
    expect(result.success).toBe(false);
  });
});

describe("offerTypeSchema", () => {
  it("accepts valid offer types", () => {
    expect(offerTypeSchema.safeParse("service").success).toBe(true);
    expect(offerTypeSchema.safeParse("item").success).toBe(true);
    expect(offerTypeSchema.safeParse("money").success).toBe(true);
  });

  it("rejects invalid offer type", () => {
    expect(offerTypeSchema.safeParse("cash").success).toBe(false);
  });
});

describe("needStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(needStatusSchema.safeParse("open").success).toBe(true);
    expect(needStatusSchema.safeParse("archived").success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(needStatusSchema.safeParse("deleted").success).toBe(false);
  });
});

describe("contractStatusSchema", () => {
  it("accepts all valid statuses", () => {
    const statuses = ["draft", "pending_terms", "active", "completed", "cancelled"];
    for (const status of statuses) {
      expect(contractStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    expect(contractStatusSchema.safeParse("expired").success).toBe(false);
  });
});
