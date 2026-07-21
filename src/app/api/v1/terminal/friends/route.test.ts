import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockFriendFindMany = vi.fn();
const mockFriendFindUnique = vi.fn();
const mockFriendCreate = vi.fn();
const mockBlockFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    friend: {
      findMany: (...args: unknown[]) => mockFriendFindMany(...args),
      findUnique: (...args: unknown[]) => mockFriendFindUnique(...args),
      create: (...args: unknown[]) => mockFriendCreate(...args),
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

describe("GET /api/v1/terminal/friends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/friends"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/friends"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with friends list", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockFriendFindMany.mockResolvedValue([
      {
        id: "f1",
        createdAt: new Date(),
        userA: { id: "profile-1", fullName: "Me", avatarUrl: null },
        userB: { id: "profile-2", fullName: "Alice", avatarUrl: null },
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/friends"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.friends).toHaveLength(1);
    expect(body.friends[0].user.id).toBe("profile-2");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockFriendFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/friends"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/terminal/friends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 when userId missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("userId required");
  });

  it("returns 400 when friending yourself", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-1" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Cannot friend yourself");
  });

  it("returns 404 when target user not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce({ id: "profile-1" }).mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  it("returns 403 when blocked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Cannot friend a blocked user");
  });

  it("returns 409 when already friends", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindFirst.mockResolvedValue(null);
    mockFriendFindUnique.mockResolvedValue({ id: "f1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("Already friends");
  });

  it("returns 200 on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindFirst.mockResolvedValue(null);
    mockFriendFindUnique.mockResolvedValue(null);
    mockFriendCreate.mockResolvedValue({ id: "f1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1" })
      .mockResolvedValueOnce({ id: "profile-2" });
    mockBlockFindFirst.mockResolvedValue(null);
    mockFriendFindUnique.mockResolvedValue(null);
    mockFriendCreate.mockResolvedValue({ id: "f1" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/friends", {
        method: "POST",
        body: JSON.stringify({ userId: "profile-2" }),
      })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
