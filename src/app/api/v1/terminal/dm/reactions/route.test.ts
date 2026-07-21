import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockDirectMessageFindUnique = vi.fn();
const mockDirectMessageReactionFindUnique = vi.fn();
const mockDirectMessageReactionDelete = vi.fn();
const mockDirectMessageReactionCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    directMessage: {
      findUnique: (...args: unknown[]) => mockDirectMessageFindUnique(...args),
    },
    directMessageReaction: {
      findUnique: (...args: unknown[]) => mockDirectMessageReactionFindUnique(...args),
      delete: (...args: unknown[]) => mockDirectMessageReactionDelete(...args),
      create: (...args: unknown[]) => mockDirectMessageReactionCreate(...args),
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

// ─── Helpers ───
function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/terminal/dm/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

const validMessageId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("POST /api/v1/terminal/dm/reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 for invalid input", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await POST(makeRequest({ messageId: "not-a-uuid", emoji: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request");
  });

  it("returns 404 when message not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Message not found");
  });

  it("returns 403 when not a participant", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: validMessageId,
      thread: { userAId: "profile-2", userBId: "profile-3" },
    });

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 and removes existing reaction", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: validMessageId,
      thread: { userAId: "profile-1", userBId: "profile-2" },
    });
    mockDirectMessageReactionFindUnique.mockResolvedValue({ id: "r1" });
    mockDirectMessageReactionDelete.mockResolvedValue({});

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe("removed");
  });

  it("returns 201 and adds new reaction", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: validMessageId,
      thread: { userAId: "profile-1", userBId: "profile-2" },
    });
    mockDirectMessageReactionFindUnique.mockResolvedValue(null);
    mockDirectMessageReactionCreate.mockResolvedValue({ id: "r1" });

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.action).toBe("added");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: validMessageId,
      thread: { userAId: "profile-1", userBId: "profile-2" },
    });
    mockDirectMessageReactionFindUnique.mockResolvedValue(null);
    mockDirectMessageReactionCreate.mockResolvedValue({ id: "r1" });

    const res = await POST(makeRequest({ messageId: validMessageId, emoji: "👍" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
