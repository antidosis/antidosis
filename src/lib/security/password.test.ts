import { describe, it, expect } from "vitest";

import { validatePassword, getPasswordStrength } from "./password";

describe("validatePassword", () => {
  it("accepts a strong password", () => {
    const result = validatePassword("MyP@ssw0rd");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects password under 8 chars", () => {
    const result = validatePassword("Short1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least 8 characters");
  });

  it("rejects password without uppercase", () => {
    const result = validatePassword("myp@ssw0rd");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one uppercase letter");
  });

  it("rejects password without lowercase", () => {
    const result = validatePassword("MYP@SSW0RD");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one lowercase letter");
  });

  it("rejects password without number", () => {
    const result = validatePassword("MyPassword!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one number");
  });

  it("rejects password without special character", () => {
    const result = validatePassword("MyPassword1");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("at least one special character");
  });

  it("reports multiple errors", () => {
    const result = validatePassword("short");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it("accepts password with all special chars", () => {
    const chars = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?";
    for (const ch of chars) {
      const result = validatePassword(`MyP${ch}ssw0rd`);
      expect(result.valid).toBe(true);
    }
  });
});

describe("getPasswordStrength", () => {
  it("rates very short password as weak", () => {
    expect(getPasswordStrength("abc")).toBe("weak");
  });

  it("rates simple 8-char password as weak", () => {
    expect(getPasswordStrength("abcdefgh")).toBe("weak");
  });

  it("rates password with some variety as strong", () => {
    expect(getPasswordStrength("Abcdefgh1")).toBe("strong");
  });

  it("rates strong password as very-strong", () => {
    expect(getPasswordStrength("MyPass123!")).toBe("very-strong");
  });

  it("rates very strong password as very-strong", () => {
    expect(getPasswordStrength("MyStr0ng!Pass")).toBe("very-strong");
  });

  it("considers length >= 12 for extra point", () => {
    const long = getPasswordStrength("Abcdefgh123!");
    expect(long).not.toBe("weak");
  });
});
