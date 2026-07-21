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
    cancelResponse: "declined",
    cancelEscalatedAt: null,
    need: { title: "Test Need" },
    partyA: { id: "profile-a", fullName: "Alice", email: "alice@example.com" },
    partyB: { id: "profile-b", fullName: "Bob", email: "bob@example.com" },
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/escalate-cancel", () => {
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel"),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel"),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel"),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when cancellation was not declined", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ cancelResponse: null }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(
      "You can only escalate after the other party has declined your cancellation request."
    );
  });

  it("returns 400 when already escalated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ cancelEscalatedAt: new Date() }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("This cancellation has already been escalated to admin.");
  });

  it("escalates cancellation as party A and notifies party B", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const escalated = makeContract({ cancelEscalatedAt: new Date() });
    mockContractUpdate.mockResolvedValue(escalated);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBeDefined();
    expect(mockContractUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contract-1" },
        data: expect.objectContaining({ cancelEscalatedAt: expect.any(Date) }),
      })
    );
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-b",
        type: "contract_cancel_escalated",
        title: "Cancellation escalated to admin",
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_CANCEL_ESCALATED",
        userId: "user-1",
        metadata: { contractId: "contract-1" },
      })
    );
  });

  it("escalates cancellation as party B and notifies party A", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const escalated = makeContract({ cancelEscalatedAt: new Date() });
    mockContractUpdate.mockResolvedValue(escalated);

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "profile-a",
        type: "contract_cancel_escalated",
      })
    );
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/escalate-cancel", {
        method: "POST",
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
