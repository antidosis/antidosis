import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockQueryRaw = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: (...args: unknown[]) => mockQueryRaw(...args) },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getSession: () => mockGetSession() },
  }),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset();
    mockGetSession.mockReset();
  });

  it("returns 200 when all checks pass", async () => {
    mockQueryRaw.mockResolvedValue([1]);
    mockGetSession.mockResolvedValue({ data: {}, error: null });

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.supabase.status).toBe("ok");
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("returns 503 when database fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("DB down"));
    mockGetSession.mockResolvedValue({ data: {}, error: null });

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.checks.database.status).toBe("error");
    expect(body.checks.database.message).toBe("DB down");
    expect(body.checks.supabase.status).toBe("ok");
  });

  it("returns 503 when supabase fails", async () => {
    mockQueryRaw.mockResolvedValue([1]);
    mockGetSession.mockResolvedValue({ data: {}, error: new Error("Auth error") });

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.supabase.status).toBe("error");
  });
});
