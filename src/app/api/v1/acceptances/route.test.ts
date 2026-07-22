import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockNeedFindUnique = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockAcceptanceFindFirst = vi.fn();
const mockAcceptanceCreate = vi.fn();
const mockCredentialFindMany = vi.fn();
const mockPosterProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: {
      findUnique: (...args: unknown[]) => mockNeedFindUnique(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    acceptance: {
      findFirst: (...args: unknown[]) => mockAcceptanceFindFirst(...args),
      create: (...args: unknown[]) => mockAcceptanceCreate(...args),
    },
    credential: {
      findMany: (...args: unknown[]) => mockCredentialFindMany(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

// ─── Email mock ───
vi.mock("@/lib/email", () => ({
  sendInterestReceivedEmail: vi.fn(),
}));

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

// ─── Helpers ───
function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/acceptances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

function makeAuthUser(
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("POST /api/v1/acceptances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest({ needId: "need-1", message: "Interested" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(makeRequest({ needId: "need-1", message: "Interested" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 403 when mobile is not verified (participation gate)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: false,
      bannedAt: null,
    });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("MOBILE_NOT_VERIFIED");
    expect(mockNeedFindUnique).not.toHaveBeenCalled();
    expect(mockAcceptanceCreate).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
    });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeRequest({ needId: "need-1", message: "Interested" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("Too many expressions of interest");
  });

  it("returns 400 for invalid body", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
    });

    const res = await POST(makeRequest({ needId: "not-a-uuid" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("returns 404 when need not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
    });
    mockNeedFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Need not found");
  });

  it("returns 400 when need is not open", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
    });
    mockNeedFindUnique.mockResolvedValue({
      status: "completed",
      posterId: "profile-2",
      title: "Done",
    });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Need is not open");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Need",
      requiredSkills: [],
    });
    // First call passes the participation gate; second is the route's own lookup.
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", mobileVerified: true, bannedAt: null })
      .mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 when trying to accept own need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({ status: "open", posterId: "profile-1", title: "Need" });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Me",
      mobileVerified: true,
      bannedAt: null,
    });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot accept your own need");
  });

  it("returns 400 when already expressed interest", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Need",
      requiredSkills: [],
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Me",
      mobileVerified: true,
      bannedAt: null,
    });
    mockAcceptanceFindFirst.mockResolvedValue({ id: "existing" });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("already expressed interest");
  });

  it("returns 201 on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Need",
      requiredSkills: [],
    });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", mobileVerified: true, bannedAt: null })
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ email: "poster@example.com", fullName: "Poster" });
    mockAcceptanceFindFirst.mockResolvedValue(null);
    mockAcceptanceCreate.mockResolvedValue({
      id: "acc-1",
      needId: "need-1",
      userId: "profile-1",
      user: { id: "profile-1", fullName: "Me", avatarUrl: null, ratingAvg: 5, skills: [] },
    });

    const res = await POST(
      makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", message: "Hello" })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.acceptance.id).toBe("acc-1");
    expect(mockAcceptanceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          userId: "profile-1",
          message: "Hello",
        }),
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Need",
      requiredSkills: [],
    });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", mobileVerified: true, bannedAt: null })
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ email: "poster@example.com", fullName: "Poster" });
    mockAcceptanceFindFirst.mockResolvedValue(null);
    mockAcceptanceCreate.mockResolvedValue({ id: "acc-1" });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });

  it("returns 403 LICENCE_REQUIRED for regulated trade work without a verified licence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Rewire my shed",
      requiredSkills: [{ name: "Electrician" }],
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Me",
      mobileVerified: true,
      bannedAt: null,
    });
    mockCredentialFindMany.mockResolvedValue([]);

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("LICENCE_REQUIRED");
    expect(body.trade).toBe("electrical");
    expect(body.error).toContain("electrician");
    expect(mockAcceptanceCreate).not.toHaveBeenCalled();
  });

  it("allows regulated trade work with a matching verified licence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Rewire my shed",
      requiredSkills: [{ name: "Electrician" }],
    });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", mobileVerified: true, bannedAt: null })
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ email: "poster@example.com", fullName: "Poster" });
    mockCredentialFindMany.mockResolvedValue([
      { type: "license", title: "Electrician - NSW Fair Trading", isVerified: true },
    ]);
    mockAcceptanceFindFirst.mockResolvedValue(null);
    mockAcceptanceCreate.mockResolvedValue({ id: "acc-1" });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));

    expect(res.status).toBe(201);
    expect(mockCredentialFindMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1", type: "license", isVerified: true },
      select: { type: true, title: true, isVerified: true },
    });
  });

  it("does not gate unregulated needs", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      status: "open",
      posterId: "profile-2",
      title: "Help moving furniture",
      requiredSkills: [{ name: "Lifting" }],
    });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", mobileVerified: true, bannedAt: null })
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ email: "poster@example.com", fullName: "Poster" });
    mockAcceptanceFindFirst.mockResolvedValue(null);
    mockAcceptanceCreate.mockResolvedValue({ id: "acc-1" });

    const res = await POST(makeRequest({ needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }));

    expect(res.status).toBe(201);
    expect(mockCredentialFindMany).not.toHaveBeenCalled();
  });
});
