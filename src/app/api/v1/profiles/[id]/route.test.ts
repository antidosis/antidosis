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

  it("hides the ABN of individual accounts (collected for SERR, not public)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      handle: "test_user",
      fullName: "Test User",
      accountType: "individual",
      abn: "51824753556",
      abnVerified: true,
      audienceSize: 3200,
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
    expect(body.accountType).toBe("individual");
    expect(body.abn).toBeNull();
    expect(body.abnVerified).toBe(false);
    expect(body.audienceSize).toBe(3200);
  });

  it("shows the ABN of business accounts", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      handle: "acme_plumbing",
      fullName: "Acme Plumbing Pty Ltd",
      accountType: "business",
      abn: "51824753556",
      abnVerified: true,
      audienceSize: 99000,
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
    expect(body.accountType).toBe("business");
    expect(body.abn).toBe("51824753556");
    expect(body.abnVerified).toBe(true);
    expect(body.audienceSize).toBeNull();
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

  it("public projection never selects account or directory-only contact fields", async () => {
    // The public profile page and mobile PublicProfile type promise a
    // personal-only surface: no account mobile, no private phone, and no
    // business contact details (those belong to the directory API).
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

    await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    const projectionCall = mockProfileFindUnique.mock.calls.find(
      (call) => call[0]?.select && "needsPosted" in call[0].select
    );
    expect(projectionCall).toBeDefined();
    const selected = Object.keys(projectionCall![0].select);
    for (const forbidden of ["mobile", "privatePhone", "businessPhone", "businessEmail", "email"]) {
      expect(selected).not.toContain(forbidden);
    }
    expect(selected).toContain("publicPhone");
  });

  it("never serialises the phone value or social URLs — flags only", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      fullName: "Test User",
      publicPhone: "0457189685",
      accountType: "individual",
      skills: [],
      socialLinks: [{ id: "s1", platform: "instagram", isPublic: true }],
      credentials: [],
      needsPosted: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/profile-1"), {
      params: { id: "d1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.contact).toEqual({ phone: true, socials: ["instagram"] });
    expect(body.publicPhone).toBeUndefined();
    expect(body.socialLinks[0].url).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("0457189685");
  });
});
