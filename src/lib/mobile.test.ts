import { describe, expect, it } from "vitest";

import { isValidAustralianMobile, maskMobile, normalizeMobile } from "./mobile";

describe("normalizeMobile", () => {
  it("normalizes '0412 345 678' to '+61412345678'", () => {
    expect(normalizeMobile("0412 345 678")).toBe("+61412345678");
  });

  it("normalizes '412345678' to '+61412345678'", () => {
    expect(normalizeMobile("412345678")).toBe("+61412345678");
  });

  it("normalizes '61412345678' to '+61412345678'", () => {
    expect(normalizeMobile("61412345678")).toBe("+61412345678");
  });

  it("returns already normalized '+61412345678' unchanged", () => {
    expect(normalizeMobile("+61412345678")).toBe("+61412345678");
  });

  it("returns input unchanged when it does not match any known pattern", () => {
    expect(normalizeMobile("not-a-number")).toBe("not-a-number");
    expect(normalizeMobile("+441234567890")).toBe("+61441234567890");
    expect(normalizeMobile("abc")).toBe("abc");
    expect(normalizeMobile("123")).toBe("123");
    expect(normalizeMobile("")).toBe("");
  });
});

describe("isValidAustralianMobile", () => {
  it("returns true for already normalized '+61412345678'", () => {
    expect(isValidAustralianMobile("+61412345678")).toBe(true);
  });

  it("returns true for '0412 345 678' (normalizes first)", () => {
    expect(isValidAustralianMobile("0412 345 678")).toBe(true);
  });

  it("returns false for '+6141234567' (only 9 digits after +61)", () => {
    expect(isValidAustralianMobile("+6141234567")).toBe(false);
  });

  it("returns false for '+614123456789' (11 digits after +61)", () => {
    expect(isValidAustralianMobile("+614123456789")).toBe(false);
  });

  it("returns false for '+61512345678' (wrong prefix)", () => {
    expect(isValidAustralianMobile("+61512345678")).toBe(false);
  });

  it("returns false for non-numeric input", () => {
    expect(isValidAustralianMobile("not-a-number")).toBe(false);
  });
});

describe("maskMobile", () => {
  it("masks normalized '+61412345678' to '+61 4XX XXX 678'", () => {
    expect(maskMobile("+61412345678")).toBe("+61 4XX XXX 678");
  });

  it("masks unformatted '0412 345 678' to '+61 4XX XXX 678'", () => {
    expect(maskMobile("0412 345 678")).toBe("+61 4XX XXX 678");
  });

  it("returns invalid input unchanged", () => {
    expect(maskMobile("not-a-number")).toBe("not-a-number");
    expect(maskMobile("+6141234567")).toBe("+6141234567");
  });
});
