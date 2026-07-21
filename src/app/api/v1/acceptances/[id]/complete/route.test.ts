import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockAcceptanceFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockAcceptanceUpdate = vi.fn();
const mockNeedUpdate = vi.fn();
const mockProfileUpdate = vi.fn();
const mockAcceptanceFindUniqueTx = vi.fn();

const mockTx = {
  acceptance: {
    update: (...args: unknown[]) => mockAcceptanceUpdate(...args),
    findUnique: (...args: unknown[]) => mockAcceptanceFindUniqueTx(...args),
  },
  need: {
    update: (...args: unknown[]) => mockNeedUpdate(...args),
  },
  profile: {
    update: (...args: unknown[]) => mockProfileUpdate(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    acceptance: {
      findUnique: (...args: unknown[]) => mockAcceptanceFindUnique(...args),
    },
    $transaction: (cb: any) => mockTransaction(cb),
    need: {
      findUnique: vi.fn(),
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

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
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

function makeAcceptance(overrides?: Record<string, unknown>) {
  return {
    id: "acc-1",
    needId: "need-1",
    userId: "profile-b",
    status: "accepted",
    posterMarkedComplete: false,
    fulfillerMarkedComplete: false,
    need: {
      posterId: "profile-a",
      requiresContract: false,
      title: "Test Need",
    },
    ...overrides,
  };
}

describe("POST /api/v1/acceptances/[id]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTx));
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Profile not found");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Rate limit exceeded");
  });

  it("returns 404 when acceptance not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Acceptance not found");
  });

  it("returns 403 when user is not poster or fulfiller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-other" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance());

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  it("returns 400 when need requires contract", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(
      makeAcceptance({ need: { posterId: "profile-a", requiresContract: true } })
    );

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("requires a contract");
  });

  it("returns 400 when acceptance is not in accepted status", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance({ status: "pending" }));

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("must be in 'accepted' status");
  });

  it("returns 400 when poster already marked complete", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance({ posterMarkedComplete: true }));

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already marked complete");
  });

  it("returns 400 when fulfiller already marked complete", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-b" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance({ fulfillerMarkedComplete: true }));

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already marked complete");
  });

  it("returns 200 when poster marks complete but not both", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance());
    mockAcceptanceUpdate.mockResolvedValue({});
    mockAcceptanceFindUniqueTx
      .mockResolvedValueOnce({
        posterMarkedComplete: true,
        fulfillerMarkedComplete: false,
        needId: "need-1",
        userId: "profile-b",
      })
      .mockResolvedValueOnce({ id: "acc-1", status: "accepted" });

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bothComplete).toBe(false);
  });

  it("returns 200 and completes when both mark complete", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance());
    mockAcceptanceUpdate
      .mockResolvedValueOnce({}) // first update (field)
      .mockResolvedValueOnce({ id: "acc-1", status: "completed" }); // second update (status)
    mockAcceptanceFindUniqueTx
      .mockResolvedValueOnce({
        posterMarkedComplete: true,
        fulfillerMarkedComplete: true,
        needId: "need-1",
        userId: "profile-b",
      })
      .mockResolvedValueOnce({ id: "acc-1", status: "completed" });
    mockNeedUpdate.mockResolvedValue({});
    mockProfileUpdate.mockResolvedValue({});

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bothComplete).toBe(true);
    expect(mockNeedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "completed" } })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-a" });
    mockAcceptanceFindUnique.mockResolvedValue(makeAcceptance());
    mockAcceptanceUpdate.mockResolvedValue({});
    mockAcceptanceFindUniqueTx
      .mockResolvedValueOnce({
        posterMarkedComplete: true,
        fulfillerMarkedComplete: false,
        needId: "need-1",
        userId: "profile-b",
      })
      .mockResolvedValueOnce({ id: "acc-1", status: "accepted" });

    const res = await POST(makeRequest("http://localhost/api/v1/acceptances/acc-1/complete"), {
      params: { id: "acc-1" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
