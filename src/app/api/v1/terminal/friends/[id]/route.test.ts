import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockFriendDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    friend: {
      deleteMany: (...args: unknown[]) => mockFriendDeleteMany(...args),
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
function makeRequest(url: string): NextRequest {
  return new Request(url, { method: "DELETE" }) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

describe("DELETE /api/v1/terminal/friends/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/friends/f1"), {
      params: { id: "f1" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/friends/f1"), {
      params: { id: "f1" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockFriendDeleteMany.mockResolvedValue({ count: 1 });

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/friends/f1"), {
      params: { id: "f1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockFriendDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "f1",
          OR: [{ userAId: "profile-1" }, { userBId: "profile-1" }],
        },
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockFriendDeleteMany.mockResolvedValue({ count: 1 });

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/friends/f1"), {
      params: { id: "f1" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
