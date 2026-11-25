import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockProfileFindUnique = vi.fn();
const mockReportFindMany = vi.fn();
const mockNeedFindMany = vi.fn();
const mockProfileFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
    },
    report: {
      findMany: (...args: unknown[]) => mockReportFindMany(...args),
    },
    need: {
      findMany: (...args: unknown[]) => mockNeedFindMany(...args),
    },
  },
}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

describe("GET /api/v1/reports/mine", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await GET(makeRequest("http://localhost/api/v1/reports/mine"));
    expect(res.status).toBe(401);
  });

  it("returns only the member's own reports with enriched target labels", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockReportFindMany.mockResolvedValue([
      {
        id: "report-1",
        targetType: "need",
        targetId: "need-1",
        reason: "scam",
        details: "Asking for upfront payment",
        status: "open",
        createdAt: new Date("2026-11-20"),
        updatedAt: new Date("2026-11-20"),
      },
      {
        id: "report-2",
        targetType: "profile",
        targetId: "profile-9",
        reason: "abuse",
        details: null,
        status: "resolved",
        createdAt: new Date("2026-11-18"),
        updatedAt: new Date("2026-11-19"),
      },
    ]);
    mockNeedFindMany.mockResolvedValue([{ id: "need-1", title: "Suspicious moving job" }]);
    mockProfileFindMany.mockResolvedValue([
      { id: "profile-9", fullName: null, handle: "bad_actor" },
    ]);

    const res = await GET(makeRequest("http://localhost/api/v1/reports/mine"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockReportFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reporterId: "profile-1" } })
    );
    expect(body.reports).toHaveLength(2);
    expect(body.reports[0].targetLabel).toBe("Suspicious moving job");
    expect(body.reports[1].targetLabel).toBe("bad_actor");
  });

  it("labels deleted targets gracefully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    mockReportFindMany.mockResolvedValue([
      {
        id: "report-3",
        targetType: "need",
        targetId: "gone-need",
        reason: "spam",
        details: null,
        status: "dismissed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockNeedFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/reports/mine"));
    const body = await res.json();
    expect(body.reports[0].targetLabel).toBe("Deleted need");
  });
});
