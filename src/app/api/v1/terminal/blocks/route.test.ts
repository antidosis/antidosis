import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockBlockFindMany = vi.fn();
const mockBlockFindUnique = vi.fn();
const mockBlockCreate = vi.fn();
const mockFriendDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    block: {
      findMany: (...args: unknown[]) => mockBlockFindMany(...args),
      findUnique: (...args: unknown[]) => mockBlockFindUnique(...args),
      create: (...args: unknown[]) => mockBlockCreate(...args),
    },
    friend: {
      deleteMany: (...args: unknown[]) => mockFriendDeleteMany(...args),
    },
    $transaction: (args: unknown[]) => Promise.all(args),
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Helpers ───
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

describe("GET /api/v1/terminal/blocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/blocks"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/blocks"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with blocks list", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([
      {
        id: "b1",
        createdAt: new Date(),
        blocked: { id: "profile-2", fullName: "Alice", avatarUrl: null },
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/blocks"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.blocks).toHaveLength(1);
    expect(body.blocks[0].user.id).toBe("profile-2");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/blocks"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/terminal/blocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-2" }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 when blockedId missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("blockedId required");
  });

  it("returns 400 when blocking yourself", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-1" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot block yourself");
  });

  it("returns 404 when target user not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce({ id: "profile-1" }).mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("returns 409 when already blocked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindUnique.mockResolvedValue({ id: "b1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("Already blocked");
  });

  it("returns 200 on success and removes friendship", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindUnique.mockResolvedValue(null);
    mockBlockCreate.mockResolvedValue({ id: "b1" });
    mockFriendDeleteMany.mockResolvedValue({ count: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockFriendDeleteMany).toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindUnique.mockResolvedValue(null);
    mockBlockCreate.mockResolvedValue({ id: "b1" });
    mockFriendDeleteMany.mockResolvedValue({ count: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/blocks", {
        method: "POST",
        body: JSON.stringify({ blockedId: "profile-2" }),
      })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
