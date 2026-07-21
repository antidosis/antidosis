import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockCredentialFindFirst = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
    credential: {
      findFirst: (...args: unknown[]) => mockCredentialFindFirst(...args),
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

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

// ─── CORS mock ───
vi.mock("@/lib/security/cors", () => ({
  withCors: (handler: any) => handler,
}));

// ─── Helpers ───
function makeRequest(): NextRequest {
  return new Request("http://localhost/api/v1/pro/claim", { method: "POST" }) as NextRequest;
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

describe("POST /api/v1/pro/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toContain("Rate limit exceeded");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 403 when identity not verified", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", isVerified: false });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("IDENTITY_NOT_VERIFIED");
  });

  it("returns 403 when ID credential missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", isVerified: true });
    mockCredentialFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("ID_CREDENTIAL_MISSING");
  });

  it("returns 403 when mobile not verified", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      isVerified: true,
      mobileVerified: false,
    });
    mockCredentialFindFirst.mockResolvedValue({ id: "cred-1" });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("MOBILE_NOT_VERIFIED");
  });

  it("returns 200 on successful claim", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      isVerified: true,
      mobileVerified: true,
    });
    mockCredentialFindFirst.mockResolvedValue({ id: "cred-1" });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", isPro: true });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPro: true }),
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      isVerified: true,
      mobileVerified: true,
    });
    mockCredentialFindFirst.mockResolvedValue({ id: "cred-1" });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", isPro: true });

    const res = await POST(makeRequest());

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
