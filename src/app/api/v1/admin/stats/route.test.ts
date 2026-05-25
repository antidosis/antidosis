import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Admin mock ───
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// ─── Prisma mocks ───
const mockProfileCount = vi.fn();
const mockNeedCount = vi.fn();
const mockContractCount = vi.fn();
const mockCredentialCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      count: (...args: unknown[]) => mockProfileCount(...args),
    },
    need: {
      count: (...args: unknown[]) => mockNeedCount(...args),
    },
    contract: {
      count: (...args: unknown[]) => mockContractCount(...args),
    },
    credential: {
      count: (...args: unknown[]) => mockCredentialCount(...args),
    },
  },
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

function makeRequest(url: string): NextRequest {
  return new Request(url, { method: "GET" }) as NextRequest;
}

describe("GET /api/v1/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when requireAdmin returns unauthorized", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/stats"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockProfileCount).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not an admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/stats"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mockProfileCount).not.toHaveBeenCalled();
  });

  it("returns aggregate stats on success", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });

    mockProfileCount.mockResolvedValueOnce(100).mockResolvedValueOnce(10);
    mockNeedCount.mockResolvedValueOnce(50).mockResolvedValueOnce(5);
    mockContractCount.mockResolvedValueOnce(30).mockResolvedValueOnce(7).mockResolvedValueOnce(2);
    mockCredentialCount.mockResolvedValueOnce(80).mockResolvedValueOnce(20);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/stats"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      totalUsers: 100,
      totalNeeds: 50,
      totalContracts: 30,
      totalCredentials: 80,
      pendingVerifications: 20,
      totalPros: 10,
      recentNeeds: 5,
      recentContracts: 7,
      pendingContractCancellations: 2,
    });

    expect(mockProfileCount).toHaveBeenCalledTimes(2);
    expect(mockProfileCount).toHaveBeenNthCalledWith(1);
    expect(mockProfileCount).toHaveBeenNthCalledWith(2, { where: { isPro: true } });

    expect(mockNeedCount).toHaveBeenCalledTimes(2);
    expect(mockNeedCount).toHaveBeenNthCalledWith(1);
    expect(mockNeedCount).toHaveBeenNthCalledWith(2, {
      where: { createdAt: { gte: expect.any(Date) } },
    });

    expect(mockContractCount).toHaveBeenCalledTimes(3);
    expect(mockContractCount).toHaveBeenNthCalledWith(1);
    expect(mockContractCount).toHaveBeenNthCalledWith(2, {
      where: { createdAt: { gte: expect.any(Date) } },
    });
    expect(mockContractCount).toHaveBeenNthCalledWith(3, {
      where: {
        OR: [
          { cancelEscalatedAt: { not: null } },
          {
            cancelRequestedAt: { not: null },
            cancelResponse: null,
          },
        ],
      },
    });

    expect(mockCredentialCount).toHaveBeenCalledTimes(2);
    expect(mockCredentialCount).toHaveBeenNthCalledWith(1);
    expect(mockCredentialCount).toHaveBeenNthCalledWith(2, { where: { isVerified: false } });
  });

  it("includes x-request-id header", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });

    mockProfileCount.mockResolvedValue(0);
    mockNeedCount.mockResolvedValue(0);
    mockContractCount.mockResolvedValue(0);
    mockCredentialCount.mockResolvedValue(0);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/stats"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
