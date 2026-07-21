import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST, GET } from "./route";

// ─── Prisma mocks ───
const mockProfileUpdateMany = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockProfileFindMany = vi.fn();
const mockBlockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      updateMany: (...args: unknown[]) => mockProfileUpdateMany(...args),
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
    },
    block: {
      findMany: (...args: unknown[]) => mockBlockFindMany(...args),
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

describe("POST /api/v1/terminal/presence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/presence", { method: "POST" })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and updates lastSeenAt", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileUpdateMany.mockResolvedValue({ count: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/presence", { method: "POST" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockProfileUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        data: { lastSeenAt: expect.any(Date) },
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileUpdateMany.mockResolvedValue({ count: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/terminal/presence", { method: "POST" })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("GET /api/v1/terminal/presence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/presence"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/presence"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with online users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockProfileFindMany.mockResolvedValue([
      { id: "profile-2", fullName: "Alice", avatarUrl: null },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/presence"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.count).toBe(1);
  });

  it("excludes blocked users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([{ blockerId: "profile-1", blockedId: "profile-2" }]);
    mockProfileFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/presence"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(0);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockBlockFindMany.mockResolvedValue([]);
    mockProfileFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/presence"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
