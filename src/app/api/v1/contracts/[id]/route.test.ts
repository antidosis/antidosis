import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, PATCH } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindUnique = vi.fn();
const mockContractUpdate = vi.fn();
const mockNeedUpdate = vi.fn();
const mockAcceptanceUpdateMany = vi.fn();
const mockQueryRaw = vi.fn();
const mockTransaction = vi.fn();

const mockTx = {
  contract: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  need: {
    update: vi.fn(),
  },
  acceptance: {
    updateMany: vi.fn(),
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
    need: {
      update: (...args: unknown[]) => mockNeedUpdate(...args),
    },
    acceptance: {
      updateMany: (...args: unknown[]) => mockAcceptanceUpdateMany(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
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

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── PDF contract mock ───
const mockGenerateContractPdf = vi.fn();

vi.mock("@/lib/pdf-contract", () => ({
  generateContractPdf: (...args: unknown[]) => mockGenerateContractPdf(...args),
}));

// ─── Supabase service mock ───
const mockUpload = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: () => ({ data: { publicUrl: "https://example.com/contracts/test.pdf" } }),
      }),
    },
  }),
}));

// ─── Helpers ───
function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
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
    id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    partyAId: "profile-a",
    partyBId: "profile-b",
    status: "draft",
    termsLockedAt: null,
    partyASubmittedAt: null,
    partyBSubmittedAt: null,
    partyAAgreedAt: null,
    partyBAgreedAt: null,
    partyASignedAt: null,
    partyBSignedAt: null,
    pdfUrl: null,
    acceptanceId: "acc-1",
    needId: "need-1",
    terms: "{}",
    updatedAt: new Date("2024-01-15T00:00:00Z"),
    negotiationMessages: [],
    partyATerms: null,
    partyBTerms: null,
    deadlineTerms: null,
    completionMethodTerms: null,
    additionalTerms: null,
    partyAUseMessageTerms: false,
    partyBUseMessageTerms: false,
    need: {
      title: "Test Need",
      description: "Description",
      deadline: null,
      timeRange: null,
      locationName: null,
      offerType: "service",
      offerDescription: "Offer desc",
      offerValue: null,
    },
    partyA: {
      fullName: "Alice",
      email: "alice@example.com",
      locationName: null,
      isVerified: true,
    },
    partyB: {
      fullName: "Bob",
      email: "bob@example.com",
      locationName: null,
      isVerified: true,
    },
    ...overrides,
  };
}

describe("GET /api/v1/contracts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
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

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Contract not found");
  });

  it("returns 403 when user is not a party to the contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-other" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with contract for party A", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBeDefined();
    expect(body.contract.id).toBe("c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
  });

  it("returns 200 with contract for party B", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract.id).toBe("c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
  });

  it("respects messagesLimit and messagesSkip query params", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    await GET(
      makeRequest("http://localhost/api/v1/contracts/contract-1?messagesLimit=10&messagesSkip=5"),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    const call = mockContractFindUnique.mock.calls[0][0];
    expect(call.include.messages.take).toBe(10);
    expect(call.include.messages.skip).toBe(5);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await GET(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("PATCH /api/v1/contracts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await PATCH(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await PATCH(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(403);
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await PATCH(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(404);
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await PATCH(makeRequest("http://localhost/api/v1/contracts/contract-1"), {
      params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
    });

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: "new terms" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not a party to the contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-other" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: "new terms" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(403);
  });

  it("returns 400 when contract cannot be edited at this stage", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ status: "active" }));

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: "new terms" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Contract cannot be edited at this stage");
  });

  it("returns 400 for invalid input", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: 123 }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("updates terms and resets submission state", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    mockContractUpdate.mockResolvedValue(makeContract({ terms: "new terms" }));

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: "new terms" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBeDefined();

    const updateCall = mockContractUpdate.mock.calls[0][0];
    expect(updateCall.data.terms).toBe("new terms");
    expect(updateCall.data.partyASubmittedAt).toBeNull();
    expect(updateCall.data.partyAAgreedAt).toBeNull();
    expect(updateCall.data.status).toBe("draft");
  });

  it("returns 400 when terms are locked and trying to update terms", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ termsLockedAt: new Date() }));

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: "new terms" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Terms are locked. Unlock them to make changes.");
  });

  it("submits terms for party A", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    mockContractUpdate.mockResolvedValue(makeContract({ partyASubmittedAt: new Date() }));

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ submitTerms: true }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(200);
    const updateCall = mockContractUpdate.mock.calls[0][0];
    expect(updateCall.data.partyASubmittedAt).toBeInstanceOf(Date);
  });

  it("returns 400 when submitting terms but already locked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract({ termsLockedAt: new Date() }));

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ submitTerms: true }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Terms are already locked");
  });

  it("agrees to terms as first party", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ partyASubmittedAt: new Date(), partyBSubmittedAt: new Date() })
    );

    mockTx.contract.update.mockResolvedValue(makeContract());
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        partyAAgreedAt: new Date(),
        partyBAgreedAt: null,
        termsLockedAt: null,
        needId: "need-1",
      })
      .mockResolvedValueOnce(makeContract({ partyAAgreedAt: new Date() }));

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ agree: true }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(200);
    expect(mockTx.contract.update).toHaveBeenCalled();
  });

  it("returns 409 when terms changed since client loaded", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({
        partyASubmittedAt: new Date(),
        partyBSubmittedAt: new Date(),
        updatedAt: new Date("2024-01-15T00:00:00Z"),
      })
    );

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ agree: true, updatedAt: "2024-01-14T00:00:00Z" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("TERMS_CHANGED");
  });

  it("returns 400 when not ready for review (missing submissions)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({ partyASubmittedAt: new Date(), partyBSubmittedAt: null })
    );

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ agree: true }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("NOT_READY_FOR_REVIEW");
  });

  it("locks terms when both parties agree and generates PDF", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({
        partyASubmittedAt: new Date(),
        partyBSubmittedAt: new Date(),
        terms: JSON.stringify({ startDate: "2024-02-01", deadline: "2024-03-01" }),
      })
    );

    mockTx.contract.update.mockResolvedValue(
      makeContract({ termsLockedAt: new Date(), status: "pending_terms" })
    );
    mockTx.contract.findUnique
      .mockResolvedValueOnce({
        partyAAgreedAt: new Date(),
        partyBAgreedAt: new Date(),
        termsLockedAt: null,
        needId: "need-1",
      })
      .mockResolvedValueOnce(makeContract({ termsLockedAt: new Date(), status: "pending_terms" }));

    mockTx.need.update.mockResolvedValue({});
    mockTx.acceptance.updateMany.mockResolvedValue({ count: 2 });

    mockGenerateContractPdf.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mockUpload.mockResolvedValue({ error: null });
    mockContractUpdate.mockResolvedValue(
      makeContract({ pdfUrl: "https://example.com/contracts/test.pdf" })
    );

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ agree: true }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(200);
    expect(mockTx.need.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "contracted" } })
    );
    expect(mockGenerateContractPdf).toHaveBeenCalled();
  });

  it("returns 400 when agreeing but terms already locked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(
      makeContract({
        partyASubmittedAt: new Date(),
        partyBSubmittedAt: new Date(),
        termsLockedAt: new Date(),
      })
    );

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ agree: true }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Terms are already locked");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    mockContractUpdate.mockResolvedValue(makeContract());

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/contracts/contract-1", {
        method: "PATCH",
        body: JSON.stringify({ terms: "new terms" }),
      }),
      { params: { id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
