import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockContractUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    contract: {
      findUnique: (...args: unknown[]) => mockContractFindUnique(...args),
      update: (...args: unknown[]) => mockContractUpdate(...args),
    },
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
    cancelRequestedAt: null,
    cancelResponse: null,
    need: { title: "Test Need" },
    partyA: {
      id: "profile-a",
      fullName: "Alice",
      userId: "user-a",
    },
    partyB: {
      id: "profile-b",
      fullName: "Bob",
      userId: "user-b",
    },
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/request-cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel"),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel"),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel"),
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
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 400 for invalid input (reason too long)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({ reason: "x".repeat(501) }),
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
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when contract status is not pending_terms or active", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ status: "draft" }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cancellation requests can only be made after terms are locked.");
  });

  it("returns 400 when a cancellation request is already pending", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({
        cancelRequestedAt: new Date(),
        cancelResponse: null,
      })
    );

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("A cancellation request is already pending.");
  });

  it("requests cancellation without reason", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const updated = makeContract({
      cancelRequestedById: "profile-a",
      cancelRequestedAt: new Date(),
      cancelResponse: null,
      cancelResponseAt: null,
      cancelEscalatedAt: null,
      cancelReason: null,
    });
    mockContractUpdate.mockResolvedValue(updated);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBeDefined();
    expect(mockContractUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contract-1" },
        data: expect.objectContaining({
          cancelRequestedById: "profile-a",
          cancelResponse: null,
          cancelResponseAt: null,
          cancelEscalatedAt: null,
          cancelReason: null,
        }),
      })
    );
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-b",
        type: "contract_cancel_request",
        title: "Contract cancellation requested",
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_CANCEL_REQUESTED",
        userId: "user-1",
        metadata: { contractId: "contract-1", reason: undefined },
      })
    );
  });

  it("requests cancellation with reason", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const updated = makeContract({
      cancelRequestedById: "profile-b",
      cancelRequestedAt: new Date(),
      cancelResponse: null,
      cancelResponseAt: null,
      cancelEscalatedAt: null,
      cancelReason: "Changed my mind",
    });
    mockContractUpdate.mockResolvedValue(updated);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({ reason: "Changed my mind" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-a",
        type: "contract_cancel_request",
        body: expect.stringContaining("Changed my mind"),
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { contractId: "contract-1", reason: "Changed my mind" },
      })
    );
  });

  it("allows request when previous cancellation was responded to", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({
        cancelRequestedAt: new Date(),
        cancelResponse: "declined",
      })
    );

    mockContractUpdate.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
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
    mockContractUpdate.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/request-cancel", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
