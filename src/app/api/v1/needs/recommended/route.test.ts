import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockNeedFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    need: {
      findMany: (...args: unknown[]) => mockNeedFindMany(...args),
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

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
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

describe("GET /api/v1/needs/recommended", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindUnique.mockReset();
    mockNeedFindMany.mockReset();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/recommended"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/recommended"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns empty needs when user has no skills", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", skills: [] });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/recommended"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.needs).toEqual([]);
    expect(body.message).toBe("Add skills to your profile to get recommendations");
  });

  it("returns recommended needs sorted by match count", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      skills: [{ name: "Plumbing" }, { name: "Electrical" }],
    });
    mockNeedFindMany.mockResolvedValue([
      {
        id: "need-1",
        title: "Need plumber and electrician",
        requiredSkills: [{ name: "Plumbing" }, { name: "Electrical" }],
        poster: {
          id: "poster-1",
          fullName: "Poster",
          avatarUrl: null,
          ratingAvg: 0,
          ratingCount: 0,
          locationName: null,
        },
        _count: { acceptances: 2 },
      },
      {
        id: "need-2",
        title: "Need electrician",
        requiredSkills: [{ name: "Electrical" }],
        poster: {
          id: "poster-2",
          fullName: "Poster 2",
          avatarUrl: null,
          ratingAvg: 0,
          ratingCount: 0,
          locationName: null,
        },
        _count: { acceptances: 0 },
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/recommended"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.needs).toHaveLength(2);
    expect(body.needs[0].id).toBe("need-1");
    expect(body.needs[1].id).toBe("need-2");
    expect(body.matchInfo).toEqual([
      { needId: "need-1", matchCount: 2, matchingSkillNames: ["Plumbing", "Electrical"] },
      { needId: "need-2", matchCount: 1, matchingSkillNames: ["Electrical"] },
    ]);
  });

  it("excludes user's own needs", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      skills: [{ name: "Plumbing" }],
    });
    mockNeedFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/needs/recommended"));

    const call = mockNeedFindMany.mock.calls[0][0];
    expect(call.where.posterId).toEqual({ not: "profile-1" });
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", skills: [] });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/recommended"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
