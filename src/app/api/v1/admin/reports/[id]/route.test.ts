import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./route";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockProfileUpdate = vi.fn();
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    report: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    profile: {
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const ctx = { params: { id: "report-1" } };

function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/admin/reports/report-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

describe("PATCH /api/v1/admin/reports/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ authorized: true, user: { id: "admin-1" } });
    mockFindUnique.mockResolvedValue({
      id: "report-1",
      status: "open",
      reporterId: "reporter-1",
    });
    mockUpdate.mockResolvedValue({ id: "report-1", status: "resolved" });
  });

  it("returns the admin's response when not authorized", async () => {
    const { NextResponse } = await import("next/server");
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await PATCH(makeRequest({ status: "resolved" }), ctx);
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid status", async () => {
    const res = await PATCH(makeRequest({ status: "open" }), ctx);
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the report does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ status: "resolved" }), ctx);
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates the status", async () => {
    const res = await PATCH(makeRequest({ status: "resolved" }), ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.report.status).toBe("resolved");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { status: "resolved" },
    });
  });

  it("rewards the reporter when an open report is resolved", async () => {
    const res = await PATCH(makeRequest({ status: "resolved" }), ctx);
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "reporter-1" },
      data: { reporterScore: { increment: 1 }, goodReports: { increment: 1 } },
    });
  });

  it("penalises the reporter when an open report is dismissed", async () => {
    mockUpdate.mockResolvedValue({ id: "report-1", status: "dismissed" });

    const res = await PATCH(makeRequest({ status: "dismissed" }), ctx);
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "reporter-1" },
      data: { reporterScore: { decrement: 2 }, badReports: { increment: 1 } },
    });
  });

  it("does not double-count when an already-handled report is updated again", async () => {
    mockFindUnique.mockResolvedValue({
      id: "report-1",
      status: "resolved",
      reporterId: "reporter-1",
    });

    const res = await PATCH(makeRequest({ status: "dismissed" }), ctx);
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });
});
