import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockContractFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    contract: {
      findMany: (...args: unknown[]) => mockContractFindMany(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

function makeAuthUser(
  overrides?: Partial<{ id: string; email: string; email_confirmed_at: string | null }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("GET /api/v1/contracts/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await GET(makeRequest("http://localhost/api/v1/contracts/mine"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns empty array when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/contracts/mine"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("returns contracts for current user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockContractFindMany.mockResolvedValue([
      {
        id: "c1",
        status: "draft",
        need: { title: "Need" },
        partyA: { id: "prof-1", fullName: "A" },
        partyB: { id: "prof-2", fullName: "B" },
      },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/contracts/mine"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("c1");
    expect(mockContractFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ partyAId: "prof-1" }, { partyBId: "prof-1" }] },
      })
    );
  });
});
