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
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

// ─── PDF contract mock ───
const mockGenerateContractPdf = vi.fn();
vi.mock("@/lib/pdf-contract", () => ({
  generateContractPdf: (...args: unknown[]) => mockGenerateContractPdf(...args),
}));

// ─── Supabase service mock ───
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn(() => ({
  data: { publicUrl: "https://example.com/contracts/test.pdf" },
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: () => mockGetPublicUrl(),
      }),
    },
  }),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

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
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string | null }>
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
    partyAId: "prof-1",
    partyBId: "prof-2",
    termsLockedAt: new Date(),
    terms: "{}",
    negotiationMessages: [],
    partyASignedAt: null,
    partyBSignedAt: null,
    partyASignature: null,
    partyBSignature: null,
    partyATerms: null,
    partyBTerms: null,
    deadlineTerms: null,
    completionMethodTerms: null,
    additionalTerms: null,
    partyAUseMessageTerms: false,
    partyBUseMessageTerms: false,
    need: {
      title: "Test Need",
      description: "Desc",
      deadline: null,
      timeRange: null,
      locationName: null,
      offerType: "service",
      offerDescription: "Offer",
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

describe("POST /api/v1/contracts/[id]/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockGenerateContractPdf.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mockUpload.mockResolvedValue({ error: null });
    mockContractUpdate.mockResolvedValue({
      id: "contract-1",
      pdfUrl: "https://example.com/contracts/test.pdf",
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 403 when email not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: null }) },
      error: null,
    });
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when contract not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockContractFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Contract not found");
  });

  it("returns 403 when user is not a party", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-other" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 400 when terms not locked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockContractFindUnique.mockResolvedValue(makeContract({ termsLockedAt: null }));
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Terms must be agreed");
  });

  it("returns 500 when PDF upload fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    mockUpload.mockResolvedValue({ error: { message: "fail" } });
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to store PDF");
  });

  it("returns 200 with pdfUrl on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockContractFindUnique.mockResolvedValue(makeContract());
    const res = await POST(
      makeRequest("http://localhost/api/v1/contracts/c1/pdf", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pdfUrl).toBe("https://example.com/contracts/test.pdf");
    expect(mockContractUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pdfUrl: "https://example.com/contracts/test.pdf" } })
    );
  });
});
