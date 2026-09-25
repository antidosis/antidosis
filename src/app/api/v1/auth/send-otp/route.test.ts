import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileFindFirst = vi.fn();
const mockDeleteMany = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      findFirst: (...args: unknown[]) => mockProfileFindFirst(...args),
    },
    mobileVerificationCode: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
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

// ─── Bans mock ───
const mockIsMobileBanned = vi.fn();

vi.mock("@/lib/bans", () => ({
  isMobileBanned: (...args: unknown[]) => mockIsMobileBanned(...args),
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

// ─── Twilio mock ───
const mockVerificationsCreate = vi.fn();

vi.mock("twilio", () => ({
  default: () => ({
    verify: {
      v2: {
        services: () => ({
          verifications: { create: (...args: unknown[]) => mockVerificationsCreate(...args) },
        }),
      },
    },
  }),
}));

// ─── Helpers ───
function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/auth/send-otp", {
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

describe("POST /api/v1/auth/send-otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (cb: any) => {
      const tx = {
        mobileVerificationCode: {
          deleteMany: mockDeleteMany,
          create: mockCreate,
        },
      };
      return cb(tx);
    });
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: "+61400123456",
      mobileVerified: false,
    });
    mockProfileFindFirst.mockResolvedValue(null);
    mockIsMobileBanned.mockResolvedValue(false);
    // Ensure Twilio is not configured by default
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Authentication required");
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate limit exceeded. Try again later.");
  });

  it("returns 400 when mobile is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Mobile number is required");
  });

  it("returns 400 for invalid mobile format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeRequest({ mobile: "12345" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid mobile number format");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ mobile: "0400123456" }));
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

    const res = await POST(makeRequest({ mobile: "0400123456" }));
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

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("Mobile number already verified");
  });

  it("returns 200 and sends via Twilio Verify when configured", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    process.env.TWILIO_ACCOUNT_SID = "test-sid";
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VA-test-service";
    mockVerificationsCreate.mockResolvedValue({ sid: "VE-1", status: "pending" });

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockVerificationsCreate).toHaveBeenCalledWith({
      to: "+61400123456",
      channel: "sms",
    });
    // Verify owns the code — nothing is stored locally
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it("returns 200 and logs to console in dev fallback when Twilio not configured", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[DEV OTP]"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("+61400123456"));
    // Dev fallback stores a hashed code locally (verify-otp compares hashes)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mobile: "+61400123456",
          code: expect.stringMatching(/^[0-9a-f]{64}$/),
          profileId: "profile-1",
          expiresAt: expect.any(Date),
        }),
      })
    );

    consoleSpy.mockRestore();
  });

  it("returns 502 when Twilio fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    process.env.TWILIO_ACCOUNT_SID = "test-sid";
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VA-test-service";
    mockVerificationsCreate.mockRejectedValue(new Error("Twilio error"));

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("SMS delivery failed: Twilio error");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await POST(makeRequest({ mobile: "0400123456" }));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });

  it("returns 403 MOBILE_BANNED when the number is banned on any account", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindFirst.mockResolvedValue({ id: "banned-profile-9" });

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("MOBILE_BANNED");
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockProfileFindFirst).toHaveBeenCalledWith({
      where: { mobile: "+61400123456", bannedAt: { not: null } },
      select: { id: true },
    });
  });

  it("returns 403 MOBILE_BANNED when the number is in BannedMobile with no matching profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    // No banned profile holds the mobile (e.g. the banned account self-deleted)
    mockProfileFindFirst.mockResolvedValue(null);
    mockIsMobileBanned.mockResolvedValue(true);

    const res = await POST(makeRequest({ mobile: "0400123456" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("MOBILE_BANNED");
    expect(mockIsMobileBanned).toHaveBeenCalledWith("+61400123456");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("fails closed with 503 in production when Twilio is not configured", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = await POST(makeRequest({ mobile: "0400123456" }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toBe("SMS service unavailable");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
