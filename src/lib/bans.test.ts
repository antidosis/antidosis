import { describe, it, expect, vi, beforeEach } from "vitest";

import { recordBannedMobile, isMobileBanned, clearBannedMobile } from "./bans";

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bannedMobile: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}));

describe("recordBannedMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts the mobile with reason and profile reference", async () => {
    await recordBannedMobile({ id: "profile-1", mobile: "+61400123456", bannedReason: "scam" });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { mobile: "+61400123456" },
      create: { mobile: "+61400123456", reason: "scam", profileId: "profile-1" },
      update: { reason: "scam", profileId: "profile-1", bannedAt: expect.any(Date) },
    });
  });

  it("defaults a missing reason to null", async () => {
    await recordBannedMobile({ id: "profile-1", mobile: "+61400123456" });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ reason: null }),
      })
    );
  });

  it("is a no-op when the profile has no mobile", async () => {
    await recordBannedMobile({ id: "profile-1", mobile: null });

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe("isMobileBanned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when a banned_mobiles row exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "bm-1" });

    expect(await isMobileBanned("+61400123456")).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { mobile: "+61400123456" },
      select: { id: true },
    });
  });

  it("returns false when no row exists", async () => {
    mockFindUnique.mockResolvedValue(null);

    expect(await isMobileBanned("+61400123456")).toBe(false);
  });
});

describe("clearBannedMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes by mobile or historical profile id", async () => {
    await clearBannedMobile("profile-1");

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { OR: [{ mobile: "profile-1" }, { profileId: "profile-1" }] },
    });
  });
});
