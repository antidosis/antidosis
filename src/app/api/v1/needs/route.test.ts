import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockQueryRaw = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

describe("GET /api/v1/needs", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockQueryRaw.mockReset();
  });

  it("returns needs list with pagination", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "1", title: "Need plumber", poster: { fullName: "John" } },
    ]);
    mockCount.mockResolvedValueOnce(1);
    mockFindMany.mockResolvedValueOnce([{ offerType: "service" }]);
    mockFindMany.mockResolvedValueOnce([{ needCategory: "home" }]);
    mockQueryRaw.mockResolvedValueOnce([{ name: "plumbing" }]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.needs).toHaveLength(1);
    expect(body.needs[0].title).toBe("Need plumber");
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.availableFilters.offerTypes).toContain("service");
  });

  it("filters by search query", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?q=plumber"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.OR).toEqual([
      { title: { contains: "plumber", mode: "insensitive" } },
      { description: { contains: "plumber", mode: "insensitive" } },
    ]);
  });

  it("filters by offer type", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?type=service"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.offerType).toBe("service");
  });

  it("filters by location", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?location=Terrigal"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.locationName).toEqual({
      contains: "Terrigal",
      mode: "insensitive",
    });
  });

  it("filters by skill", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?skill=plumbing"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.requiredSkills).toEqual({
      some: { name: { contains: "plumbing", mode: "insensitive" } },
    });
  });

  it("limits page size to 50", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?limit=100"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.take).toBe(50);
  });

  it("sets cache headers", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs"));

    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  });

  it("includes x-request-id header", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
