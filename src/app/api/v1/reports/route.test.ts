import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    report: { upsert: (...args: unknown[]) => mockUpsert(...args) },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Participation gate mock ───
const mockParticipation = vi.fn();

vi.mock("@/lib/participation", () => ({
  requireVerifiedParticipation: (...args: unknown[]) => mockParticipation(...args),
}));

// ─── Rate limit mocks ───
const mockRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const NEED_ID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";

function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

const validBody = {
  targetType: "need",
  targetId: NEED_ID,
  reason: "scam",
  details: " asked for money up front ",
};

describe("POST /api/v1/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockParticipation.mockResolvedValue({ ok: true, profileId: PROFILE_ID });
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 });
    mockUpsert.mockResolvedValue({ id: "report-1", status: "open" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 403 when the participation gate rejects", async () => {
    const { NextResponse } = await import("next/server");
    mockParticipation.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "suspended", code: "ACCOUNT_SUSPENDED" },
        { status: 403 }
      ),
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid body", async () => {
    const res = await POST(
      makeRequest({ targetType: "need", targetId: "not-a-uuid", reason: "scam" })
    );
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 400 when reporting yourself", async () => {
    const res = await POST(
      makeRequest({ targetType: "profile", targetId: PROFILE_ID, reason: "abuse" })
    );
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("creates a report with sanitized details", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.report).toEqual({ id: "report-1", status: "open" });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          reporterId_targetType_targetId: {
            reporterId: PROFILE_ID,
            targetType: "need",
            targetId: NEED_ID,
          },
        },
        create: expect.objectContaining({
          reporterId: PROFILE_ID,
          reason: "scam",
          details: "asked for money up front",
        }),
      })
    );
  });

  it("upserts so a repeat report re-opens with updated reason/details", async () => {
    await POST(makeRequest(validBody));
    const call = mockUpsert.mock.calls[0][0];
    expect(call.update).toEqual(expect.objectContaining({ reason: "scam", status: "open" }));
  });
});
