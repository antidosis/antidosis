import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockNeedFindUnique = vi.fn();
const mockNeedUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    need: {
      findUnique: (...args: unknown[]) => mockNeedFindUnique(...args),
      update: (...args: unknown[]) => mockNeedUpdate(...args),
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

describe("POST /api/v1/needs/[id]/repost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindUnique.mockReset();
    mockNeedFindUnique.mockReset();
    mockNeedUpdate.mockReset();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when need not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Need not found");
  });

  it("returns 403 when not poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "other-profile", status: "archived" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when need is not archived", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Can only re-post archived needs");
  });

  it("reposts archived need successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "archived" });
    mockNeedUpdate.mockResolvedValue({
      id: "need-1",
      status: "open",
      title: "Test Need",
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.need.status).toBe("open");
    expect(mockNeedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "need-1" },
        data: expect.objectContaining({ status: "open" }),
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "archived" });
    mockNeedUpdate.mockResolvedValue({ id: "need-1", status: "open" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/repost", { method: "POST" }),
      { params: { id: "need-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
