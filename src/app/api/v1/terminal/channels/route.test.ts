import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockTerminalChannelFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    terminalChannel: { findMany: (...args: unknown[]) => mockTerminalChannelFindMany(...args) },
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

function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/v1/terminal/channels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/channels"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("excludes staff channels for non-admin users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(false);
    mockTerminalChannelFindMany.mockResolvedValue([
      {
        id: "ch-1",
        name: "general",
        slug: "general",
        description: "General chat",
        type: "public",
        order: 1,
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/channels"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.channels).toHaveLength(1);
    expect(mockTerminalChannelFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: { not: "staff" } },
      })
    );
  });

  it("includes staff channels for admin users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "admin@example.com" }) },
      error: null,
    });
    mockIsAdminEmail.mockReturnValue(true);
    mockTerminalChannelFindMany.mockResolvedValue([
      {
        id: "ch-1",
        name: "general",
        slug: "general",
        description: "General chat",
        type: "public",
        order: 1,
      },
      {
        id: "ch-2",
        name: "staff",
        slug: "staff",
        description: "Staff chat",
        type: "staff",
        order: 2,
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/channels"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.channels).toHaveLength(2);
    expect(mockTerminalChannelFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(false);
    mockTerminalChannelFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/terminal/channels"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
