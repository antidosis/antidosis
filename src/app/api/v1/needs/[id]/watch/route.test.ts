import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE, POST } from "./route";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));

vi.mock("@/lib/participation", () => ({
  requireVerifiedParticipation: vi.fn(async () => ({ ok: true, profileId: "me-1" })),
}));

const mockNeedFindUnique = vi.fn();
const mockNeedWatchCreate = vi.fn();
const mockNeedWatchDeleteMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: { findUnique: (...a: unknown[]) => mockNeedFindUnique(...a) },
    needWatch: {
      create: (...a: unknown[]) => mockNeedWatchCreate(...a),
      deleteMany: (...a: unknown[]) => mockNeedWatchDeleteMany(...a),
    },
  },
}));

describe("/api/v1/needs/[id]/watch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(
      new Request("http://x") as NextRequest,
      { params: { id: "n1" } } as never
    );
    expect(res.status).toBe(401);
  });

  it("POST returns 404 for a missing need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockNeedFindUnique.mockResolvedValue(null);
    const res = await POST(
      new Request("http://x") as NextRequest,
      { params: { id: "n1" } } as never
    );
    expect(res.status).toBe(404);
  });

  it("POST refuses watching your own need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockNeedFindUnique.mockResolvedValue({ id: "n1", posterId: "me-1" });
    const res = await POST(
      new Request("http://x") as NextRequest,
      { params: { id: "n1" } } as never
    );
    expect(res.status).toBe(400);
    expect(mockNeedWatchCreate).not.toHaveBeenCalled();
  });

  it("POST creates a watch", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockNeedFindUnique.mockResolvedValue({ id: "n1", posterId: "other" });
    mockNeedWatchCreate.mockResolvedValue({ id: "w1" });
    const res = await POST(
      new Request("http://x") as NextRequest,
      { params: { id: "n1" } } as never
    );
    expect(res.status).toBe(200);
    expect(mockNeedWatchCreate).toHaveBeenCalledWith({ data: { needId: "n1", userId: "me-1" } });
  });

  it("POST maps the unique race to a 409", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockNeedFindUnique.mockResolvedValue({ id: "n1", posterId: "other" });
    mockNeedWatchCreate.mockRejectedValue({ code: "P2002" });
    const res = await POST(
      new Request("http://x") as NextRequest,
      { params: { id: "n1" } } as never
    );
    expect(res.status).toBe(409);
  });

  it("DELETE removes the watch", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockNeedWatchDeleteMany.mockResolvedValue({ count: 1 });
    const res = await DELETE(
      new Request("http://x") as NextRequest,
      { params: { id: "n1" } } as never
    );
    expect(res.status).toBe(200);
    expect(mockNeedWatchDeleteMany).toHaveBeenCalledWith({
      where: { needId: "n1", userId: "me-1" },
    });
  });
});
