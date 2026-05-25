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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    credential: {
      update: (...args: unknown[]) => mockCredentialUpdate(...args),
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

// ─── Sanitize mock ───
const mockSanitizePlainText = vi.fn((input: string) => input.trim());

vi.mock("@/lib/security/sanitize", () => ({
  sanitizePlainText: (input: string) => mockSanitizePlainText(input),
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
    rejectionReason: null,
    profile: {
      id: "profile-1",
      fullName: "Alice Smith",
      email: "alice@example.com",
      userId: "user-1",
    },
    ...overrides,
  };
}

describe("POST /api/v1/admin/credentials/[id]/reject", () => {
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
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/reject"),
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
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/reject"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mockCredentialUpdate).not.toHaveBeenCalled();
  });

  it("rejects a credential without a reason", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    const updatedCredential = makeCredential({ rejectionReason: null });
    mockCredentialUpdate.mockResolvedValueOnce(updatedCredential);

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/reject"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credential).toEqual(updatedCredential);

    expect(mockCredentialUpdate).toHaveBeenCalledWith({
      where: { id: "cred-1" },
      data: {
        isVerified: false,
        rejectionReason: null,
      },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, userId: true },
        },
      },
    });

    expect(mockAuditLog).toHaveBeenCalledWith({
      event: "CREDENTIAL_UPDATED",
      userId: "user-1",
      email: "alice@example.com",
      ip: "127.0.0.1",
      userAgent: "test-agent",
      path: "/api/v1/admin/credentials/cred-1/reject",
      metadata: {
        credentialId: "cred-1",
        profileId: "profile-1",
        action: "rejected",
        rejectionReason: null,
        adminUserId: "admin-1",
      },
    });
  });

  it("rejects a credential with a sanitized reason", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    const updatedCredential = makeCredential({ rejectionReason: "Image is blurry" });
    mockCredentialUpdate.mockResolvedValueOnce(updatedCredential);
    mockSanitizePlainText.mockReturnValueOnce("Image is blurry");

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/reject", "POST", {
        rejectionReason: "  Image is blurry  ",
      }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credential).toEqual(updatedCredential);

    expect(mockSanitizePlainText).toHaveBeenCalledWith("  Image is blurry  ");

    expect(mockCredentialUpdate).toHaveBeenCalledWith({
      where: { id: "cred-1" },
      data: {
        isVerified: false,
        rejectionReason: "Image is blurry",
      },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, userId: true },
        },
      },
    });

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          action: "rejected",
          rejectionReason: "  Image is blurry  ",
        }),
      })
    );
  });

  it("ignores an invalid request body and rejects without reason", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    const updatedCredential = makeCredential({ rejectionReason: null });
    mockCredentialUpdate.mockResolvedValueOnce(updatedCredential);

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/reject", "POST", {
        rejectionReason: 12345,
      }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credential).toEqual(updatedCredential);

    // Zod validation should fail for non-string, so the catch block handles it
    expect(mockCredentialUpdate).toHaveBeenCalledWith({
      where: { id: "cred-1" },
      data: {
        isVerified: false,
        rejectionReason: null,
      },
      include: {
        profile: {
          select: { id: true, fullName: true, email: true, userId: true },
        },
      },
    });
  });

  it("returns 500 when credential is not found (Prisma throws)", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    const prismaError = new Error("Record not found");
    (prismaError as Record<string, unknown>).code = "P2025";
    mockCredentialUpdate.mockRejectedValueOnce(prismaError);

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/nonexistent/reject"),
      makeParams("nonexistent")
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(body.requestId).toBeDefined();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: true,
      user: mockAdminUser,
    });

    mockCredentialUpdate.mockResolvedValueOnce(makeCredential());

    const res = await POST(
      makeRequest("http://localhost/api/v1/admin/credentials/cred-1/reject"),
      makeParams("cred-1")
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
