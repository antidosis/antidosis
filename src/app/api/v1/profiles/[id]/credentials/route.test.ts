import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockCredentialFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    credential: {
      findMany: (...args: unknown[]) => mockCredentialFindMany(...args),
    },
  },
}));

// ─── Redaction mock ───
const mockRedactCredential = vi.fn((c: any) => c);
vi.mock("@/lib/redaction", () => ({
  redactCredential: (c: any) => mockRedactCredential(c),
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

describe("GET /api/v1/profiles/[id]/credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when profile not found", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/profiles/p1/credentials"), {
      params: { id: "p1" },
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Profile not found");
  });

  it("returns empty credentials when none exist", async () => {
    mockProfileFindUnique.mockResolvedValue({ id: "p1" });
    mockCredentialFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/profiles/p1/credentials"), {
      params: { id: "p1" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.credentials).toEqual([]);
  });

  it("returns public credentials redacted", async () => {
    mockProfileFindUnique.mockResolvedValue({ id: "p1" });
    mockCredentialFindMany.mockResolvedValue([
      { id: "c1", type: "degree", title: "BSc", documentNumber: "123456", isPublic: true },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/profiles/p1/credentials"), {
      params: { id: "p1" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.credentials).toHaveLength(1);
    expect(mockCredentialFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { profileId: "p1", isPublic: true } })
    );
  });
});
