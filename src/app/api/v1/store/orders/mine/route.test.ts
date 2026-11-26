import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockGetUser = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockOrderFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    meshOrder: { findMany: (...args: unknown[]) => mockOrderFindMany(...args) },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

const req = new Request("http://localhost/api/v1/store/orders/mine") as NextRequest;

describe("GET /api/v1/store/orders/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockOrderFindMany.mockResolvedValue([
      { id: "order-1", orderRef: "MESH-ABC123", status: "placed" },
    ]);
  });

  it("returns only the signed-in member's orders", async () => {
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { buyerId: "profile-1" } })
    );
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(mockOrderFindMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the member has no profile", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
