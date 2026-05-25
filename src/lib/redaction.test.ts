import { describe, it, expect } from "vitest";

import {
  redactDocumentNumber,
  redactDescription,
  redactCredential,
  formatCredentialRedacted,
  formatCredentialForMessage,
} from "./redaction";

describe("redactDocumentNumber", () => {
  it("masks all but last 4 digits", () => {
    expect(redactDocumentNumber("123456789012")).toBe("********9012");
  });

  it("handles short numbers by masking all", () => {
    expect(redactDocumentNumber("1234")).toBe("****");
  });

  it("returns em-dash for null/undefined", () => {
    expect(redactDocumentNumber(null)).toBe("—");
    expect(redactDocumentNumber(undefined)).toBe("—");
    expect(redactDocumentNumber("")).toBe("—");
  });

  it("handles exactly 5 digits", () => {
    expect(redactDocumentNumber("12345")).toBe("*2345");
  });
});

describe("redactDescription", () => {
  it("redacts credit card numbers", () => {
    const text = "My card is 4111 1111 1111 1111";
    expect(redactDescription(text)).toContain("****-****-****-####");
    expect(redactDescription(text)).not.toContain("1111");
  });

  it("redacts SSN patterns", () => {
    const text = "SSN: 123-45-6789";
    expect(redactDescription(text)).toContain("***-**-####");
  });

  it("redacts passport numbers", () => {
    const text = "Passport PA1234567";
    expect(redactDescription(text)).toContain("********");
    expect(redactDescription(text)).not.toContain("PA1234567");
  });

  it("redacts ABN numbers", () => {
    const text = "ABN 12 345 678 901";
    expect(redactDescription(text)).toContain("** *** *** ***");
  });

  it("redacts TFN numbers", () => {
    const text = "TFN 123 456 789";
    expect(redactDescription(text)).toContain("*** *** ***");
  });

  it("redacts international phone numbers", () => {
    const text = "Call me at +61 412 345 678";
    const result = redactDescription(text);
    expect(result).not.toContain("+61 412 345 678");
    expect(result).toContain("+");
  });

  it("redacts long generic number sequences", () => {
    const text = "My code is 98765432";
    expect(redactDescription(text)).toContain("********");
  });

  it("preserves dates", () => {
    const text = "Date: 2026-05-25 and 25/05/2026";
    const result = redactDescription(text);
    expect(result).toContain("2026-05-25");
    expect(result).toContain("25/05/2026");
  });

  it("preserves short dates", () => {
    const text = "Date: 05-25-2026";
    expect(redactDescription(text)).toContain("05-25-2026");
  });

  it("returns empty string for null/undefined", () => {
    expect(redactDescription(null)).toBe("");
    expect(redactDescription(undefined)).toBe("");
  });

  it("leaves safe text unchanged", () => {
    const text = "I need a plumber for my kitchen sink";
    expect(redactDescription(text)).toBe(text);
  });

  it("redacts multiple sensitive patterns in one text", () => {
    const text = "Card: 4111111111111111, SSN: 123-45-6789";
    const result = redactDescription(text);
    expect(result).toContain("****-****-****-####");
    expect(result).toContain("***-**-####");
  });
});

describe("redactCredential", () => {
  it("removes file URLs and redacts document number", () => {
    const cred = {
      id: "1",
      title: "Driver's Licence",
      documentNumber: "12345678",
      description: "My licence",
      fileUrl: "https://example.com/file.pdf",
      backFileUrl: "https://example.com/back.pdf",
    };
    const result = redactCredential(cred);

    expect(result).not.toHaveProperty("fileUrl");
    expect(result).not.toHaveProperty("backFileUrl");
    expect(result.documentNumber).toBe("****5678");
    expect(result.id).toBe("1");
    expect(result.title).toBe("Driver's Licence");
  });

  it("handles credential with no sensitive data", () => {
    const cred = { id: "2", title: "Qualification" };
    const result = redactCredential(cred);
    expect(result.id).toBe("2");
    expect(result.title).toBe("Qualification");
  });
});

describe("formatCredentialRedacted", () => {
  it("formats credential with all fields", () => {
    const result = formatCredentialRedacted({
      title: "Test Cert",
      type: "certification",
      documentNumber: "ABC12345",
      issuedBy: "TAFE",
      expiresAt: new Date("2026-12-31"),
      description: "My cert",
    });

    expect(result).toContain("📋 Test Cert");
    expect(result).toContain("Type: certification");
    expect(result).toContain("Number: ****2345");
    expect(result).toContain("Issued by: TAFE");
    expect(result).toContain("Expires:");
    expect(result).toContain("Note:");
  });

  it("formats credential with minimal fields", () => {
    const result = formatCredentialRedacted({
      title: "Basic",
      type: "other",
    });
    expect(result).toBe("📋 Basic\n   Type: other");
  });
});

describe("formatCredentialForMessage", () => {
  it("formats shared credential message", () => {
    const result = formatCredentialForMessage({
      title: "WWCC",
      type: "wwcc",
      documentNumber: "WWC123456",
      issuedBy: "NSW",
      expiresAt: new Date("2027-01-15"),
    });

    expect(result).toContain("Shared credential: WWCC");
    expect(result).toContain("Type: wwcc");
    expect(result).toContain("Number:");
    expect(result).not.toContain("WWC123456");
    expect(result).toContain("Issued by: NSW");
    expect(result).toContain("Expires:");
    expect(result).toContain("🔒 Full details available upon request");
  });
});
