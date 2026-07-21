import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockAcceptanceFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    acceptance: {
      findMany: (...args: unknown[]) => mockAcceptanceFindMany(...args),
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

describe("GET /api/v1/acceptances/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await GET(makeRequest("http://localhost/api/v1/acceptances/mine"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns empty array when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/acceptances/mine"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("returns acceptances for current user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockAcceptanceFindMany.mockResolvedValue([
      { id: "acc-1", status: "pending", message: "Hello", need: { id: "n1", title: "Need" } },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/acceptances/mine"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("acc-1");
    expect(mockAcceptanceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "prof-1" } })
    );
  });
});
