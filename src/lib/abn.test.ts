import { afterEach, describe, expect, it, vi } from "vitest";

import { formatAbn, isValidAbnChecksum, lookupAbnWithAbr, normalizeAbn, verifyAbn } from "./abn";

// ATO-published example ABNs (pass the weighted mod-89 checksum).
const VALID_ABN = "51 824 753 556";
const VALID_ABN_COMPACT = "51824753556";

describe("normalizeAbn", () => {
  it("strips spaces", () => {
    expect(normalizeAbn("12 345 678 901")).toBe("12345678901");
  });

  it("strips other formatting characters", () => {
    expect(normalizeAbn("ABN: 51-824-753-556")).toBe("51824753556");
  });

  it("passes through already-compact values", () => {
    expect(normalizeAbn(VALID_ABN_COMPACT)).toBe(VALID_ABN_COMPACT);
  });
});

describe("formatAbn", () => {
  it("formats compact digits into display groups", () => {
    expect(formatAbn("51824753556")).toBe("51 824 753 556");
  });

  it("normalises first, then formats", () => {
    expect(formatAbn("51 824 753 556")).toBe("51 824 753 556");
  });

  it("leaves short input untouched", () => {
    expect(formatAbn("12345")).toBe("12345");
  });
});

describe("isValidAbnChecksum", () => {
  it("accepts a known-valid ABN with spaces", () => {
    expect(isValidAbnChecksum(VALID_ABN)).toBe(true);
  });

  it("accepts a known-valid compact ABN", () => {
    expect(isValidAbnChecksum(VALID_ABN_COMPACT)).toBe(true);
  });

  it("rejects a checksum-invalid ABN", () => {
    expect(isValidAbnChecksum("51824753557")).toBe(false);
  });

  it("rejects the sequential placeholder 12345678901", () => {
    expect(isValidAbnChecksum("12345678901")).toBe(false);
  });

  it("rejects wrong lengths", () => {
    expect(isValidAbnChecksum("5182475355")).toBe(false);
    expect(isValidAbnChecksum("518247535561")).toBe(false);
    expect(isValidAbnChecksum("")).toBe(false);
  });

  it("rejects non-numeric content", () => {
    expect(isValidAbnChecksum("abcdefghijk")).toBe(false);
  });
});

describe("lookupAbnWithAbr", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when no GUID is configured", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await lookupAbnWithAbr(VALID_ABN_COMPACT)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("returns valid with entity name for an active ABN", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "test-guid");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Abn: VALID_ABN_COMPACT,
          EntityName: "EXAMPLE PTY LTD",
          AbnStatus: "Active from 01 Jan 2000",
        }),
      })
    );
    const result = await lookupAbnWithAbr(VALID_ABN_COMPACT);
    expect(result).toEqual({ valid: true, entityName: "EXAMPLE PTY LTD" });
  });

  it("returns invalid for a cancelled ABN", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "test-guid");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Abn: VALID_ABN_COMPACT,
          EntityName: "OLD BUSINESS PTY LTD",
          AbnStatus: "Cancelled from 01 Jan 2019",
        }),
      })
    );
    const result = await lookupAbnWithAbr(VALID_ABN_COMPACT);
    expect(result).toEqual({ valid: false, entityName: null });
  });

  it("throws on HTTP failure so callers can fail closed or degrade", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "test-guid");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(lookupAbnWithAbr(VALID_ABN_COMPACT)).rejects.toThrow("ABR lookup failed");
  });
});

describe("verifyAbn", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("short-circuits on checksum failure without calling the ABR", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "test-guid");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await verifyAbn("12345678901");
    expect(result).toEqual({
      normalised: "12345678901",
      checksumValid: false,
      verified: false,
      entityName: null,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("checksum-valid but unverified when no GUID configured", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "");
    const result = await verifyAbn(VALID_ABN);
    expect(result.checksumValid).toBe(true);
    expect(result.verified).toBe(false);
    expect(result.normalised).toBe(VALID_ABN_COMPACT);
  });

  it("marks verified when the ABR confirms an active ABN", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "test-guid");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Abn: VALID_ABN_COMPACT,
          EntityName: "EXAMPLE PTY LTD",
          AbnStatus: "Active from 01 Jan 2000",
        }),
      })
    );
    const result = await verifyAbn(VALID_ABN);
    expect(result.verified).toBe(true);
    expect(result.entityName).toBe("EXAMPLE PTY LTD");
  });

  it("degrades to checksum-only when the ABR is unreachable", async () => {
    vi.stubEnv("ABR_LOOKUP_GUID", "test-guid");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await verifyAbn(VALID_ABN);
    expect(result.checksumValid).toBe(true);
    expect(result.verified).toBe(false);
    expect(result.entityName).toBeNull();
  });
});
