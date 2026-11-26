import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockGetUser = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockIdentityFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    meshIdentity: { findMany: (...args: unknown[]) => mockIdentityFindMany(...args) },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

const req = new Request("http://localhost/api/v1/mesh-identities/mine") as NextRequest;

describe("GET /api/v1/mesh-identities/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockIdentityFindMany.mockResolvedValue([
      { id: "identity-1", publicKey: "a".repeat(64), meshName: "COAST-NORTH", status: "active" },
    ]);
  });

  it("returns only the signed-in member's bound nodes", async () => {
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.identities).toHaveLength(1);
    expect(mockIdentityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profileId: "profile-1" } })
    );
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(mockIdentityFindMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the member has no profile", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
