import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));

const mockProfileFindUnique = vi.fn();
const mockNeedViewFindFirst = vi.fn();
const mockNeedViewCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...a: unknown[]) => mockProfileFindUnique(...a) },
    needView: {
      findFirst: (...a: unknown[]) => mockNeedViewFindFirst(...a),
      create: (...a: unknown[]) => mockNeedViewCreate(...a),
    },
  },
}));

function makeRequest(ip?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (ip) headers["x-forwarded-for"] = ip;
  return new Request("http://localhost/api/v1/needs/n1/view", {
    method: "POST",
    headers,
  }) as NextRequest;
}

describe("POST /api/v1/needs/[id]/view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dedupes a logged-in viewer within 24h", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "p1" });
    mockNeedViewFindFirst.mockResolvedValue({ id: "v1" }); // viewed recently

    const res = await POST(makeRequest(), { params: { id: "n1" } } as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ counted: false });
    expect(mockNeedViewCreate).not.toHaveBeenCalled();
    expect(mockNeedViewFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ viewerId: "p1" }) })
    );
  });

  it("counts a first-time view for a logged-in viewer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "p1" });
    mockNeedViewFindFirst.mockResolvedValue(null);
    mockNeedViewCreate.mockResolvedValue({ id: "v2" });

    const res = await POST(makeRequest(), { params: { id: "n1" } } as never);
    expect(await res.json()).toEqual({ counted: true });
    expect(mockNeedViewCreate).toHaveBeenCalledWith({
      data: { needId: "n1", viewerId: "p1", ipHash: null },
    });
  });

  it("dedupes anonymous viewers by IP hash", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockNeedViewFindFirst.mockResolvedValue(null);
    mockNeedViewCreate.mockResolvedValue({ id: "v3" });

    const res = await POST(makeRequest("203.0.113.7"), { params: { id: "n1" } } as never);
    expect(await res.json()).toEqual({ counted: true });
    const created = mockNeedViewCreate.mock.calls[0][0].data;
    expect(created.viewerId).toBeNull();
    expect(created.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created.ipHash).not.toContain("203.0.113.7");
  });

  it("counts but cannot dedupe when there is no auth and no IP", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockNeedViewCreate.mockResolvedValue({ id: "v4" });

    const res = await POST(makeRequest(), { params: { id: "n1" } } as never);
    expect(await res.json()).toEqual({ counted: true });
    expect(mockNeedViewFindFirst).not.toHaveBeenCalled();
    expect(mockNeedViewCreate).toHaveBeenCalledWith({
      data: { needId: "n1", viewerId: null, ipHash: null },
    });
  });
});
