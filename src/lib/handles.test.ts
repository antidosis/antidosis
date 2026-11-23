import { describe, it, expect } from "vitest";

import { isReservedHandle, RESERVED_HANDLE_MESSAGE } from "./handles";

describe("isReservedHandle", () => {
  it("blocks exact impersonation handles", () => {
    for (const h of ["admin", "antidosis", "support", "official", "verified", "moderator"]) {
      expect(isReservedHandle(h)).toBe(true);
    }
  });

  it("blocks deceptive variants containing reserved tokens", () => {
    for (const h of [
      "admin1",
      "real_admin",
      "antidosis_support",
      "antidosis_official",
      "xverifiedx",
      "helpdesk_marty",
      "stafford_trader",
      "therootuser",
      "billing_team",
    ]) {
      expect(isReservedHandle(h)).toBe(true);
    }
  });

  it("allows ordinary handles", () => {
    for (const h of ["marti", "sarah_k", "coastie22", "garden_guru", "xqz"]) {
      expect(isReservedHandle(h)).toBe(false);
    }
  });

  it("is case-insensitive", () => {
    expect(isReservedHandle("ADMIN")).toBe(true);
    expect(isReservedHandle("Antidosis_Helper")).toBe(true);
  });

  it("exposes a helpful message", () => {
    expect(RESERVED_HANDLE_MESSAGE).toContain("reserved");
  });
});
