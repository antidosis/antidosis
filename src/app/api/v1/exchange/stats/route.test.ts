import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockNeedCount = vi.fn();
const mockContractCount = vi.fn();
const mockProfileCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: { count: (...a: unknown[]) => mockNeedCount(...a) },
    contract: { count: (...a: unknown[]) => mockContractCount(...a) },
    profile: { count: (...a: unknown[]) => mockProfileCount(...a) },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("GET /api/v1/exchange/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the three heartbeat counters", async () => {
    mockNeedCount.mockResolvedValue(12);
    mockContractCount.mockResolvedValue(5);
    mockProfileCount.mockResolvedValue(3);

    const res = await GET(new Request("http://localhost/api/v1/exchange/stats") as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ openNeeds: 12, contractsThisWeek: 5, nodesOnAir: 3 });

    expect(mockNeedCount).toHaveBeenCalledWith({ where: { status: "open" } });
    expect(mockContractCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ["active", "completed"] } }),
      })
    );
    expect(mockProfileCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ bannedAt: null }) })
    );
  });

  it("sets a public cache header", async () => {
    mockNeedCount.mockResolvedValue(0);
    mockContractCount.mockResolvedValue(0);
    mockProfileCount.mockResolvedValue(0);
    const res = await GET(new Request("http://localhost/api/v1/exchange/stats") as never);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
  });
});
