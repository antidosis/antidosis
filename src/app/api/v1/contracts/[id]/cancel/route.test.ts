import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockContractUpdate = vi.fn();
const mockNeedUpdate = vi.fn();
const mockAcceptanceUpdate = vi.fn();
const mockAcceptanceUpdateMany = vi.fn();
const mockTransaction = vi.fn();

const mockTx = {
  contract: {
    update: vi.fn(),
  },
  need: {
    update: vi.fn(),
  },
  acceptance: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    contract: {
      findUnique: (...args: unknown[]) => mockContractFindUnique(...args),
    },
    $transaction: (cb: any) => mockTransaction(cb),
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

// ─── Audit mocks ───
const mockAuditLog = vi.fn();
const mockGetClientInfo = vi.fn();

vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: (...args: unknown[]) => mockGetClientInfo(...args),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Helpers ───
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as NextRequest;
}

function makeAuthUser(
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeContract(overrides?: Record<string, unknown>) {
  return {
    id: "contract-1",
    partyAId: "profile-a",
    partyBId: "profile-b",
    status: "draft",
    termsLockedAt: null,
    needId: "need-1",
    acceptanceId: "acc-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    need: {
      status: "open",
    },
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockGetClientInfo.mockReturnValue({ ip: "127.0.0.1", userAgent: "test-agent" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/cancel"), {
      params: { id: "contract-1" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/cancel"), {
      params: { id: "contract-1" },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/cancel"), {
      params: { id: "contract-1" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Profile not found");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Contract not found");
  });

  it("returns 403 when user is not a party to the contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-other" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 for invalid cancelReason (too long)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({ cancelReason: "x".repeat(501) }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
    expect(body.details).toBeDefined();
  });

  it("returns 400 when contract status does not allow cancellation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ status: "completed" }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Contract cannot be cancelled at this stage");
  });

  it("returns 400 when terms are locked (requires mutual consent)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ status: "active", termsLockedAt: new Date() })
    );

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("mutual consent");
  });

  it("cancels contract with no reason", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockTx.contract.update.mockResolvedValue(
      makeContract({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledById: "user-1",
        cancelReason: null,
      })
    );
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.status).toBe("cancelled");
    expect(body.contract.cancelReason).toBeNull();

    expect(mockTx.contract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "cancelled",
          cancelledById: "user-1",
          cancelReason: null,
        }),
      })
    );
    expect(mockTx.need.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "need-1" },
        data: { status: "archived" },
      })
    );
    expect(mockTx.acceptance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "acc-1" },
        data: { status: "accepted" },
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_CANCELLED",
        userId: "user-1",
        metadata: { contractId: "contract-1", cancelReason: undefined },
      })
    );
  });

  it("cancels contract with a reason", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockTx.contract.update.mockResolvedValue(
      makeContract({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledById: "user-1",
        cancelReason: "Changed my mind",
      })
    );
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({ cancelReason: "Changed my mind" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.cancelReason).toBe("Changed my mind");
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { contractId: "contract-1", cancelReason: "Changed my mind" },
      })
    );
  });

  it("cancels active contract and archives need", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ status: "active", need: { status: "active" } })
    );

    mockTx.contract.update.mockResolvedValue(
      makeContract({ status: "cancelled", cancelledAt: new Date(), cancelledById: "user-1" })
    );
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 2 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockTx.need.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "archived" },
      })
    );
  });

  it("does not archive need if status is not in archive list", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ status: "draft", need: { status: "archived" } })
    );

    mockTx.contract.update.mockResolvedValue(
      makeContract({ status: "cancelled", cancelledAt: new Date(), cancelledById: "user-1" })
    );
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    // need.update should NOT be called because need status is "archived"
    expect(mockTx.need.update).not.toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockTx.contract.update.mockResolvedValue(
      makeContract({ status: "cancelled", cancelledAt: new Date(), cancelledById: "user-1" })
    );
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/cancel", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
