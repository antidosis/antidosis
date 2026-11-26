import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

const mockProductFindUnique = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockOrderFindUnique = vi.fn();
const mockGetUser = vi.fn();
const mockRateLimit = vi.fn();
const mockTxProductUpdateMany = vi.fn();
const mockTxOrderCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshProduct: { findUnique: (...args: unknown[]) => mockProductFindUnique(...args) },
    meshOrder: { findUnique: (...args: unknown[]) => mockOrderFindUnique(...args) },
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "user:user-1",
}));

const PRODUCT_ID = "8c964791-203f-489f-92a1-dfe805cadccd";

const FIRST_PARTY_PRODUCT = {
  id: PRODUCT_ID,
  priceAudCents: 8900,
  postageAudCents: 800,
  offerPostage: true,
  stockCount: 10,
  soldByAntidosis: true,
  builder: { status: "approved" },
};

const ORDER_INPUT = {
  productId: PRODUCT_ID,
  meshName: "Kookaburra-1",
  deliveryName: "Sam Citizen",
  deliveryAddress: "1 Beach St, Terrigal NSW 2260",
  buyerNote: "leave at door",
};

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/store/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/v1/store/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    // requireVerifiedParticipation + member-code allocation share this mock
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
    });
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockOrderFindUnique.mockResolvedValue(null);
    mockProductFindUnique.mockResolvedValue(FIRST_PARTY_PRODUCT);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        meshProduct: { updateMany: (...args: unknown[]) => mockTxProductUpdateMany(...args) },
        meshOrder: { create: (...args: unknown[]) => mockTxOrderCreate(...args) },
      })
    );
    mockTxProductUpdateMany.mockResolvedValue({ count: 1 });
    mockTxOrderCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "order-1",
      ...data,
    }));
  });

  it("places an order, reserves stock and snapshots the totals", async () => {
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.order.orderRef).toMatch(/^MESH-/);
    expect(body.order.totalAudCents).toBe(9700);
    expect(body.payment.reference).toBe(body.order.orderRef);
    expect(mockTxProductUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PRODUCT_ID, stockCount: { gt: 0 } },
        data: { stockCount: { decrement: 1 } },
      })
    );
    expect(mockTxOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyerId: "profile-1",
          meshName: "Kookaburra-1",
          priceAudCents: 8900,
          postageAudCents: 800,
          totalAudCents: 9700,
        }),
      })
    );
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(401);
  });

  it("requires a verified mobile (customers only)", async () => {
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: false,
      bannedAt: null,
    });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("MOBILE_NOT_VERIFIED");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("blocks suspended accounts", async () => {
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: new Date(),
    });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(403);
  });

  it("refuses builder listings — those stay message-to-buy", async () => {
    mockProductFindUnique.mockResolvedValue({
      ...FIRST_PARTY_PRODUCT,
      soldByAntidosis: false,
    });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("NOT_FIRST_PARTY");
  });

  it("returns 404 for listings from unapproved builders", async () => {
    mockProductFindUnique.mockResolvedValue({
      ...FIRST_PARTY_PRODUCT,
      builder: { status: "pending" },
    });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(404);
  });

  it("returns 409 when the last unit was just taken", async () => {
    mockTxProductUpdateMany.mockResolvedValue({ count: 0 });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("OUT_OF_STOCK");
    expect(mockTxOrderCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing delivery address", async () => {
    const res = await POST(makeRequest({ ...ORDER_INPUT, deliveryAddress: "short" }));
    expect(res.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rate limits order attempts", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(makeRequest(ORDER_INPUT));
    expect(res.status).toBe(429);
  });
});
