import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockAuditLogFindMany = vi.fn();
const mockProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => mockAuditLogFindMany(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
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

// ─── Admin mock ───
const mockIsAdminEmail = vi.fn();

vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => mockIsAdminEmail(email),
}));

// ─── Helpers ───
function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "admin@example.com",
    ...overrides,
  };
}

describe("GET /api/v1/admin/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLogFindMany.mockResolvedValue([]);
  });

  it("returns 403 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/audit"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 403 when not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "user@example.com" }) },
      error: null,
    });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/audit"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with logs", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockAuditLogFindMany.mockResolvedValue([
      {
        id: "log-1",
        event: "LOGIN_SUCCESS",
        userId: "user-1",
        email: "test@example.com",
        path: "/api/v1/auth",
        severity: "info",
        createdAt: new Date(),
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/audit"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].event).toBe("LOGIN_SUCCESS");
  });

  it("filters by userId", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockAuditLogFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/admin/audit?userId=user-1"));

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      })
    );
  });

  it("caps limit at 100", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockAuditLogFindMany.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/admin/audit?limit=200"));

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockIsAdminEmail.mockReturnValue(true);
    mockProfileFindUnique.mockResolvedValue({ id: "admin-1" });
    mockAuditLogFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/audit"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
