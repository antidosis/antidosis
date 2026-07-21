import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockNeedFindMany = vi.fn();
const mockProfileFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: {
      findMany: (...args: unknown[]) => mockNeedFindMany(...args),
    },
    profile: {
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
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

describe("GET /api/v1/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedFindMany.mockResolvedValue([]);
    mockProfileFindMany.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/search?q=test"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when query is too short", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/search?q=a"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("at least 2 characters");
  });

  it("returns 400 when query is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/search"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("at least 2 characters");
  });

  it("returns 200 with search results", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockNeedFindMany.mockResolvedValue([
      { id: "need-1", title: "Need", status: "open", locationName: "Terrigal", offerValue: null },
    ]);
    mockProfileFindMany
      .mockResolvedValueOnce([
        {
          id: "profile-1",
          fullName: "Alice",
          locationName: "Terrigal",
          ratingAvg: 5,
          ratingCount: 2,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "profile-2",
          fullName: "Bob Pro",
          locationName: "Gosford",
          ratingAvg: 4,
          ratingCount: 1,
        },
      ]);

    const res = await GET(makeRequest("http://localhost/api/v1/search?q=terrigal"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.needs).toBeDefined();
    expect(body.users).toBeDefined();
    expect(body.pros).toBeDefined();
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/search?q=test"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
