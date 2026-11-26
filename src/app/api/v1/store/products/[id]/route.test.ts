import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE, GET, PATCH } from "./route";

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
  offerPostage: true,
  localPickup: false,
  builder: { id: "builder-1", profileId: "profile-1", status: "approved" },
};

const PUBLIC_PRODUCT = {
  id: "prod-1",
  name: "Field Node",
  builder: {
    id: "builder-1",
    businessName: "CoastMesh",
    suburb: "Noraville",
    website: null,
    status: "approved",
    profile: {
      id: "profile-1",
      handle: "coastmesh",
      fullName: null,
      avatarUrl: null,
      isVerified: true,
    },
  },
};

function makeGetRequest(): NextRequest {
  return new Request("http://localhost/api/v1/store/products/prod-1") as NextRequest;
}

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

  it("rejects updates that remove every delivery method", async () => {
    mockProductFindUnique.mockResolvedValue({ ...OWNED, offerPostage: false, localPickup: false });
    const res = await PATCH(makeRequest({ offerPostage: false }), ctx);
    expect(res.status).toBe(400);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });

  it("keeps the delivery invariant against the merged listing", async () => {
    // Stored listing has pickup only; enabling postage alone is fine
    mockProductFindUnique.mockResolvedValue({ ...OWNED, offerPostage: false, localPickup: true });
    const res = await PATCH(makeRequest({ offerPostage: true, postageAud: 9 }), ctx);
    expect(res.status).toBe(200);
    expect(mockProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ offerPostage: true, postageAudCents: 900 }),
      })
    );
  });

  it("turning postage off clears the flat rate", async () => {
    mockProductFindUnique.mockResolvedValue({ ...OWNED, offerPostage: true, localPickup: true });
    const res = await PATCH(makeRequest({ offerPostage: false }), ctx);
    expect(res.status).toBe(200);
    expect(mockProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ postageAudCents: null }) })
    );
  });

  it("updates payment terms", async () => {
    const res = await PATCH(makeRequest({ paymentTerms: ["payid", "cash_on_pickup"] }), ctx);
    expect(res.status).toBe(200);
    expect(mockProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentTerms: ["payid", "cash_on_pickup"] }),
      })
    );
  });

  it("rejects an empty payment terms list", async () => {
    const res = await PATCH(makeRequest({ paymentTerms: [] }), ctx);
    expect(res.status).toBe(400);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/store/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductFindUnique.mockResolvedValue(PUBLIC_PRODUCT);
  });

  it("returns the listing with its seller", async () => {
    const res = await GET(makeGetRequest(), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.id).toBe("prod-1");
    expect(body.seller.businessName).toBe("CoastMesh");
    expect(body.seller.profile.id).toBe("profile-1");
  });

  it("hides listings from builders who are not approved", async () => {
    mockProductFindUnique.mockResolvedValue({
      ...PUBLIC_PRODUCT,
      builder: { ...PUBLIC_PRODUCT.builder, status: "pending" },
    });
    const res = await GET(makeGetRequest(), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown listings", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), ctx);
    expect(res.status).toBe(404);
  });
});
