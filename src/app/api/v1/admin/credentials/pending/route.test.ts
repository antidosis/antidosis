import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Admin mock ───
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// ─── Prisma mocks ───
const mockCredentialFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    credential: {
      findMany: (...args: unknown[]) => mockCredentialFindMany(...args),
    },
  },
}));

// ─── Storage mock ───
const mockCreateCredentialSignedUrls = vi.fn();

vi.mock("@/lib/storage", () => ({
  createCredentialSignedUrls: (...args: unknown[]) => mockCreateCredentialSignedUrls(...args),
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

function makeCredential(overrides?: Record<string, unknown>) {
  return {
    id: "cred-1",
    type: "license",
    subType: null,
    title: "Driver License",
    description: "A valid driver license",
    documentNumber: "DL123456",
    issuedBy: "DMV",
    issuedAt: new Date("2023-01-01"),
    expiresAt: new Date("2028-01-01"),
    isPublic: false,
    isVerified: false,
    createdAt: new Date("2024-01-01"),
    profile: {
      id: "profile-1",
      fullName: "Alice Smith",
      email: "alice@example.com",
      avatarUrl: null,
      mobile: "+1234567890",
    },
    ...overrides,
  };
}

describe("GET /api/v1/admin/credentials/pending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when requireAdmin returns unauthorized", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/credentials/pending"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCredentialFindMany).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not an admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/credentials/pending"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mockCredentialFindMany).not.toHaveBeenCalled();
  });

  it("returns pending credentials with signed URLs on success", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });

    const credentials = [makeCredential(), makeCredential({ id: "cred-2", title: "Passport" })];
    mockCredentialFindMany.mockResolvedValueOnce(credentials);
    mockCreateCredentialSignedUrls
      .mockResolvedValueOnce({
        signedUrl: "https://signed.url/1",
        signedBackUrl: "https://signed.url/back/1",
      })
      .mockResolvedValueOnce({ signedUrl: "https://signed.url/2", signedBackUrl: null });

    const res = await GET(makeRequest("http://localhost/api/v1/admin/credentials/pending"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credentials).toHaveLength(2);

    expect(mockCredentialFindMany).toHaveBeenCalledWith({
      where: { isVerified: false },
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            mobile: true,
          },
        },
      },
    });

    expect(mockCreateCredentialSignedUrls).toHaveBeenCalledTimes(2);
    expect(mockCreateCredentialSignedUrls).toHaveBeenNthCalledWith(1, credentials[0]);
    expect(mockCreateCredentialSignedUrls).toHaveBeenNthCalledWith(2, credentials[1]);

    expect(body.credentials[0]).toMatchObject({
      id: "cred-1",
      title: "Driver License",
      signedUrl: "https://signed.url/1",
      signedBackUrl: "https://signed.url/back/1",
      profile: {
        id: "profile-1",
        fullName: "Alice Smith",
      },
    });

    expect(body.credentials[1]).toMatchObject({
      id: "cred-2",
      title: "Passport",
      signedUrl: "https://signed.url/2",
      signedBackUrl: null,
    });
  });

  it("returns empty array when no pending credentials exist", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });

    mockCredentialFindMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/credentials/pending"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credentials).toEqual([]);
    expect(mockCreateCredentialSignedUrls).not.toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: { id: "admin-1", email: "admin@example.com" },
    });

    mockCredentialFindMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/admin/credentials/pending"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
