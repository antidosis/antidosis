import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockBlockFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
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
function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

describe("GET /api/v1/profiles/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindUnique.mockReset();
    mockBlockFindFirst.mockReset();
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when blocked as viewer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "viewer-profile" }) // viewer lookup
      .mockResolvedValueOnce(null); // blocked, returns 404
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with profile for unauthenticated viewer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      handle: "test_user",
      fullName: "Test User",
      skills: [],
      socialLinks: [],
      credentials: [],
      needsPosted: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fullName).toBe("Test User");
    expect(body.handle).toBe("test_user");
  });

  it("resolves a profile by @handle", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }) // handle lookup
      .mockResolvedValueOnce({
        // public projection
        id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        handle: "test_user",
        fullName: "Test User",
        skills: [],
        socialLinks: [],
        credentials: [],
        needsPosted: [],
        reviewsReceived: [],
      });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/@test_user"), {
      params: { id: "@test_user" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.handle).toBe("test_user");
    expect(mockProfileFindUnique).toHaveBeenNthCalledWith(1, {
      where: { handle: "test_user" },
      select: { id: true },
    });
  });

  it("resolves a profile by bare handle (no @ prefix)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" })
      .mockResolvedValueOnce({
        id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        handle: "test_user",
        fullName: "Test User",
        skills: [],
        socialLinks: [],
        credentials: [],
        needsPosted: [],
        reviewsReceived: [],
      });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/test_user"), {
      params: { id: "test_user" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.handle).toBe("test_user");
  });

  it("lowercases handle lookups (@Test_User → test_user)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/@Test_User"), {
      params: { id: "@Test_User" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
    expect(mockProfileFindUnique).toHaveBeenCalledWith({
      where: { handle: "test_user" },
      select: { id: true },
    });
  });

  it("returns 404 when the handle does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/@nobody"), {
      params: { id: "@nobody" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 with profile for authenticated viewer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "viewer-profile" }) // viewer
      .mockResolvedValueOnce({
        id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        fullName: "Test User",
        skills: [],
        socialLinks: [],
        credentials: [],
        needsPosted: [],
        reviewsReceived: [],
      });
    mockBlockFindFirst.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fullName).toBe("Test User");
  });

  it("sets cache headers", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      fullName: "Test User",
      skills: [],
      socialLinks: [],
      credentials: [],
      needsPosted: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      fullName: "Test User",
      skills: [],
      socialLinks: [],
      credentials: [],
      needsPosted: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
