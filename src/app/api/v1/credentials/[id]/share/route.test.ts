import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockCredentialFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    credential: {
      findFirst: (...args: unknown[]) => mockCredentialFindFirst(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

// ─── Redaction mock ───
vi.mock("@/lib/redaction", () => ({
  formatCredentialForMessage: () => "📋 Shared credential: Test",
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

describe("POST /api/v1/credentials/[id]/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials/c1/share", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials/c1/share", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns 404 when credential not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockCredentialFindFirst.mockResolvedValue(null);
    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials/c1/share", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Credential not found");
  });

  it("returns 200 with share text", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "prof-1" });
    mockCredentialFindFirst.mockResolvedValue({ id: "c1", title: "Test" });
    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials/c1/share", { method: "POST" }),
      { params: { id: "c1" } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.shareText).toBe("📋 Shared credential: Test");
  });
});
