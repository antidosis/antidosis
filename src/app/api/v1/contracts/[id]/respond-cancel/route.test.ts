import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockContractUpdate = vi.fn();
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
      update: (...args: unknown[]) => mockContractUpdate(...args),
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

// ─── Notifications mock ───
const mockCreateNotification = vi.fn();

vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
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
    status: "active",
    needId: "need-1",
    need: { id: "need-1", title: "Test Need", status: "active" },
    acceptanceId: "acc-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    cancelRequestedById: "profile-a",
    cancelRequestedAt: new Date(),
    cancelResponse: null,
    partyA: { id: "profile-a", fullName: "Alice" },
    partyB: { id: "profile-b", fullName: "Bob" },
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/respond-cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
    mockGetClientInfo.mockReturnValue({
      ip: "127.0.0.1",
      userAgent: "test-agent",
    });
    mockCreateNotification.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel"),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel"),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel"),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Profile not found");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 400 for invalid input", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: "yes" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
    expect(body.details).toBeDefined();
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Contract not found");
  });

  it("returns 403 when user is not a party to the contract", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-other" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when responder is the requester", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("You cannot respond to your own cancellation request.");
  });

  it("returns 400 when no pending cancellation request", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract({ cancelRequestedAt: null }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No pending cancellation request to respond to.");
  });

  it("returns 400 when cancellation already has a response", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract({ cancelResponse: "declined" }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No pending cancellation request to respond to.");
  });

  it("agrees to cancel and archives need", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const cancelled = makeContract({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledById: "user-1",
      cancelResponse: "agreed",
      cancelResponseAt: new Date(),
    });

    mockTx.contract.update.mockResolvedValue(cancelled);
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 1 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.status).toBe("cancelled");
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
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-a",
        type: "contract_cancel_agreed",
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_CANCEL_AGREED",
        metadata: { contractId: "contract-1", agreed: true },
      })
    );
  });

  it("agrees to cancel but does not archive need when status not in list", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract({ need: { status: "archived" } }));

    mockTx.contract.update.mockResolvedValue(makeContract({ status: "cancelled" }));
    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: true }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockTx.need.update).not.toHaveBeenCalled();
  });

  it("declines to cancel", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const declined = makeContract({
      cancelResponse: "declined",
      cancelResponseAt: new Date(),
    });
    mockContractUpdate.mockResolvedValue(declined);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: false }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.cancelResponse).toBe("declined");
    expect(mockContractUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contract-1" },
        data: expect.objectContaining({ cancelResponse: "declined" }),
      })
    );
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-a",
        type: "contract_cancel_declined",
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_CANCEL_DECLINED",
        metadata: { contractId: "contract-1", agreed: false },
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockContractUpdate.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/respond-cancel", {
        method: "POST",
        body: JSON.stringify({ agree: false }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
