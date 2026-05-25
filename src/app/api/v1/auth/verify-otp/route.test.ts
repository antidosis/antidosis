import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdateCode = vi.fn();
const mockUpdateProfile = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockUpdateProfile(...args),
    },
    mobileVerificationCode: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdateCode(...args),
    },
    $transaction: (args: any) => mockTransaction(args),
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

// ─── Helpers ───
function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

describe("POST /api/v1/auth/verify-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockResolvedValue([]);
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: "+61400123456",
      mobileVerified: false,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded. Try again later.");
  });

  it("returns 400 when mobile or code is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const resNoMobile = await POST(makeRequest({ code: "123456" }));
    expect(resNoMobile.status).toBe(400);
    const bodyNoMobile = await resNoMobile.json();
    expect(bodyNoMobile.error).toBe("Mobile number and code are required");

    const resNoCode = await POST(makeRequest({ mobile: "0400123456" }));
    expect(resNoCode.status).toBe(400);
    const bodyNoCode = await resNoCode.json();
    expect(bodyNoCode.error).toBe("Mobile number and code are required");
  });

  it("returns 400 for invalid mobile format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeRequest({ mobile: "12345", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid mobile number format");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 403 when mobile does not match profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: "+61400987654",
      mobileVerified: false,
    });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Mobile number does not match your profile");
  });

  it("returns 409 when mobile already verified", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: "+61400123456",
      mobileVerified: true,
    });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("Mobile number already verified");
  });

  it("returns 404 when no active verification code found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("No active verification code found");
  });

  it("returns 410 when code has expired", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFindFirst.mockResolvedValue({
      id: "code-1",
      code: "123456",
      expiresAt: new Date(Date.now() - 60_000),
      used: false,
    });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.error).toBe("Code has expired. Please request a new one.");
  });

  it("returns 400 when code does not match", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFindFirst.mockResolvedValue({
      id: "code-1",
      code: "999999",
      expiresAt: new Date(Date.now() + 5 * 60_000),
      used: false,
    });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid verification code");
  });

  it("returns 200 and marks code used and profile verified on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFindFirst.mockResolvedValue({
      id: "code-1",
      code: "123456",
      expiresAt: new Date(Date.now() + 5 * 60_000),
      used: false,
    });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdateCode).toHaveBeenCalledWith({
      where: { id: "code-1" },
      data: { used: true },
    });
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { mobileVerified: true },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFindFirst.mockResolvedValue({
      id: "code-1",
      code: "123456",
      expiresAt: new Date(Date.now() + 5 * 60_000),
      used: false,
    });

    const res = await POST(makeRequest({ mobile: "0400123456", code: "123456" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
