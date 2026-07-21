import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockMessageFindMany = vi.fn();
const mockMessageUpdateMany = vi.fn();
const mockMessageCreate = vi.fn();
const mockExecuteRaw = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    contract: { findUnique: (...args: unknown[]) => mockContractFindUnique(...args) },
    message: {
      findMany: (...args: unknown[]) => mockMessageFindMany(...args),
      updateMany: (...args: unknown[]) => mockMessageUpdateMany(...args),
      create: (...args: unknown[]) => mockMessageCreate(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
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

// ─── Sanitize mock ───
vi.mock("@/lib/security/sanitize", () => ({
  sanitizePlainText: (input: string) => input,
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
  overrides?: Partial<{ id: string; email: string; email_confirmed_at?: string }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const validContractId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("GET /api/v1/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: undefined }) },
      error: null,
    });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Email verification required");
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 when contractId is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await GET(makeRequest("http://localhost/api/v1/messages"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("contractId required");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Contract not found");
  });

  it("returns 400 when contract is completed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "completed",
    });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot send messages to a completed or cancelled contract");
  });

  it("returns 400 when contract is cancelled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "cancelled",
    });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot send messages to a completed or cancelled contract");
  });

  it("returns 403 when user is not a party to the contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with messages and marks others as read", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });
    mockMessageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        content: "Hello",
        createdAt: new Date(),
        sender: { id: "profile-2", fullName: "Bob", avatarUrl: null },
      },
    ]);
    mockMessageUpdateMany.mockResolvedValue({ count: 1 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toHaveLength(1);
    expect(mockMessageUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contractId: validContractId, senderId: { not: "profile-1" }, isRead: false },
        data: { isRead: true },
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });
    mockMessageFindMany.mockResolvedValue([]);
    mockMessageUpdateMany.mockResolvedValue({ count: 0 });

    const res = await GET(
      makeRequest(`http://localhost/api/v1/messages?contractId=${validContractId}`)
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  function makePostRequest(body: unknown) {
    return makeRequest("http://localhost/api/v1/messages", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: undefined }) },
      error: null,
    });

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Email verification required");
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded. Slow down.");
  });

  it("returns 400 for invalid body (ZodError)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makePostRequest({ contractId: "not-a-uuid", content: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Contract not found");
  });

  it("returns 400 when contract is completed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "completed",
    });

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot send messages to a completed or cancelled contract");
  });

  it("returns 403 when user is not a party to the contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-3" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 201 and creates message on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });
    mockMessageCreate.mockResolvedValue({
      id: "msg-1",
      contractId: validContractId,
      senderId: "profile-1",
      content: "Hello",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Alice", avatarUrl: null },
    });
    mockExecuteRaw.mockResolvedValue(undefined);

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message.id).toBe("msg-1");
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contractId: validContractId,
          senderId: "profile-1",
          content: "Hello",
        }),
      })
    );
  });

  it("creates notification for the other party", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });
    mockMessageCreate.mockResolvedValue({
      id: "msg-1",
      contractId: validContractId,
      senderId: "profile-1",
      content: "Hello",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Alice", avatarUrl: null },
    });
    mockExecuteRaw.mockResolvedValue(undefined);

    await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-2",
        type: "message",
        title: "New message",
      })
    );
  });

  it("handles transcript append failure gracefully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });
    mockMessageCreate.mockResolvedValue({
      id: "msg-1",
      contractId: validContractId,
      senderId: "profile-1",
      content: "Hello",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Alice", avatarUrl: null },
    });
    mockExecuteRaw.mockRejectedValue(new Error("DB error"));

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));

    expect(res.status).toBe(201);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockContractFindUnique.mockResolvedValue({
      partyAId: "profile-1",
      partyBId: "profile-2",
      status: "pending",
    });
    mockMessageCreate.mockResolvedValue({
      id: "msg-1",
      contractId: validContractId,
      senderId: "profile-1",
      content: "Hello",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sender: { id: "profile-1", fullName: "Alice", avatarUrl: null },
    });
    mockExecuteRaw.mockResolvedValue(undefined);

    const res = await POST(makePostRequest({ contractId: validContractId, content: "Hello" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
