import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./route";

const mockIsAdmin = vi.fn();
const mockOrderFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockTxProductUpdate = vi.fn();
const mockTxProductUpdateMany = vi.fn();
const mockTxOrderUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshOrder: { findUnique: (...args: unknown[]) => mockOrderFindUnique(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: () =>
    mockIsAdmin()
      ? Promise.resolve({ authorized: true })
      : Promise.resolve({
          authorized: false,
          response: new Response("Forbidden", { status: 403 }),
        }),
}));

const ORDER = {
  id: "order-1",
  productId: "prod-1",
  status: "placed",
};

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/admin/store/orders/order-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const CTX = { params: { id: "order-1" } };

describe("PATCH /api/v1/admin/store/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockReturnValue(true);
    mockOrderFindUnique.mockResolvedValue(ORDER);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        meshProduct: {
          update: (...args: unknown[]) => mockTxProductUpdate(...args),
          updateMany: (...args: unknown[]) => mockTxProductUpdateMany(...args),
        },
        meshOrder: { update: (...args: unknown[]) => mockTxOrderUpdate(...args) },
      })
    );
    mockTxProductUpdate.mockResolvedValue({ id: "prod-1", stockCount: 5 });
    mockTxProductUpdateMany.mockResolvedValue({ count: 1 });
    mockTxOrderUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "order-1",
      ...data,
    }));
  });

  it("requires admin", async () => {
    mockIsAdmin.mockReturnValue(false);
    const res = await PATCH(makeRequest({ status: "paid" }), CTX);
    expect(res.status).toBe(403);
  });

  it("moves an order through the pipeline", async () => {
    const res = await PATCH(makeRequest({ status: "paid" }), CTX);
    expect(res.status).toBe(200);
    expect(mockTxOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-1" },
        data: expect.objectContaining({ status: "paid" }),
      })
    );
    // No stock movement on a normal transition
    expect(mockTxProductUpdate).not.toHaveBeenCalled();
  });

  it("cancelling returns the unit to shelf stock", async () => {
    const res = await PATCH(makeRequest({ status: "cancelled" }), CTX);
    expect(res.status).toBe(200);
    expect(mockTxProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { stockCount: { increment: 1 } },
    });
  });

  it("restores in_stock when a cancellation brings stock back from zero", async () => {
    mockTxProductUpdate.mockResolvedValue({ id: "prod-1", stockCount: 1 });
    await PATCH(makeRequest({ status: "cancelled" }), CTX);
    expect(mockTxProductUpdateMany).toHaveBeenCalledWith({
      where: { id: "prod-1", stockStatus: "out_of_stock" },
      data: { stockStatus: "in_stock" },
    });
  });

  it("a cancelled order cannot be reopened", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...ORDER, status: "cancelled" });
    const res = await PATCH(makeRequest({ status: "paid" }), CTX);
    expect(res.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects an unknown status", async () => {
    const res = await PATCH(makeRequest({ status: "teleported" }), CTX);
    expect(res.status).toBe(400);
  });

  it("returns 404 for a missing order", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "paid" }), CTX);
    expect(res.status).toBe(404);
  });
});
