import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileFindMany = vi.fn();
const mockBlockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
    },
    block: { findMany: (...args: unknown[]) => mockBlockFindMany(...args) },
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

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/v1/terminal/users/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 when query is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Query required");
  });

  it("returns 400 when query is empty after trim", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=   "));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Query required");
  });

  it("excludes blocked users from results", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([{ blockerId: "profile-1", blockedId: "profile-2" }]);
    mockProfileFindMany.mockResolvedValue([
      { id: "profile-3", fullName: "Alice", avatarUrl: null, locationName: "Sydney" },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: expect.arrayContaining(["profile-1", "profile-2"]) },
        }),
      })
    );
  });

  it("returns 200 with search results", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockProfileFindMany.mockResolvedValue([
      { id: "profile-2", fullName: "Alice", avatarUrl: null, locationName: "Melbourne" },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.users[0].fullName).toBe("Alice");
  });

  it("trims and slices query to 50 characters", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockProfileFindMany.mockResolvedValue([]);

    const longQuery = "a".repeat(100);
    await GET(makeRequest(`http://localhost/api/v1/terminal/users/search?q=${longQuery}`));

    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.OR[0].fullName.contains).toBe("a".repeat(50));
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockProfileFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/users/search?q=alice"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
