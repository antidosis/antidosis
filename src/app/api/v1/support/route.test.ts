import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockSupportFindMany = vi.fn();
const mockSupportCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    supportRequest: {
      findMany: (...args: unknown[]) => mockSupportFindMany(...args),
      create: (...args: unknown[]) => mockSupportCreate(...args),
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

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as NextRequest;
}

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null });
}

describe("GET /api/v1/support", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await GET(makeRequest("http://localhost/api/v1/support"));
    expect(res.status).toBe(401);
  });

  it("lists only the member's own requests, newest first", async () => {
    authed();
    mockSupportFindMany.mockResolvedValue([
      { id: "r2", subject: "other", message: "Second", status: "open", createdAt: new Date() },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/support"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.requests).toHaveLength(1);
    expect(mockSupportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: "profile-1" },
        orderBy: { createdAt: "desc" },
      })
    );
  });
});

describe("POST /api/v1/support", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a request with a valid topic and message", async () => {
    authed();
    mockSupportCreate.mockResolvedValue({ id: "r1", subject: "technical_issue", status: "open" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/support", {
        method: "POST",
        body: JSON.stringify({
          subject: "technical_issue",
          message: "The save button on my need post does nothing.",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(mockSupportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileId: "profile-1", subject: "technical_issue" }),
      })
    );
  });

  it("rejects an unknown topic", async () => {
    authed();
    const res = await POST(
      makeRequest("http://localhost/api/v1/support", {
        method: "POST",
        body: JSON.stringify({ subject: "demand_free_pizza", message: "A long enough message" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockSupportCreate).not.toHaveBeenCalled();
  });

  it("rejects messages under 10 characters", async () => {
    authed();
    const res = await POST(
      makeRequest("http://localhost/api/v1/support", {
        method: "POST",
        body: JSON.stringify({ subject: "other", message: "help" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockSupportCreate).not.toHaveBeenCalled();
  });

  it("rejects suspended accounts", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: new Date() });

    const res = await POST(
      makeRequest("http://localhost/api/v1/support", {
        method: "POST",
        body: JSON.stringify({ subject: "other", message: "A perfectly valid message here" }),
      })
    );
    expect(res.status).toBe(403);
    expect(mockSupportCreate).not.toHaveBeenCalled();
  });
});
