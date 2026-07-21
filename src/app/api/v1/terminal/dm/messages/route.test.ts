import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockDirectMessageThreadFindFirst = vi.fn();
const mockDirectMessageThreadCreate = vi.fn();
const mockDirectMessageFindMany = vi.fn();
const mockDirectMessageUpdateMany = vi.fn();
const mockDirectMessageCreate = vi.fn();
const mockBlockFindFirst = vi.fn();
const mockDirectMessageThreadUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    directMessageThread: {
      findFirst: (...args: unknown[]) => mockDirectMessageThreadFindFirst(...args),
      create: (...args: unknown[]) => mockDirectMessageThreadCreate(...args),
      update: (...args: unknown[]) => mockDirectMessageThreadUpdate(...args),
    },
    directMessage: {
      findMany: (...args: unknown[]) => mockDirectMessageFindMany(...args),
      updateMany: (...args: unknown[]) => mockDirectMessageUpdateMany(...args),
      create: (...args: unknown[]) => mockDirectMessageCreate(...args),
    },
    block: {
      findFirst: (...args: unknown[]) => mockBlockFindFirst(...args),
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

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
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

const validThreadId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const validUserId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

describe("GET /api/v1/terminal/dm/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when thread not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageThreadFindFirst.mockResolvedValue(null);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Thread not found");
  });

  it("returns 403 when blocked by userId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?userId=${validUserId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("You cannot message this user");
  });

  it("returns 403 when accessing blocked thread by threadId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageThreadFindFirst.mockResolvedValue({
      id: validThreadId,
      userAId: "profile-1",
      userBId: "profile-2",
    });
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("You cannot access this thread");
    expect(mockDirectMessageFindMany).not.toHaveBeenCalled();
  });

  it("returns 200 with messages", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadFindFirst.mockResolvedValue({
      id: validThreadId,
      userAId: "profile-1",
      userBId: "profile-2",
    });
    mockDirectMessageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        content: "Hello",
        attachments: [],
        createdAt: new Date("2024-01-01T00:00:00Z"),
        isRead: false,
        sender: { id: "profile-2", fullName: "Alice", avatarUrl: null },
        reactions: [],
      },
    ]);
    mockDirectMessageUpdateMany.mockResolvedValue({ count: 1 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
    expect(body.threadId).toBe(validThreadId);
  });

  it("creates thread when userId provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadCreate.mockResolvedValue({ id: validThreadId });
    mockDirectMessageFindMany.mockResolvedValue([]);
    mockDirectMessageUpdateMany.mockResolvedValue({ count: 0 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?userId=${validUserId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockDirectMessageThreadCreate).toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageThreadFindFirst.mockResolvedValue({ id: validThreadId });
    mockDirectMessageFindMany.mockResolvedValue([]);
    mockDirectMessageUpdateMany.mockResolvedValue({ count: 0 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/dm/messages?threadId=${validThreadId}`)
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/terminal/dm/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  function makePostRequest(body: unknown) {
    return makeRequest("http://localhost/api/v1/terminal/dm/messages", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 for invalid input", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", fullName: "Me" });

    const res = await POST(makePostRequest({ userId: "not-a-uuid", content: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 when messaging yourself", async () => {
    const myId = "550e8400-e29b-41d4-a716-446655440000";
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: myId, fullName: "Me" });

    const res = await POST(makePostRequest({ userId: myId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot message yourself");
  });

  it("returns 404 when target user not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce(null);

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("returns 403 when blocked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ id: validUserId });
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("You cannot message this user");
  });

  it("returns 201 and creates message", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ id: validUserId });
    mockBlockFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadCreate.mockResolvedValue({ id: validThreadId });
    mockDirectMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Hello",
      attachments: [],
      createdAt: new Date(),
      isRead: false,
      sender: { id: "profile-1", fullName: "Me", avatarUrl: null },
      reactions: [],
    });
    mockDirectMessageThreadUpdate.mockResolvedValue({});

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.content).toBe("Hello");
    expect(body.threadId).toBe(validThreadId);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", fullName: "Me" })
      .mockResolvedValueOnce({ id: validUserId });
    mockBlockFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadFindFirst.mockResolvedValue(null);
    mockDirectMessageThreadCreate.mockResolvedValue({ id: validThreadId });
    mockDirectMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Hello",
      attachments: [],
      createdAt: new Date(),
      isRead: false,
      sender: { id: "profile-1", fullName: "Me", avatarUrl: null },
      reactions: [],
    });
    mockDirectMessageThreadUpdate.mockResolvedValue({});

    const res = await POST(makePostRequest({ userId: validUserId, content: "Hello" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
