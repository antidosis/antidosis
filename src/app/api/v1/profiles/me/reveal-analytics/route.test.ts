import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const mockProfileFindUnique = vi.fn();
const mockRevealCount = vi.fn();
const mockRevealFindMany = vi.fn();
const mockRevealFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    contactReveal: {
      count: (...args: unknown[]) => mockRevealCount(...args),
      findMany: (...args: unknown[]) => mockRevealFindMany(...args),
      findFirst: (...args: unknown[]) => mockRevealFindFirst(...args),
    },
  },
}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

function makeRequest(): NextRequest {
  return new Request("http://localhost/api/v1/profiles/me/reveal-analytics") as NextRequest;
}

describe("GET /api/v1/profiles/me/reveal-analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("aggregates reveals by scope and field for the owner only", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockRevealCount.mockResolvedValue(9);
    mockRevealFindMany.mockResolvedValue([
      { scope: "listing", fields: '["phone","website"]', createdAt: new Date() },
      { scope: "listing", fields: '["phone","email","website","socials"]', createdAt: new Date() },
      { scope: "personal", fields: '["phone","socials"]', createdAt: new Date() },
      { scope: "personal", fields: "not-json", createdAt: new Date() },
    ]);
    mockRevealFindFirst.mockResolvedValue({ createdAt: new Date("2026-11-25T00:00:00Z") });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.total).toBe(9);
    expect(body.last30d).toBe(4);
    expect(body.byScope).toEqual({ listing: 2, personal: 2 });
    expect(body.byField).toEqual({ phone: 3, email: 1, website: 2, socials: 2 });
    expect(body.lastRevealAt).toBe("2026-11-25T00:00:00.000Z");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");

    // Aggregates are scoped to the owner's profile — never anyone else's.
    expect(mockRevealFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ targetId: "profile-1" }) })
    );
  });

  it("returns zeroes when nothing has been revealed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockRevealCount.mockResolvedValue(0);
    mockRevealFindMany.mockResolvedValue([]);
    mockRevealFindFirst.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.last30d).toBe(0);
    expect(body.lastRevealAt).toBeNull();
  });
});
