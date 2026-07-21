import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
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

// ─── Notifications mock ───
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ─── Admin mock ───
const mockIsAdminEmail = vi.fn();
vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => mockIsAdminEmail(email),
}));

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/v1/terminal/admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { isAdmin: false } when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(false);
  });

  it("returns { isAdmin: true } for admin email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "admin@example.com" }) },
      error: null,
    });
    mockIsAdminEmail.mockReturnValue(true);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(true);
  });

  it("returns { isAdmin: false } for non-admin email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "user@example.com" }) },
      error: null,
    });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(false);
  });

  it("returns { isAdmin: false } when an error occurs", async () => {
    mockGetUser.mockRejectedValue(new Error("Unexpected error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(false);
  });
});
