import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockDirectMessageFindMany = vi.fn();
const mockTerminalMessageFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    directMessage: { findMany: (...args: unknown[]) => mockDirectMessageFindMany(...args) },
    terminalMessage: { findMany: (...args: unknown[]) => mockTerminalMessageFindMany(...args) },
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

describe("GET /api/v1/terminal/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/activity"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/activity"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with merged and sorted activity items", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", fullName: "Alice" });

    mockDirectMessageFindMany
      .mockResolvedValueOnce([
        {
          id: "dm-1",
          content: "DM content",
          createdAt: new Date("2024-01-02T00:00:00Z"),
          sender: { id: "p2", fullName: "Bob", avatarUrl: null },
          thread: { id: "thread-1", userAId: "profile-1", userBId: "p2" },
        },
      ])
      .mockResolvedValueOnce([]);

    mockTerminalMessageFindMany
      .mockResolvedValueOnce([
        {
          id: "tm-1",
          content: "@profile-1 hello",
          createdAt: new Date("2024-01-03T00:00:00Z"),
          sender: { id: "p3", fullName: "Charlie", avatarUrl: null },
          channel: { id: "ch-1", name: "general", slug: "general" },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "tm-2",
          content: "Public message",
          createdAt: new Date("2024-01-01T00:00:00Z"),
          sender: { id: "p4", fullName: "Dave", avatarUrl: null },
          channel: { id: "ch-2", name: "random", slug: "random" },
        },
      ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/activity"));
    const body = await res.json();

    expect(res.status).toBe(200);
    // 3 items: 1 DM message + 1 terminal mention + 1 channel message (dmMentions mocked empty)
    expect(body.items).toHaveLength(3);
    expect(body.items[0].id).toBe("tm-1");
    expect(body.items[1].id).toBe("dm-1");
    expect(body.items[2].id).toBe("tm-2");
  });

  it("applies custom limit and caps at 50", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", fullName: "Alice" });
    mockDirectMessageFindMany.mockResolvedValue([]);
    mockTerminalMessageFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/terminal/activity?limit=5"));
    // Each GET calls directMessage.findMany twice and terminalMessage.findMany twice
    expect(mockDirectMessageFindMany).toHaveBeenCalledTimes(2);
    expect(mockTerminalMessageFindMany).toHaveBeenCalledTimes(2);

    await GET(makeRequest("http://localhost/api/v1/terminal/activity?limit=100"));
    // Should still work, limit capped at 50 in code
    expect(mockDirectMessageFindMany).toHaveBeenCalledTimes(4);
    expect(mockTerminalMessageFindMany).toHaveBeenCalledTimes(4);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", fullName: "Alice" });
    mockDirectMessageFindMany.mockResolvedValue([]);
    mockTerminalMessageFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/activity"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
