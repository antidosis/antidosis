import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockContractFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contract: {
      findMany: (...args: unknown[]) => mockContractFindMany(...args),
    },
  },
}));

// ─── Admin mock ───
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// ─── Helpers ───
function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

describe("GET /api/v1/admin/contracts/pending-cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContractFindMany.mockResolvedValue([]);
  });

  it("returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/contracts/pending-cancellation")
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when forbidden", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/contracts/pending-cancellation")
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with pending contracts", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });
    mockContractFindMany.mockResolvedValue([
      {
        id: "contract-1",
        need: { id: "need-1", title: "Test" },
        partyA: { id: "p1", fullName: "Alice", email: "a@example.com", avatarUrl: null },
        partyB: { id: "p2", fullName: "Bob", email: "b@example.com", avatarUrl: null },
      },
    ]);

    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/contracts/pending-cancellation")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.contracts).toHaveLength(1);
    expect(body.contracts[0].id).toBe("contract-1");
  });

  it("includes x-request-id header", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });
    mockContractFindMany.mockResolvedValue([]);

    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/contracts/pending-cancellation")
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
