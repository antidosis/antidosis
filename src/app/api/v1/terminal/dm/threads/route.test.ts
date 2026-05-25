import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockDirectMessageThreadFindMany = vi.fn();
const mockDirectMessageGroupBy = vi.fn();
const mockBlockFindMany = vi.fn();
const mockProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    directMessageThread: {
      findMany: (...args: unknown[]) => mockDirectMessageThreadFindMany(...args),
    },
    directMessage: {
      groupBy: (...args: unknown[]) => mockDirectMessageGroupBy(...args),
    },
    block: {
      findMany: (...args: unknown[]) => mockBlockFindMany(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
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
  getClientInfo: vi.fn(),
}));

// ─── Helpers ───
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
    ...overrides,
  };
}

describe("GET /api/v1/terminal/dm/threads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with formatted threads", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockDirectMessageThreadFindMany.mockResolvedValue([
      {
        id: "thread-1",
        userAId: "profile-1",
        userBId: "profile-2",
        updatedAt: new Date("2024-01-02T00:00:00Z"),
        userA: { id: "profile-1", fullName: "Alice", avatarUrl: null },
        userB: { id: "profile-2", fullName: "Bob", avatarUrl: null },
        messages: [
          {
            id: "dm-1",
            content: "Hey",
            createdAt: new Date("2024-01-02T00:00:00Z"),
            senderId: "profile-2",
            isRead: false,
          },
        ],
      },
    ]);
    mockDirectMessageGroupBy.mockResolvedValue([{ threadId: "thread-1", _count: { threadId: 1 } }]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.threads).toHaveLength(1);
    expect(body.threads[0].id).toBe("thread-1");
    expect(body.threads[0].otherUser.id).toBe("profile-2");
    expect(body.threads[0].otherUser.fullName).toBe("Bob");
    expect(body.threads[0].lastMessage.content).toBe("Hey");
    expect(body.threads[0].unreadCount).toBe(1);
  });

  it("excludes threads with blocked users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([{ blockerId: "profile-1", blockedId: "profile-3" }]);
    mockDirectMessageThreadFindMany.mockResolvedValue([]);
    mockDirectMessageGroupBy.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.threads).toHaveLength(0);

    const threadCall = mockDirectMessageThreadFindMany.mock.calls[0][0];
    expect(threadCall.where.AND).toEqual([
      { userAId: { notIn: ["profile-1", "profile-3"] } },
      { userBId: { notIn: ["profile-1", "profile-3"] } },
    ]);
  });

  it("returns empty threads when no threads exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockDirectMessageThreadFindMany.mockResolvedValue([]);
    mockDirectMessageGroupBy.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.threads).toEqual([]);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockDirectMessageThreadFindMany.mockResolvedValue([]);
    mockDirectMessageGroupBy.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/dm/threads"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
