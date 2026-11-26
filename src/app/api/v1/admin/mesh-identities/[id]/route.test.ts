import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./route";

const mockIdentityFindUnique = vi.fn();
const mockIdentityUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshIdentity: {
      findUnique: (...args: unknown[]) => mockIdentityFindUnique(...args),
      update: (...args: unknown[]) => mockIdentityUpdate(...args),
    },
  },
}));

const mockRequireAdmin = vi.fn();
vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/admin/mesh-identities/identity-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const ctx = { params: { id: "identity-1" } };

describe("PATCH /api/v1/admin/mesh-identities/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ authorized: true });
    mockIdentityFindUnique.mockResolvedValue({ id: "identity-1", status: "active" });
    mockIdentityUpdate.mockResolvedValue({ id: "identity-1", status: "revoked" });
  });

  it("revoking stamps revokedAt", async () => {
    const res = await PATCH(makeRequest({ status: "revoked" }), ctx);
    expect(res.status).toBe(200);
    expect(mockIdentityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "revoked", revokedAt: expect.any(Date) }),
      })
    );
  });

  it("reactivating clears revokedAt", async () => {
    mockIdentityUpdate.mockResolvedValue({ id: "identity-1", status: "active" });
    const res = await PATCH(makeRequest({ status: "active" }), ctx);
    expect(res.status).toBe(200);
    expect(mockIdentityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active", revokedAt: null }),
      })
    );
  });

  it("returns 404 for an unknown identity", async () => {
    mockIdentityFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "revoked" }), ctx);
    expect(res.status).toBe(404);
  });

  it("rejects an invalid status", async () => {
    const res = await PATCH(makeRequest({ status: "deleted" }), ctx);
    expect(res.status).toBe(400);
    expect(mockIdentityUpdate).not.toHaveBeenCalled();
  });

  it("requires admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    });
    const res = await PATCH(makeRequest({ status: "revoked" }), ctx);
    expect(res.status).toBe(403);
  });
});
