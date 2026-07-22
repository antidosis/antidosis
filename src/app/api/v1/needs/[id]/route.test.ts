import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, PATCH, DELETE } from "./route";

// ─── Prisma mocks ───
const mockNeedFindUnique = vi.fn();
const mockNeedUpdate = vi.fn();
const mockNeedDelete = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockNeedSkillDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: {
      findUnique: (...args: unknown[]) => mockNeedFindUnique(...args),
      update: (...args: unknown[]) => mockNeedUpdate(...args),
      delete: (...args: unknown[]) => mockNeedDelete(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    needSkill: {
      deleteMany: (...args: unknown[]) => mockNeedSkillDeleteMany(...args),
    },
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
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
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
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/v1/needs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedFindUnique.mockReset();
    mockProfileFindUnique.mockReset();
  });

  it("returns need for unauthenticated guest with normalized poster fields", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Test Need",
      poster: { id: "poster-1", fullName: "Poster", avatarUrl: null, isVerified: true },
      requiredSkills: [],
      acceptances: false,
      contracts: false,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1"), {
      params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.need.title).toBe("Test Need");
    expect(body.need.poster.bio).toBeNull();
    expect(body.need.poster.ratingAvg).toBe(0);
    expect(body.need.poster.ratingCount).toBe(0);
    expect(body.need.poster.isPro).toBe(false);
    expect(body.need.poster.jobsCompleted).toBe(0);
    expect(body.need.poster.skills).toEqual([]);
  });

  it("returns need for authenticated non-poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValueOnce({ posterId: "poster-profile" }).mockResolvedValueOnce({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Test Need",
      poster: {
        id: "poster-1",
        fullName: "Poster",
        avatarUrl: null,
        isVerified: true,
        bio: null,
        ratingAvg: 0,
        ratingCount: 0,
        locationName: null,
        isPro: false,
        jobsCompleted: 0,
        skills: [],
        socialLinks: [],
      },
      requiredSkills: [],
      acceptances: [],
      contracts: false,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1"), {
      params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.need.title).toBe("Test Need");
  });

  it("returns need for authenticated poster with acceptances and contracts", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "poster-profile" });
    mockNeedFindUnique.mockResolvedValueOnce({ posterId: "poster-profile" }).mockResolvedValueOnce({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Test Need",
      poster: {
        id: "poster-1",
        fullName: "Poster",
        avatarUrl: null,
        isVerified: true,
        bio: null,
        ratingAvg: 0,
        ratingCount: 0,
        locationName: null,
        isPro: false,
        jobsCompleted: 0,
        skills: [],
        socialLinks: [],
      },
      requiredSkills: [],
      acceptances: [{ id: "acc-1", status: "accepted" }],
      contracts: [{ id: "con-1", status: "active" }],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1"), {
      params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.need.acceptances).toHaveLength(1);
    expect(body.need.contracts).toHaveLength(1);
  });

  it("returns 404 when need not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockNeedFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1"), {
      params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Need not found");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockNeedFindUnique.mockResolvedValue({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Test Need",
      poster: { id: "poster-1", fullName: "Poster", avatarUrl: null, isVerified: true },
      requiredSkills: [],
      acceptances: false,
      contracts: false,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/needs/need-1"), {
      params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("PATCH /api/v1/needs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedFindUnique.mockReset();
    mockNeedUpdate.mockReset();
    mockProfileFindUnique.mockReset();
    mockTransaction.mockReset();
    mockNeedSkillDeleteMany.mockReset();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockTransaction.mockImplementation(async (callback: any) => {
      return callback({
        needSkill: { deleteMany: mockNeedSkillDeleteMany },
        need: { update: (...args: unknown[]) => mockNeedUpdate(...args) },
      });
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when need not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Need not found");
  });

  it("returns 403 when not poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({
      posterId: "other-profile",
      status: "open",
      isLocal: true,
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when need status is not open or archived", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({
      posterId: "profile-1",
      status: "completed",
      isLocal: true,
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Can only edit open or archived needs");
  });

  it("returns 400 for invalid schema", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open", isLocal: true });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "ab" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Title must be at least 3 characters");
  });

  it("returns 400 for invalid location", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open", isLocal: true });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Valid Title", locationName: "Sydney" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Central Coast NSW");
  });

  it("updates need successfully without skills", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open", isLocal: true });
    mockNeedUpdate.mockResolvedValue({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Updated Title",
      poster: { id: "profile-1", fullName: "Test", avatarUrl: null },
      requiredSkills: [],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.need.title).toBe("Updated Title");
    expect(mockNeedUpdate).toHaveBeenCalled();
  });

  it("updates need successfully with skills", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open", isLocal: true });
    mockNeedUpdate.mockResolvedValue({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Updated Title",
      poster: { id: "profile-1", fullName: "Test", avatarUrl: null },
      requiredSkills: [{ id: "skill-1", name: "Plumbing" }],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Updated Title",
          description: "Updated description that is long enough",
          requiredSkills: ["Plumbing"],
        }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.need.title).toBe("Updated Title");
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockNeedSkillDeleteMany).toHaveBeenCalledWith({
      where: { needId: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open", isLocal: true });
    mockNeedUpdate.mockResolvedValue({
      id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      title: "Updated",
      poster: { id: "profile-1", fullName: "Test", avatarUrl: null },
      requiredSkills: [],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/needs/need-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("DELETE /api/v1/needs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedFindUnique.mockReset();
    mockNeedDelete.mockReset();
    mockProfileFindUnique.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when need not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Need not found");
  });

  it("returns 403 when not poster", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "other-profile", status: "open" });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when need is not open", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "archived" });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Can only delete open needs");
  });

  it("deletes need successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open" });
    mockNeedDelete.mockResolvedValue({ id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockNeedDelete).toHaveBeenCalledWith({
      where: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedFindUnique.mockResolvedValue({ posterId: "profile-1", status: "open" });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/needs/need-1", { method: "DELETE" }),
      { params: { id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
