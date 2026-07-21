import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockTransaction = vi.fn();

const mockTx = {
  contract: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  need: {
    update: vi.fn(),
  },
  profile: {
    update: vi.fn(),
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

// ─── Email mock ───
const mockSendContractCompletedEmail = vi.fn();

vi.mock("@/lib/email", () => ({
  sendContractCompletedEmail: (...args: unknown[]) => mockSendContractCompletedEmail(...args),
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
    aMarkedComplete: false,
    bMarkedComplete: false,
    needId: "need-1",
    need: { id: "need-1", title: "Test Need" },
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/complete", () => {
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
    mockSendContractCompletedEmail.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/complete"), {
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

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/complete"), {
      params: { id: "contract-1" },
    });

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

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/complete"), {
      params: { id: "contract-1" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Profile not found");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when contract is not active or pending_completion", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ status: "draft" }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Contract is not active");
  });

  it("returns 400 when party A already marked complete", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ aMarkedComplete: true }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already marked complete");
  });

  it("returns 400 when party B already marked complete", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract({ bMarkedComplete: true }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already marked complete");
  });

  it("marks contract as pending_completion by party A", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const pendingContract = makeContract({
      aMarkedComplete: true,
      status: "pending_completion",
    });

    mockTx.contract.update.mockResolvedValue(pendingContract);
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        aMarkedComplete: true,
        bMarkedComplete: false,
        status: "pending_completion",
        needId: "need-1",
        partyAId: "profile-a",
        partyBId: "profile-b",
      })
      .mockResolvedValueOnce(pendingContract);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBeDefined();
    expect(mockTx.contract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contract-1" },
        data: { aMarkedComplete: true, status: "pending_completion" },
      })
    );
    expect(mockTx.need.update).not.toHaveBeenCalled();
    expect(mockSendContractCompletedEmail).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_COMPLETED",
        userId: "user-1",
        metadata: { contractId: "contract-1", bothComplete: false },
      })
    );
  });

  it("completes contract when both parties mark complete", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique
      .mockResolvedValueOnce(makeContract({ aMarkedComplete: true, status: "pending_completion" }))
      .mockResolvedValueOnce({
        id: "contract-1",
        partyA: { id: "profile-a", email: "alice@example.com" },
        partyB: { id: "profile-b", email: "bob@example.com" },
        need: { title: "Test Need" },
      });

    const completedContract = makeContract({
      aMarkedComplete: true,
      bMarkedComplete: true,
      status: "completed",
      completedAt: new Date(),
    });

    mockTx.contract.update.mockResolvedValue(completedContract);
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        aMarkedComplete: true,
        bMarkedComplete: true,
        status: "pending_completion",
        needId: "need-1",
        partyAId: "profile-a",
        partyBId: "profile-b",
      })
      .mockResolvedValueOnce(completedContract);
    mockTx.need.update.mockResolvedValue({});
    mockTx.profile.update.mockResolvedValue({});

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.status).toBe("completed");
    expect(mockTx.need.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "need-1" },
        data: { status: "completed" },
      })
    );
    expect(mockTx.profile.update).toHaveBeenCalledTimes(2);
    expect(mockSendContractCompletedEmail).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_COMPLETED",
        metadata: { contractId: "contract-1", bothComplete: true },
      })
    );
  });

  it("logs error but does not fail when email/notification throws", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique
      .mockResolvedValueOnce(makeContract({ aMarkedComplete: true, status: "pending_completion" }))
      .mockResolvedValueOnce({
        id: "contract-1",
        partyA: { id: "profile-a", email: "alice@example.com" },
        partyB: { id: "profile-b", email: "bob@example.com" },
        need: { title: "Test Need" },
      });

    const completedContract = makeContract({
      aMarkedComplete: true,
      bMarkedComplete: true,
      status: "completed",
    });

    mockTx.contract.update.mockResolvedValue(completedContract);
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        aMarkedComplete: true,
        bMarkedComplete: true,
        status: "pending_completion",
        needId: "need-1",
        partyAId: "profile-a",
        partyBId: "profile-b",
      })
      .mockResolvedValueOnce(completedContract);
    mockTx.need.update.mockResolvedValue({});
    mockTx.profile.update.mockResolvedValue({});

    mockSendContractCompletedEmail.mockRejectedValue(new Error("SMTP down"));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockTx.contract.update.mockResolvedValue(
      makeContract({ aMarkedComplete: true, status: "pending_completion" })
    );
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        aMarkedComplete: true,
        bMarkedComplete: false,
        status: "pending_completion",
        needId: "need-1",
        partyAId: "profile-a",
        partyBId: "profile-b",
      })
      .mockResolvedValueOnce(makeContract({ aMarkedComplete: true, status: "pending_completion" }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/complete", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
