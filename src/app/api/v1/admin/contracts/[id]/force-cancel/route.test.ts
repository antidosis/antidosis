import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockContractFindUnique = vi.fn();
const mockContractUpdate = vi.fn();
const mockNeedUpdate = vi.fn();
const mockAcceptanceUpdate = vi.fn();
const mockAcceptanceUpdateMany = vi.fn();
const mockTransaction = vi.fn();

const mockTx = {
  contract: {
    update: (...args: unknown[]) => mockContractUpdate(...args),
  },
  need: {
    update: (...args: unknown[]) => mockNeedUpdate(...args),
  },
  acceptance: {
    update: (...args: unknown[]) => mockAcceptanceUpdate(...args),
    updateMany: (...args: unknown[]) => mockAcceptanceUpdateMany(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contract: {
      findUnique: (...args: unknown[]) => mockContractFindUnique(...args),
    },
    $transaction: (cb: any) => mockTransaction(cb),
  },
}));

// ─── Admin mock ───
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

// ─── Helpers ───
function makeRequest(url: string): NextRequest {
  return new Request(url, { method: "POST" }) as NextRequest;
}

describe("POST /api/v1/admin/contracts/[id]/force-cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
  });

  it("returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(makeRequest("http://localhost/api/v1/admin/contracts/c1/force-cancel"), {
      params: { id: "c1" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when forbidden", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await POST(makeRequest("http://localhost/api/v1/admin/contracts/c1/force-cancel"), {
      params: { id: "c1" },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when contract not found", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("http://localhost/api/v1/admin/contracts/c1/force-cancel"), {
      params: { id: "c1" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Contract not found");
  });

  it("returns 400 when already cancelled", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });
    mockContractFindUnique.mockResolvedValue({
      id: "c1",
      status: "cancelled",
      need: { status: "open" },
      partyA: { id: "p1", fullName: "Alice" },
      partyB: { id: "p2", fullName: "Bob" },
    });

    const res = await POST(makeRequest("http://localhost/api/v1/admin/contracts/c1/force-cancel"), {
      params: { id: "c1" },
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Contract is already cancelled.");
  });

  it("returns 200 and cancels contract", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });
    mockContractFindUnique.mockResolvedValue({
      id: "c1",
      status: "active",
      needId: "need-1",
      acceptanceId: "acc-1",
      createdAt: new Date(),
      need: { status: "active", title: "Test" },
      partyA: { id: "p1", fullName: "Alice" },
      partyB: { id: "p2", fullName: "Bob" },
    });
    mockContractUpdate.mockResolvedValue({ id: "c1", status: "cancelled" });

    const res = await POST(makeRequest("http://localhost/api/v1/admin/contracts/c1/force-cancel"), {
      params: { id: "c1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.contract.status).toBe("cancelled");
    expect(mockNeedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "archived" } })
    );
    expect(mockAcceptanceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "accepted" } })
    );
  });

  it("includes x-request-id header", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });
    mockContractFindUnique.mockResolvedValue({
      id: "c1",
      status: "active",
      needId: "need-1",
      acceptanceId: "acc-1",
      createdAt: new Date(),
      need: { status: "active", title: "Test" },
      partyA: { id: "p1", fullName: "Alice" },
      partyB: { id: "p2", fullName: "Bob" },
    });
    mockContractUpdate.mockResolvedValue({ id: "c1", status: "cancelled" });

    const res = await POST(makeRequest("http://localhost/api/v1/admin/contracts/c1/force-cancel"), {
      params: { id: "c1" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
