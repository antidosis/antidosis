import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockFindMany = vi.fn();
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    report: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(query = ""): NextRequest {
  return new Request(`http://localhost/api/v1/admin/reports${query}`) as NextRequest;
}

describe("GET /api/v1/admin/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the admin's response when not authorized", async () => {
    const { NextResponse } = await import("next/server");
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("lists open reports by default with reporter info", async () => {
    mockRequireAdmin.mockResolvedValue({ authorized: true, user: { id: "admin-1" } });
    mockFindMany.mockResolvedValue([{ id: "report-1", status: "open" }]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.reports).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "open" },
        include: { reporter: { select: { id: true, fullName: true, email: true } } },
      })
    );
  });

  it("honours the status filter", async () => {
    mockRequireAdmin.mockResolvedValue({ authorized: true, user: { id: "admin-1" } });
    mockFindMany.mockResolvedValue([]);

    await GET(makeRequest("?status=all"));
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
