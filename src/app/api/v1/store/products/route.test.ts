import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

const mockBuilderFindUnique = vi.fn();
const mockProductCreate = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshBuilder: { findUnique: (...args: unknown[]) => mockBuilderFindUnique(...args) },
    meshProduct: { create: (...args: unknown[]) => mockProductCreate(...args) },
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/store/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const PRODUCT = {
  name: "Field Node — T-Beam 915",
  category: "node",
  description:
    "Pre-flashed LilyGo T-Beam with the antidosis channel configured and a tested antenna.",
  specs: "LilyGo T-Beam · 915 MHz · 18650 battery",
  priceAud: 95,
  stockStatus: "in_stock",
  buyUrl: "https://www.etsy.com/shop/coastmesh",
};

describe("POST /api/v1/store/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null });
    mockBuilderFindUnique.mockResolvedValue({
      id: "builder-1",
      status: "approved",
      extraSlots: 0,
      _count: { products: 2 },
    });
    mockProductCreate.mockResolvedValue({ id: "prod-1" });
  });

  it("creates a product and converts dollars to cents", async () => {
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(201);
    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ builderId: "builder-1", priceAudCents: 9500 }),
      })
    );
  });

  it("allows price on application (null price)", async () => {
    const res = await POST(makeRequest({ ...PRODUCT, priceAud: null }));
    expect(res.status).toBe(201);
    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ priceAudCents: null }),
      })
    );
  });

  it("rejects unauthenticated requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(401);
  });

  it("rejects banned members", async () => {
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: new Date() });
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(403);
  });

  it("requires a builder application first", async () => {
    mockBuilderFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(404);
  });

  it("blocks products until the builder is approved", async () => {
    mockBuilderFindUnique.mockResolvedValue({
      id: "builder-1",
      status: "pending",
      extraSlots: 0,
      _count: { products: 0 },
    });
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(403);
    expect(mockProductCreate).not.toHaveBeenCalled();
  });

  it("enforces the free slot limit (3 products)", async () => {
    mockBuilderFindUnique.mockResolvedValue({
      id: "builder-1",
      status: "approved",
      extraSlots: 0,
      _count: { products: 3 },
    });
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("SLOT_LIMIT_REACHED");
    expect(body.slotLimit).toBe(3);
    expect(mockProductCreate).not.toHaveBeenCalled();
  });

  it("extra slots raise the shelf limit", async () => {
    mockBuilderFindUnique.mockResolvedValue({
      id: "builder-1",
      status: "approved",
      extraSlots: 2,
      _count: { products: 4 },
    });
    const res = await POST(makeRequest(PRODUCT));
    expect(res.status).toBe(201);
  });

  it("rejects blocked buy links", async () => {
    const res = await POST(makeRequest({ ...PRODUCT, buyUrl: "https://bit.ly/x" }));
    expect(res.status).toBe(400);
    expect(mockProductCreate).not.toHaveBeenCalled();
  });
});
