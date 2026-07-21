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

describe("GET /api/v1/needs/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindUnique.mockReset();
    mockNeedFindMany.mockReset();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/mine"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns empty array when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/mine"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns needs for the current user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindMany.mockResolvedValue([
      {
        id: "need-1",
        title: "My Need",
        status: "open",
        createdAt: "2024-01-01T00:00:00Z",
        _count: { acceptances: 1 },
        acceptances: [{ id: "acc-1" }],
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/mine"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("My Need");
    expect(mockNeedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { posterId: "profile-1" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("filters acceptances to status accepted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/needs/mine"));

    const call = mockNeedFindMany.mock.calls[0][0];
    expect(call.select.acceptances.where).toEqual({ status: "accepted" });
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/mine"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
