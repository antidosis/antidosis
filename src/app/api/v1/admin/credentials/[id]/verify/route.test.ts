import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Admin mock ───
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// ─── Prisma mocks ───
const mockCredentialUpdate = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    credential: {
      update: (...args: unknown[]) => mockCredentialUpdate(...args),
    },
    profile: {
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

// ─── Audit mocks ───
const mockAuditLog = vi.fn();
const mockGetClientInfo = vi.fn();

vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: (req: NextRequest) => mockGetClientInfo(req),
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

function makeRequest(url: string, method = "POST", body?: unknown): NextRequest {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  return new Request(url, init) as NextRequest;
}

function makeParams(id: string) {
  return { params: { id } };
}

const mockAdminUser = { id: "admin-1", email: "admin@example.com" };

function makeCredential(overrides?: Record<string, unknown>) {
  return {
    id: "cred-1",
    profileId: "profile-1",
    type: "license",
    title: "Driver License",
    isVerified: false,
    profile: {
      id: "profile-1",
      fullName: "Alice Smith",
      email: "alice@example.com",
      userId: "user-1",
    },
    ...overrides,
  };
}

describe("POST /api/v1/admin/credentials/[id]/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientInfo.mockReturnValue({ ip: "127.0.0.1", userAgent: "test-agent" });
  });

  it("returns 401 when requireAdmin returns unauthorized", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/verify"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCredentialUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not an admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/verify"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mockCredentialUpdate).not.toHaveBeenCalled();
  });

  it("verifies a credential and marks profile as verified", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    const updatedCredential = makeCredential({ isVerified: true });
    mockCredentialUpdate.mockResolvedValueOnce(updatedCredential);
    mockProfileUpdate.mockResolvedValueOnce({ id: "profile-1", isVerified: true });

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/verify"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credential).toEqual(updatedCredential);

    expect(mockCredentialUpdate).toHaveBeenCalledWith({
      where: { id: "cred-1" },
      data: { isVerified: true },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, userId: true },
        },
      },
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { isVerified: true },
    });

    expect(mockAuditLog).toHaveBeenCalledWith({
      event: "CREDENTIAL_UPDATED",
      userId: "user-1",
      email: "alice@example.com",
      ip: "127.0.0.1",
      userAgent: "test-agent",
      path: "/api/v1/admin/credentials/cred-1/verify",
      metadata: {
        credentialId: "cred-1",
        profileId: "profile-1",
        action: "verified",
        adminUserId: "admin-1",
      },
    });
  });

  it("returns 500 when credential is not found (Prisma throws)", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    const prismaError = new Error("Record not found");
    (prismaError as unknown as Record<string, unknown>).code = "P2025";
    mockCredentialUpdate.mockRejectedValueOnce(prismaError);

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/nonexistent/verify"),
      makeParams("nonexistent")
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(body.requestId).toBeDefined();
    expect(mockProfileUpdate).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    mockCredentialUpdate.mockResolvedValueOnce(makeCredential({ isVerified: true }));
    mockProfileUpdate.mockResolvedValueOnce({ id: "profile-1", isVerified: true });

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/verify"),
      makeParams("cred-1")
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
