import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockAcceptanceFindUnique = vi.fn();
const mockReviewCreate = vi.fn();
const mockReviewAggregate = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
    contract: {
      findUnique: (...args: unknown[]) => mockContractFindUnique(...args),
    },
    acceptance: {
      findUnique: (...args: unknown[]) => mockAcceptanceFindUnique(...args),
    },
    review: {
      create: (...args: unknown[]) => mockReviewCreate(...args),
      aggregate: (...args: unknown[]) => mockReviewAggregate(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

// ─── Sanitize mock ───
vi.mock("@/lib/security/sanitize", () => ({
  sanitizePlainText: (input: string) => input,
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(body: Record<string, unknown>): NextRequest {
  const req = new Request("http://localhost/api/v1/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL("http://localhost/api/v1/reviews"),
    writable: true,
    configurable: true,
  });
  return req;
}

const C1 = "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const A1 = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const R1 = "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const PROF1 = "11111111-1111-1111-1111-111111111111";
const PROF2 = "22222222-2222-2222-2222-222222222222";
const PROF3 = "33333333-3333-3333-3333-333333333333";

function makeAuthUser(
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string | null }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("POST /api/v1/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when email not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: null }) },
      error: null,
    });
    const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("Rate limit exceeded");
  });

  it("returns 400 for invalid body (zod)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 11 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 when neither contractId nor acceptanceId provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const res = await POST(makeRequest({ receiverId: R1, rating: 5 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Either contractId or acceptanceId");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  describe("contract review", () => {
    beforeEach(() => {
      mockProfileFindUnique.mockResolvedValue({ id: PROF1 });
    });

    it("returns 404 when contract not found", async () => {
      mockContractFindUnique.mockResolvedValue(null);
      const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Contract not found");
    });

    it("returns 400 when contract not completed", async () => {
      mockContractFindUnique.mockResolvedValue({
        id: C1,
        status: "draft",
        partyAId: PROF1,
        partyBId: PROF2,
        reviews: [],
      });
      const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("completed");
    });

    it("returns 403 when user is not a party", async () => {
      mockContractFindUnique.mockResolvedValue({
        id: C1,
        status: "completed",
        partyAId: PROF2,
        partyBId: PROF3,
        reviews: [],
      });
      const res = await POST(makeRequest({ contractId: C1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Forbidden");
    });

    it("returns 400 for invalid review recipient", async () => {
      mockContractFindUnique.mockResolvedValue({
        id: C1,
        status: "completed",
        partyAId: PROF1,
        partyBId: PROF2,
        reviews: [],
      });
      const res = await POST(makeRequest({ contractId: C1, receiverId: PROF1, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid review recipient");
    });

    it("returns 400 when already reviewed", async () => {
      mockContractFindUnique.mockResolvedValue({
        id: C1,
        status: "completed",
        partyAId: PROF1,
        partyBId: PROF2,
        reviews: [{ giverId: PROF1, contractId: C1 }],
      });
      const res = await POST(makeRequest({ contractId: C1, receiverId: PROF2, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("already reviewed");
    });

    it("returns 201 and updates receiver rating", async () => {
      mockContractFindUnique.mockResolvedValue({
        id: C1,
        status: "completed",
        partyAId: PROF1,
        partyBId: PROF2,
        reviews: [],
      });
      mockReviewCreate.mockResolvedValue({ id: "rev-1" });
      mockReviewAggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });
      mockProfileUpdate.mockResolvedValue({ id: PROF2 });
      const res = await POST(
        makeRequest({ contractId: C1, receiverId: PROF2, rating: 5, comment: "Great" })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.review.id).toBe("rev-1");
      expect(mockProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROF2 },
          data: { ratingAvg: 5, ratingCount: 1 },
        })
      );
    });
  });

  describe("acceptance review", () => {
    beforeEach(() => {
      mockProfileFindUnique.mockResolvedValue({ id: PROF1 });
    });

    it("returns 404 when acceptance not found", async () => {
      mockAcceptanceFindUnique.mockResolvedValue(null);
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Acceptance not found");
    });

    it("returns 400 when acceptance requires contract", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: true, posterId: PROF2 },
        userId: PROF3,
        status: "completed",
        reviews: [],
      });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("requires a contract");
    });

    it("returns 400 when deal not completed", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: false, posterId: PROF2 },
        userId: PROF3,
        status: "active",
        reviews: [],
      });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("completed");
    });

    it("returns 403 when user is neither poster nor fulfiller", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: false, posterId: PROF2 },
        userId: PROF3,
        status: "completed",
        reviews: [],
      });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: R1, rating: 5 }));
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Forbidden");
    });

    it("returns 400 for invalid review recipient (poster)", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: false, posterId: PROF1 },
        userId: PROF3,
        status: "completed",
        reviews: [],
      });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: PROF1, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid review recipient");
    });

    it("returns 400 for invalid review recipient (fulfiller)", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: false, posterId: PROF2 },
        userId: PROF1,
        status: "completed",
        reviews: [],
      });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: PROF1, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid review recipient");
    });

    it("returns 400 when already reviewed", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: false, posterId: PROF2 },
        userId: PROF1,
        status: "completed",
        reviews: [{ giverId: PROF1, acceptanceId: A1 }],
      });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: PROF2, rating: 5 }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("already reviewed");
    });

    it("returns 201 and updates receiver rating for acceptance review", async () => {
      mockAcceptanceFindUnique.mockResolvedValue({
        id: A1,
        need: { requiresContract: false, posterId: PROF2 },
        userId: PROF1,
        status: "completed",
        reviews: [],
      });
      mockReviewCreate.mockResolvedValue({ id: "rev-1" });
      mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: { rating: 2 } });
      mockProfileUpdate.mockResolvedValue({ id: PROF2 });
      const res = await POST(makeRequest({ acceptanceId: A1, receiverId: PROF2, rating: 4 }));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.review.id).toBe("rev-1");
      expect(mockProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROF2 },
          data: { ratingAvg: 4, ratingCount: 2 },
        })
      );
    });
  });
});
