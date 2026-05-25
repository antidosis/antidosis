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
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  need: {
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

// ─── Audit mocks ───
const mockAuditLog = vi.fn();
const mockGetClientInfo = vi.fn();

vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: (...args: unknown[]) => mockGetClientInfo(...args),
}));

// ─── Email mock ───
const mockSendContractSignedEmail = vi.fn();

vi.mock("@/lib/email", () => ({
  sendContractSignedEmail: (...args: unknown[]) => mockSendContractSignedEmail(...args),
}));

// ─── Notification mock ───
const mockCreateNotification = vi.fn();

vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
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
    status: "pending_terms",
    termsLockedAt: new Date("2024-01-10T00:00:00Z"),
    partyASignedAt: null,
    partyBSignedAt: null,
    partyASignature: null,
    partyBSignature: null,
    needId: "need-1",
    ...overrides,
  };
}

describe("POST /api/v1/contracts/[id]/sign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockGetClientInfo.mockReturnValue({ ip: "127.0.0.1", userAgent: "test-agent" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/sign"), {
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

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/sign"), {
      params: { id: "contract-1" },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("http://localhost/api/v1/contracts/contract-1/sign"), {
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
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
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 for invalid signature input", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "A" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("full name");
  });

  it("returns 400 when terms are not locked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ termsLockedAt: null }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Terms must be agreed and locked before signing");
  });

  it("returns 400 when contract cannot be signed at this stage", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ status: "active" }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Contract cannot be signed at this stage");
  });

  it("returns 400 when party A already signed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ partyASignedAt: new Date() }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already signed");
  });

  it("returns 400 when party B already signed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract({ partyBSignedAt: new Date() }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Bob Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already signed");
  });

  it("signs contract as first party (not yet active)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockTx.contract.update.mockResolvedValue(makeContract({ partyASignedAt: new Date() }));
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        partyASignedAt: new Date(),
        partyBSignedAt: null,
        status: "pending_terms",
      })
      .mockResolvedValueOnce(makeContract({ partyASignedAt: new Date() }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBeDefined();
    expect(mockSendContractSignedEmail).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CONTRACT_SIGNED",
        userId: "user-1",
      })
    );
  });

  it("signs contract as second party and activates contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });

    const activeContract = makeContract({
      partyASignedAt: new Date(),
      partyBSignedAt: new Date(),
      partyBSignature: "Bob Smith",
      status: "active",
    });

    mockTx.contract.update.mockResolvedValue(activeContract);
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        partyASignedAt: new Date(),
        partyBSignedAt: new Date(),
        status: "pending_terms",
      })
      .mockResolvedValueOnce(activeContract);

    // Mock the contract lookup for email/notification sending
    mockContractFindUnique
      .mockResolvedValueOnce(makeContract({ partyASignedAt: new Date() }))
      .mockResolvedValueOnce({
        id: "contract-1",
        partyA: { id: "profile-a", email: "alice@example.com", fullName: "Alice" },
        partyB: { id: "profile-b", email: "bob@example.com", fullName: "Bob" },
        need: { title: "Test Need" },
      });

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Bob Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.status).toBe("active");
    expect(mockTx.need.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "active" } })
    );
    expect(mockSendContractSignedEmail).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    mockTx.contract.update.mockResolvedValue(makeContract({ partyASignedAt: new Date() }));
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        partyASignedAt: new Date(),
        partyBSignedAt: null,
        status: "pending_terms",
      })
      .mockResolvedValueOnce(makeContract({ partyASignedAt: new Date() }));

    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/contract-1/sign", {
        method: "POST",
        body: JSON.stringify({ signature: "Alice Smith" }),
      }),
      { params: { id: "contract-1" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
