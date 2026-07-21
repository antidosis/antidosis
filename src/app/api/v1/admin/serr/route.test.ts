import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireAdmin = vi.fn();
const mockContractFindMany = vi.fn();
const mockAcceptanceFindMany = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contract: {
      findMany: (...args: unknown[]) => mockContractFindMany(...args),
    },
    acceptance: {
      findMany: (...args: unknown[]) => mockAcceptanceFindMany(...args),
    },
  },
}));

import { GET } from "./route";

function makeRequest(url: string): NextRequest {
  const req = new Request(url) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

const SELLER = {
  id: "seller-1",
  fullName: "Sam Seller",
  email: "sam@example.com",
  mobile: "+61400000000",
  abn: "12345678901",
  locationName: "Gosford",
};

const CONTRACT = {
  id: "contract-1",
  acceptanceId: "acc-linked",
  completedAt: new Date("2026-03-10T00:00:00Z"),
  need: { title: "Fix fence", offerType: "money", offerValue: 150 },
  partyB: SELLER,
};

const FREE_FORM = {
  id: "acc-free",
  updatedAt: new Date("2026-04-01T00:00:00Z"),
  need: { title: "Swap tomatoes", offerType: "item", offerValue: null },
  user: { ...SELLER, id: "seller-2", email: "other@example.com", abn: null },
};

describe("GET /api/v1/admin/serr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ authorized: true });
    mockContractFindMany.mockResolvedValue([CONTRACT]);
    mockAcceptanceFindMany.mockResolvedValue([FREE_FORM]);
  });

  it("returns the admin response when not authorized", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/serr"));
    expect(res.status).toBe(403);
  });

  it("aggregates sellers with cash and barter transactions", async () => {
    const res = await GET(makeRequest("http://localhost/api/v1/admin/serr"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totals.sellers).toBe(2);
    expect(body.totals.transactions).toBe(2);
    expect(body.totals.totalCashAud).toBe(150);

    const cash = body.sellers.find((s: { profileId: string }) => s.profileId === "seller-1");
    expect(cash.fullName).toBe("Sam Seller");
    expect(cash.abn).toBe("12345678901");
    expect(cash.transactionCount).toBe(1);
    expect(cash.cashTransactionCount).toBe(1);
    expect(cash.totalCashAud).toBe(150);

    const barter = body.sellers.find((s: { profileId: string }) => s.profileId === "seller-2");
    expect(barter.totalCashAud).toBe(0);
    expect(barter.cashTransactionCount).toBe(0);
  });

  it("excludes acceptances already covered by a contract", async () => {
    const res = await GET(makeRequest("http://localhost/api/v1/admin/serr"));
    expect(res.status).toBe(200);

    const acceptanceQuery = mockAcceptanceFindMany.mock.calls[0][0];
    expect(acceptanceQuery.where.id).toEqual({ notIn: ["acc-linked"] });
    expect(acceptanceQuery.where.posterMarkedComplete).toBe(true);
    expect(acceptanceQuery.where.fulfillerMarkedComplete).toBe(true);
  });

  it("honours from/to date params", async () => {
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/serr?from=2026-01-01&to=2026-06-30")
    );
    expect(res.status).toBe(200);

    const contractQuery = mockContractFindMany.mock.calls[0][0];
    expect(contractQuery.where.completedAt.gte).toEqual(new Date("2026-01-01"));
    expect(contractQuery.where.completedAt.lte).toEqual(new Date("2026-06-30"));
  });

  it("returns 400 when from is after to", async () => {
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/serr?from=2026-07-01&to=2026-01-01")
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("from");
  });

  it("returns CSV with seller identity and transaction rows", async () => {
    const res = await GET(makeRequest("http://localhost/api/v1/admin/serr?format=csv"));
    const text = await res.text();

    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("serr-");
    const lines = text.trim().split("\r\n");
    expect(lines[0]).toContain("Payee ABN");
    expect(lines[0]).toContain("Gross Consideration (AUD)");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("12345678901");
    expect(lines[1]).toContain("150.00");
    expect(lines[2]).toContain("other@example.com");
    expect(lines[2]).toContain("0.00");
  });
});
