import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockNeedFindUnique = vi.fn();
const mockNeedMessageFindMany = vi.fn();
const mockNeedMessageUpdateMany = vi.fn();
const mockNeedMessageCreate = vi.fn();
const mockAcceptanceFindFirst = vi.fn();
const mockAcceptanceFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    need: { findUnique: (...args: unknown[]) => mockNeedFindUnique(...args) },
    needMessage: {
      findMany: (...args: unknown[]) => mockNeedMessageFindMany(...args),
      updateMany: (...args: unknown[]) => mockNeedMessageUpdateMany(...args),
      create: (...args: unknown[]) => mockNeedMessageCreate(...args),
    },
    acceptance: {
      findFirst: (...args: unknown[]) => mockAcceptanceFindFirst(...args),
      findUnique: (...args: unknown[]) => mockAcceptanceFindUnique(...args),
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
const mockCreateNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
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

describe("GET /api/v1/needs/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindUnique.mockReset();
    mockNeedFindUnique.mockReset();
    mockNeedMessageFindMany.mockReset();
    mockNeedMessageUpdateMany.mockReset();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 403 when not involved in a closed need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "completed" });
    mockAcceptanceFindFirst.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden: not involved in this need");
  });

  it("returns messages for poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockNeedMessageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        content: "Hello",
        sender: { id: "poster-profile", fullName: "Poster", avatarUrl: null },
      },
    ]);
    mockNeedMessageUpdateMany.mockResolvedValue({ count: 1 });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
    expect(mockNeedMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { needId: "need-1" } })
    );
    expect(mockNeedMessageUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          needId: "need-1",
          senderId: { not: "poster-profile" },
          isRead: false,
        },
      })
    );
  });

  it("returns messages for fulfiller with acceptance", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-2" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue({ id: "acc-1", status: "accepted" });
    mockNeedMessageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        content: "Private",
        sender: { id: "poster-profile", fullName: "Poster", avatarUrl: null },
      },
    ]);
    mockNeedMessageUpdateMany.mockResolvedValue({ count: 1 });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
    expect(mockNeedMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          needId: "need-1",
          OR: [
            { acceptanceId: null, senderId: "poster-profile" },
            { acceptanceId: "acc-1" },
            { senderId: "profile-2" },
          ],
        },
      })
    );
  });

  it("returns messages for visitor on open need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue(null);
    mockNeedMessageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        content: "Public",
        sender: { id: "poster-profile", fullName: "Poster", avatarUrl: null },
      },
    ]);
    mockNeedMessageUpdateMany.mockResolvedValue({ count: 1 });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
    expect(mockNeedMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          needId: "need-1",
          OR: [{ acceptanceId: null, senderId: "poster-profile" }, { senderId: "profile-3" }],
        },
      })
    );
  });

  it("respects messagesLimit and messagesSkip query params", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockNeedMessageFindMany.mockResolvedValue([]);
    mockNeedMessageUpdateMany.mockResolvedValue({ count: 0 });

    await GET(
      makeRequest("http://localhost/api/v1/needs/need-1/messages?messagesLimit=50&messagesSkip=10"),
      { params: { id: "need-1" } }
    );

    const call = mockNeedMessageFindMany.mock.calls[0][0];
    expect(call.take).toBe(50);
    expect(call.skip).toBe(10);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockNeedMessageFindMany.mockResolvedValue([]);
    mockNeedMessageUpdateMany.mockResolvedValue({ count: 0 });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1/messages"), {
      params: { id: "need-1" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/needs/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindUnique.mockReset();
    mockNeedFindUnique.mockReset();
    mockNeedMessageCreate.mockReset();
    mockAcceptanceFindFirst.mockReset();
    mockAcceptanceFindUnique.mockReset();
    mockCreateNotification.mockClear();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded. Slow down.");
  });

  it("returns 403 when not involved in need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "completed" });
    mockAcceptanceFindFirst.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden: not involved in this need");
  });

  it("returns 404 when need not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValueOnce({ posterId: "poster-profile", status: "open" });
    mockNeedFindUnique.mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Need not found");
  });

  it("returns 400 when need is not open for new visitor", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockNeedFindUnique
      .mockResolvedValueOnce({ posterId: "poster-profile", status: "open" }) // getAuthorizedProfile
      .mockResolvedValueOnce({ status: "completed", posterId: "poster-profile" }); // main handler
    mockAcceptanceFindFirst.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Need is not open for messages");
  });

  it("returns 400 for invalid input", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid input");
  });

  it("returns 400 when poster sends to non-existent acceptance", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi", acceptanceId: "bad-acc" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Acceptance not found for this need");
  });

  it("returns 403 when non-poster sends to another fulfiller's thread", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-2" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue({ id: "acc-1", status: "accepted" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi", acceptanceId: "acc-2" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Cannot send to another fulfiller's thread");
  });

  it("creates public message as poster without notification", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockNeedMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Public msg",
      sender: { id: "poster-profile", fullName: "Poster", avatarUrl: null },
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Public msg" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.content).toBe("Public msg");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("creates private message as poster and notifies fulfiller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue({ id: "acc-1", userId: "fulfiller-profile" });
    mockNeedMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Private msg",
      sender: { id: "poster-profile", fullName: "Poster", avatarUrl: null },
    });
    mockAcceptanceFindUnique.mockResolvedValue({ userId: "fulfiller-profile" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Private msg", acceptanceId: "acc-1" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.content).toBe("Private msg");
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "fulfiller-profile", type: "message" })
    );
  });

  it("creates message as fulfiller and notifies poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-2" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue({ id: "acc-1", status: "accepted" });
    mockNeedMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Fulfiller msg",
      sender: { id: "profile-2", fullName: "Fulfiller", avatarUrl: null },
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Fulfiller msg" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.content).toBe("Fulfiller msg");
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "poster-profile",
        type: "message",
        title: "New private message",
      })
    );
  });

  it("creates message as visitor and notifies poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockAcceptanceFindFirst.mockResolvedValue(null);
    mockNeedMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Visitor msg",
      sender: { id: "profile-3", fullName: "Visitor", avatarUrl: null },
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Visitor msg" }),
      }),
      { params: { id: "need-1" } }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.content).toBe("Visitor msg");
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "poster-profile",
        type: "message",
        title: "New message on your need",
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "poster-profile", status: "open" });
    mockNeedMessageCreate.mockResolvedValue({
      id: "msg-1",
      content: "Hi",
      sender: { id: "poster-profile", fullName: "Poster", avatarUrl: null },
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/needs/need-1/messages", {
        method: "POST",
        body: JSON.stringify({ content: "Hi" }),
      }),
      { params: { id: "need-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
