import { describe, it, expect, vi, beforeEach } from "vitest";

import { requireVerifiedParticipation } from "./participation";

const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

describe("requireVerifiedParticipation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the profile does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await requireVerifiedParticipation("user-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(404);
    }
  });

  it("rejects suspended accounts with ACCOUNT_SUSPENDED", async () => {
    mockFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: new Date("2026-01-01"),
    });

    const result = await requireVerifiedParticipation("user-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.code).toBe("ACCOUNT_SUSPENDED");
    }
  });

  it("rejects unverified mobiles with MOBILE_NOT_VERIFIED", async () => {
    mockFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: false,
      bannedAt: null,
    });

    const result = await requireVerifiedParticipation("user-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.code).toBe("MOBILE_NOT_VERIFIED");
      expect(body.error).toContain("/verify-mobile");
    }
  });

  it("allows verified, non-banned profiles", async () => {
    mockFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
    });

    const result = await requireVerifiedParticipation("user-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.profileId).toBe("profile-1");
    }
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true, mobileVerified: true, bannedAt: true },
    });
  });
});
