import type { NextRequest } from "next/server";

import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "./route";

const request = () => new Request("http://localhost/api/v1/needs/watching") as NextRequest;

const mockGetUser = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockNeedWatchFindMany = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    needWatch: { findMany: (...args: unknown[]) => mockNeedWatchFindMany(...args) },
  },
}));

describe("/api/v1/needs/watching", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mockNeedWatchFindMany).not.toHaveBeenCalled();
  });

  it("returns an empty watchlist when the user has no profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-1" } } });
    mockProfileFindUnique.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("returns only the signed-in member's watched needs, newest watch first", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-1" } } });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockNeedWatchFindMany.mockResolvedValue([
      { need: { id: "need-1", title: "Watched need" } },
      { need: { id: "need-2", title: "Another need" } },
    ]);

    const response = await GET(request());
    expect(await response.json()).toEqual([
      { id: "need-1", title: "Watched need" },
      { id: "need-2", title: "Another need" },
    ]);
    expect(mockNeedWatchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "profile-1" },
        orderBy: { createdAt: "desc" },
      })
    );
  });
});
