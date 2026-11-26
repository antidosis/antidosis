import { describe, it, expect, vi } from "vitest";

import {
  assessBusinessPosting,
  getBusinessPostingEligibility,
  reviewReceiverContext,
} from "./business-posting";

const mockProfileFindUnique = vi.fn();
const mockSpecialtyCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    directorySpecialty: {
      count: (...args: unknown[]) => mockSpecialtyCount(...args),
    },
  },
}));

const liveBusiness = {
  accountType: "business",
  abn: "12345678901",
  businessName: "Acme Plumbing",
  fullName: "Martin K",
  showInDirectory: true,
};

describe("assessBusinessPosting", () => {
  it("is eligible with a business account, ABN, specialty and live listing", () => {
    const result = assessBusinessPosting(liveBusiness, 1);
    expect(result.eligible).toBe(true);
    expect(result.businessName).toBe("Acme Plumbing");
    expect(result.abn).toBe("12345678901");
    expect(result.reason).toBeNull();
  });

  it("prefers the trading name and falls back to the member's name", () => {
    expect(assessBusinessPosting({ ...liveBusiness, businessName: null }, 1).businessName).toBe(
      "Martin K"
    );
    expect(assessBusinessPosting({ ...liveBusiness, businessName: "  " }, 1).businessName).toBe(
      "Martin K"
    );
  });

  it("rejects individual accounts", () => {
    const result = assessBusinessPosting(
      { ...liveBusiness, accountType: "individual", abn: null },
      0
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/business account/i);
  });

  it("rejects business accounts without an ABN", () => {
    const result = assessBusinessPosting({ ...liveBusiness, abn: null }, 1);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/ABN/);
  });

  it("rejects accounts with no claimed specialty", () => {
    const result = assessBusinessPosting(liveBusiness, 0);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/specialty/i);
  });

  it("rejects hidden directory listings", () => {
    const result = assessBusinessPosting({ ...liveBusiness, showInDirectory: false }, 1);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/hidden/i);
  });
});

describe("getBusinessPostingEligibility", () => {
  it("returns ineligible when the profile is missing", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    const result = await getBusinessPostingEligibility("missing");
    expect(result.eligible).toBe(false);
  });

  it("combines the profile and specialty count", async () => {
    mockProfileFindUnique.mockResolvedValue(liveBusiness);
    mockSpecialtyCount.mockResolvedValue(2);
    const result = await getBusinessPostingEligibility("profile-1");
    expect(result.eligible).toBe(true);
    expect(mockSpecialtyCount).toHaveBeenCalledWith({ where: { profileId: "profile-1" } });
  });
});

describe("reviewReceiverContext", () => {
  it("routes to business only when the receiver posted the need as a business", () => {
    expect(
      reviewReceiverContext({
        needPostedAs: "business",
        needPosterId: "poster-1",
        receiverId: "poster-1",
      })
    ).toBe("business");
  });

  it("keeps the fulfiller personal on a business-posted need", () => {
    expect(
      reviewReceiverContext({
        needPostedAs: "business",
        needPosterId: "poster-1",
        receiverId: "fulfiller-1",
      })
    ).toBe("personal");
  });

  it("keeps personal posts personal", () => {
    expect(
      reviewReceiverContext({
        needPostedAs: "personal",
        needPosterId: "poster-1",
        receiverId: "poster-1",
      })
    ).toBe("personal");
  });

  it("keeps direct agreements (no need) personal", () => {
    expect(
      reviewReceiverContext({ needPostedAs: null, needPosterId: null, receiverId: "anyone" })
    ).toBe("personal");
  });
});
