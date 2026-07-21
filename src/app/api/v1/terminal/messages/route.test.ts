import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockTerminalMessageFindMany = vi.fn();
const mockTerminalMessageCreate = vi.fn();
const mockTerminalChannelFindUnique = vi.fn();
const mockProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    terminalMessage: {
      findMany: (...args: unknown[]) => mockTerminalMessageFindMany(...args),
      create: (...args: unknown[]) => mockTerminalMessageCreate(...args),
    },
    terminalChannel: {
      findUnique: (...args: unknown[]) => mockTerminalChannelFindUnique(...args),
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

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

// ─── Admin mock ───
const mockIsAdminEmail = vi.fn();

vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => mockIsAdminEmail(email),
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

const validChannelId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const validMessageId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

describe("GET /api/v1/terminal/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
    mockTerminalChannelFindUnique.mockResolvedValue({ id: validChannelId, type: "public" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );
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

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 400 when channelId is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/messages"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("channelId required");
  });

  it("returns 200 with messages reversed", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalMessageFindMany.mockResolvedValue([
      {
        id: "msg-2",
        content: "Second",
        createdAt: new Date("2024-01-02T00:00:00Z"),
        sender: { id: "p1", fullName: "Alice", avatarUrl: null },
        reactions: [],
      },
      {
        id: "msg-1",
        content: "First",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        sender: { id: "p2", fullName: "Bob", avatarUrl: null },
        reactions: [],
      },
    ]);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].id).toBe("msg-1");
    expect(body.messages[1].id).toBe("msg-2");
  });

  it("applies limit and skip", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalMessageFindMany.mockResolvedValue([]);

    await GET(
      makeRequest(
        `http://localhost/api/v1/terminal/messages?channelId=${validChannelId}&limit=10&skip=5`
      )
    );

    const call = mockTerminalMessageFindMany.mock.calls[0][0];
    expect(call.take).toBe(10);
    expect(call.skip).toBe(5);
  });

  it("caps limit at 200", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalMessageFindMany.mockResolvedValue([]);

    await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}&limit=500`)
    );

    const call = mockTerminalMessageFindMany.mock.calls[0][0];
    expect(call.take).toBe(200);
  });

  it("filters by deletedAt null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalMessageFindMany.mockResolvedValue([]);

    await GET(makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`));

    const call = mockTerminalMessageFindMany.mock.calls[0][0];
    expect(call.where.deletedAt).toBeNull();
  });

  it("returns 404 when channel does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalChannelFindUnique.mockResolvedValue(null);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Channel not found");
  });

  it("returns 403 for staff channels when not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalChannelFindUnique.mockResolvedValue({ id: validChannelId, type: "staff" });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain("staff channel");
    expect(mockTerminalMessageFindMany).not.toHaveBeenCalled();
  });

  it("returns 200 for staff channels when admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "admin@example.com" }) },
      error: null,
    });
    mockTerminalChannelFindUnique.mockResolvedValue({ id: validChannelId, type: "staff" });
    mockIsAdminEmail.mockReturnValue(true);
    mockTerminalMessageFindMany.mockResolvedValue([]);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );

    expect(res.status).toBe(200);
    expect(mockTerminalMessageFindMany).toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockTerminalMessageFindMany.mockResolvedValue([]);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/terminal/messages?channelId=${validChannelId}`)
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/terminal/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
    mockIsAdminEmail.mockReturnValue(false);
  });

  function makePostRequest(body: unknown) {
    return makeRequest("http://localhost/api/v1/terminal/messages", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello" }));
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

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello" }));
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

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 for invalid input", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Alice",
    });

    const res = await POST(makePostRequest({ channelId: "not-a-uuid", content: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request");
    expect(body.details).toBeDefined();
  });

  it("returns 404 when channel not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Alice",
    });
    mockTerminalChannelFindUnique.mockResolvedValue(null);

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Channel not found");
  });

  it("returns 403 for non-admin posting to staff channel", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Alice",
    });
    mockTerminalChannelFindUnique.mockResolvedValue({
      id: validChannelId,
      name: "staff",
      type: "staff",
    });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden: staff channel is admin-only");
  });

  it("returns 201 and creates message for public channel", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Alice",
    });
    mockTerminalChannelFindUnique.mockResolvedValue({
      id: validChannelId,
      name: "general",
      type: "public",
    });
    mockTerminalMessageCreate.mockResolvedValue({
      id: validMessageId,
      content: "Hello world",
      attachments: [],
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Alice", avatarUrl: null },
      reactions: [],
    });

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello world" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.id).toBe(validMessageId);
    expect(body.message.content).toBe("Hello world");
    expect(mockTerminalMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channelId: validChannelId,
          senderId: "profile-1",
          content: "Hello world",
        }),
      })
    );
  });

  it("allows admin to post to staff channel", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "admin@example.com" }) },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Admin",
    });
    mockTerminalChannelFindUnique.mockResolvedValue({
      id: validChannelId,
      name: "staff",
      type: "staff",
    });
    mockIsAdminEmail.mockReturnValue(true);
    mockTerminalMessageCreate.mockResolvedValue({
      id: validMessageId,
      content: "Staff message",
      attachments: [],
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Admin", avatarUrl: null },
      reactions: [],
    });

    const res = await POST(
      makePostRequest({ channelId: validChannelId, content: "Staff message" })
    );

    expect(res.status).toBe(201);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Alice",
    });
    mockTerminalChannelFindUnique.mockResolvedValue({
      id: validChannelId,
      name: "general",
      type: "public",
    });
    mockTerminalMessageCreate.mockResolvedValue({
      id: validMessageId,
      content: "Hello",
      attachments: [],
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Alice", avatarUrl: null },
      reactions: [],
    });

    const res = await POST(makePostRequest({ channelId: validChannelId, content: "Hello" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
