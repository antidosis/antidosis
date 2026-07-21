import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindMany = vi.fn();
const mockProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
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

// ─── Admin mock ───
const mockIsAdminEmail = vi.fn();

vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => mockIsAdminEmail(email),
}));

// ─── Helpers ───
function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "admin@example.com",
    ...overrides,
  };
}

describe("GET /api/v1/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindMany.mockResolvedValue([]);
  });

  it("returns 403 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/users"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 403 when not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "user@example.com" }) },
      error: null,
    });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/users"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockProfileFindMany.mockResolvedValue([
      {
        id: "profile-1",
        fullName: "Alice",
        email: "alice@example.com",
        locationName: "Terrigal",
        isVerified: true,
        isPro: false,
        ratingAvg: 5,
        ratingCount: 2,
        jobsCompleted: 3,
        createdAt: new Date(),
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/users"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.users[0].fullName).toBe("Alice");
  });

  it("filters by query", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockProfileFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/admin/users?q=alice"));

    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { fullName: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
          ],
        },
      })
    );
  });

  it("caps limit at 100", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockProfileFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/admin/users?limit=200"));

    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockProfileFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/users"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
