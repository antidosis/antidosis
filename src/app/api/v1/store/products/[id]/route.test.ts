import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE, PATCH } from "./route";

const mockProductFindUnique = vi.fn();
const mockProductUpdate = vi.fn();
const mockProductDelete = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshProduct: {
      findUnique: (...args: unknown[]) => mockProductFindUnique(...args),
      update: (...args: unknown[]) => mockProductUpdate(...args),
      delete: (...args: unknown[]) => mockProductDelete(...args),
    },
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

function makeRequest(body?: unknown): NextRequest {
  return new Request("http://localhost/api/v1/store/products/prod-1", {
    method: body === undefined ? "DELETE" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as NextRequest;
}

const ctx = { params: { id: "prod-1" } };
const OWNED = {
  id: "prod-1",
  builder: { id: "builder-1", profileId: "profile-1", status: "approved" },
};

describe("/api/v1/store/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null });
    mockProductFindUnique.mockResolvedValue(OWNED);
    mockProductUpdate.mockResolvedValue({ id: "prod-1" });
    mockProductDelete.mockResolvedValue({});
  });

  it("updates a product the member owns", async () => {
    const res = await PATCH(makeRequest({ stockStatus: "out_of_stock" }), ctx);
    expect(res.status).toBe(200);
    expect(mockProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stockStatus: "out_of_stock" }) })
    );
  });

  it("returns 404 when the product belongs to someone else", async () => {
    mockProductFindUnique.mockResolvedValue({
      ...OWNED,
      builder: { ...OWNED.builder, profileId: "someone-else" },
    });
    const res = await PATCH(makeRequest({ stockStatus: "out_of_stock" }), ctx);
    expect(res.status).toBe(404);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });

  it("clears the price when priceAud is null", async () => {
    const res = await PATCH(makeRequest({ priceAud: null }), ctx);
    expect(res.status).toBe(200);
    expect(mockProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ priceAudCents: null }) })
    );
  });

  it("rejects invalid categories", async () => {
    const res = await PATCH(makeRequest({ category: "spaceship" }), ctx);
    expect(res.status).toBe(400);
  });

  it("deletes an owned product", async () => {
    const res = await DELETE(makeRequest(), ctx);
    expect(res.status).toBe(200);
    expect(mockProductDelete).toHaveBeenCalledWith({ where: { id: "prod-1" } });
  });

  it("does not delete someone else's product", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), ctx);
    expect(res.status).toBe(404);
    expect(mockProductDelete).not.toHaveBeenCalled();
  });
});
