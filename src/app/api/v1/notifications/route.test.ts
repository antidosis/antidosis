import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockNotificationFindMany = vi.fn();
const mockNotificationCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    notification: {
      findMany: (...args: unknown[]) => mockNotificationFindMany(...args),
      count: (...args: unknown[]) => mockNotificationCount(...args),
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

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/v1/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/notifications"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/notifications"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with all notifications and unread count", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNotificationFindMany.mockResolvedValue([
      { id: "n1", type: "message", title: "New message", isRead: false, createdAt: new Date() },
      { id: "n2", type: "contract", title: "Contract update", isRead: true, createdAt: new Date() },
    ]);
    mockNotificationCount.mockResolvedValue(1);

    const res = await GET(makeRequest("http://localhost/api/v1/notifications"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.notifications).toHaveLength(2);
    expect(body.unreadCount).toBe(1);
    expect(mockNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "profile-1" },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    );
  });

  it("filters unread only when unreadOnly=true", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNotificationFindMany.mockResolvedValue([
      { id: "n1", type: "message", title: "New message", isRead: false, createdAt: new Date() },
    ]);
    mockNotificationCount.mockResolvedValue(1);

    const res = await GET(makeRequest("http://localhost/api/v1/notifications?unreadOnly=true"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.notifications).toHaveLength(1);
    expect(mockNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "profile-1", isRead: false },
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNotificationFindMany.mockResolvedValue([]);
    mockNotificationCount.mockResolvedValue(0);

    const res = await GET(makeRequest("http://localhost/api/v1/notifications"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
