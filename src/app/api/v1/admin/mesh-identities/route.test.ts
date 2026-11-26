import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

const mockOrderFindUnique = vi.fn();
const mockIdentityFindUnique = vi.fn();
const mockIdentityCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshOrder: { findUnique: (...args: unknown[]) => mockOrderFindUnique(...args) },
    meshIdentity: {
      findUnique: (...args: unknown[]) => mockIdentityFindUnique(...args),
      create: (...args: unknown[]) => mockIdentityCreate(...args),
    },
  },
}));

const mockRequireAdmin = vi.fn();
vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

const PUBLIC_KEY = "a".repeat(64);

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/admin/mesh-identities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/v1/admin/mesh-identities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ authorized: true });
    mockOrderFindUnique.mockResolvedValue({
      id: "order-1",
      buyerId: "buyer-1",
      meshName: "COAST-NORTH",
      status: "preparing",
    });
    mockIdentityFindUnique.mockResolvedValue(null);
    mockIdentityCreate.mockResolvedValue({
      id: "identity-1",
      publicKey: PUBLIC_KEY,
      meshName: "COAST-NORTH",
      status: "active",
    });
  });

  it("binds the device key to the order's buyer with the order's mesh name", async () => {
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY }));
    expect(res.status).toBe(201);
    expect(mockIdentityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileId: "buyer-1",
          identityType: "meshcore_ed25519",
          publicKey: PUBLIC_KEY,
          meshName: "COAST-NORTH",
        }),
      })
    );
  });

  it("normalises an uppercase key and accepts it", async () => {
    const res = await POST(
      makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY.toUpperCase() })
    );
    expect(res.status).toBe(201);
    expect(mockIdentityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publicKey: PUBLIC_KEY }),
      })
    );
  });

  it("rejects a malformed public key", async () => {
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: "not-a-key" }));
    expect(res.status).toBe(400);
    expect(mockIdentityCreate).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown order", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY }));
    expect(res.status).toBe(404);
  });

  it("refuses to bind a cancelled order", async () => {
    mockOrderFindUnique.mockResolvedValue({
      id: "order-1",
      buyerId: "buyer-1",
      meshName: "X",
      status: "cancelled",
    });
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY }));
    expect(res.status).toBe(400);
    expect(mockIdentityCreate).not.toHaveBeenCalled();
  });

  it("conflicts when the key is already bound to this member", async () => {
    mockIdentityFindUnique.mockResolvedValue({ id: "identity-9", profileId: "buyer-1" });
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already bound to this member/);
  });

  it("conflicts when the key is bound to a different member", async () => {
    mockIdentityFindUnique.mockResolvedValue({ id: "identity-9", profileId: "buyer-2" });
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/different member/);
  });

  it("requires admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    });
    const res = await POST(makeRequest({ orderId: crypto.randomUUID(), publicKey: PUBLIC_KEY }));
    expect(res.status).toBe(403);
    expect(mockIdentityCreate).not.toHaveBeenCalled();
  });
});
