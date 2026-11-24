import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockGetUser = vi.fn();
const mockNeedFindUnique = vi.fn();
const mockResolveEntityId = vi.fn();
const mockRateLimit = vi.fn();
const mockAuditLog = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));
vi.mock("@/lib/participation", () => ({
  requireVerifiedParticipation: vi.fn(async () => ({ ok: true, profileId: "viewer-1" })),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { need: { findUnique: (...args: unknown[]) => mockNeedFindUnique(...args) } },
}));
vi.mock("@/lib/resolve-id", () => ({
  resolveEntityId: (...args: unknown[]) => mockResolveEntityId(...args),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "user:u1",
}));
vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

function call() {
  return POST(
    new Request("http://localhost", { method: "POST" }) as NextRequest,
    {
      params: { id: "need-1" },
    } as never
  );
}

describe("POST /api/v1/needs/[id]/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@example.com" } } });
    mockResolveEntityId.mockResolvedValue("need-1");
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockNeedFindUnique.mockResolvedValue({
      id: "need-1",
      status: "open",
      urgency: 9,
      allowUrgentContact: true,
      poster: { mobile: "+61400000000", mobileVerified: true, bannedAt: null },
    });
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await call();
    expect(response.status).toBe(401);
    expect(mockNeedFindUnique).not.toHaveBeenCalled();
  });

  it("reveals only an opted-in, verified mobile for an urgent open need", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ phone: "+61400000000" });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockAuditLog).toHaveBeenCalledOnce();
  });

  it.each([
    { status: "archived" },
    { urgency: 6 },
    { allowUrgentContact: false },
    { poster: { mobile: "+61400000000", mobileVerified: false, bannedAt: null } },
    { poster: { mobile: null, mobileVerified: true, bannedAt: null } },
    { poster: { mobile: "+61400000000", mobileVerified: true, bannedAt: new Date() } },
  ])("withholds contact when guardrails fail: %j", async (override) => {
    mockNeedFindUnique.mockResolvedValue({
      id: "need-1",
      status: "open",
      urgency: 9,
      allowUrgentContact: true,
      poster: { mobile: "+61400000000", mobileVerified: true, bannedAt: null },
      ...override,
    });
    const response = await call();
    expect(response.status).toBe(404);
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it("rate-limits repeated reveals", async () => {
    mockRateLimit
      .mockResolvedValueOnce({ allowed: false })
      .mockResolvedValueOnce({ allowed: true });
    const response = await call();
    expect(response.status).toBe(429);
    expect(mockNeedFindUnique).not.toHaveBeenCalled();
  });
});
