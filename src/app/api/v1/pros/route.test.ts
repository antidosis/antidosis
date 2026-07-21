import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
    },
  },
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(url: string): NextRequest {
  const req = new Request(url) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

describe("GET /api/v1/pros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with pros list", async () => {
    mockProfileFindMany.mockResolvedValue([
      { id: "p1", fullName: "Pro One", skills: [{ name: "React" }], credentials: [{ id: "c1" }] },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("p1");
    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPro: true, showInDirectory: true }),
        take: 100,
      })
    );
  });

  it("returns 200 with search query", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?q=react"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
  });

  it("sets cache-control header", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=120");
  });
});
