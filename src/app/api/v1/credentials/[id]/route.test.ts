import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH, DELETE } from "./route";

const mockProfileFindUnique = vi.fn();
const mockCredentialFindFirst = vi.fn();
const mockCredentialUpdate = vi.fn();
const mockCredentialDelete = vi.fn();
const mockGetUser = vi.fn();
const mockAuditLog = vi.fn();
const mockGetClientInfo = vi.fn();
const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    credential: {
      findFirst: (...args: unknown[]) => mockCredentialFindFirst(...args),
      update: (...args: unknown[]) => mockCredentialUpdate(...args),
      delete: (...args: unknown[]) => mockCredentialDelete(...args),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: (req: NextRequest) => mockGetClientInfo(req),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

function makeRequest(url: string, method = "GET", body?: unknown): NextRequest {
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

const mockUser = { id: "user-1", email: "test@example.com" };
const mockOtherUser = { id: "user-2", email: "other@example.com" };
const mockProfile = { id: "profile-1" };
const mockOtherProfile = { id: "profile-2" };
const mockCredential = {
  id: "cred-1",
  profileId: "profile-1",
  type: "license",
  title: "Driver License",
  description: null,
  documentNumber: null,
  issuedBy: null,
  issuedAt: null,
  expiresAt: null,
  fileUrl: null,
  backFileUrl: null,
  isPublic: false,
};

describe("PATCH /api/v1/credentials/[id]", () => {
  beforeEach(() => {
    mockProfileFindUnique.mockReset();
    mockCredentialFindFirst.mockReset();
    mockCredentialUpdate.mockReset();
    mockCredentialDelete.mockReset();
    mockGetUser.mockReset();
    mockAuditLog.mockReset();
    mockGetClientInfo.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerError.mockReset();
  });

  it("updates a credential and returns 200", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(mockCredential);
    mockCredentialUpdate.mockResolvedValueOnce({ ...mockCredential, title: "Updated License" });
    mockGetClientInfo.mockReturnValueOnce({ ip: "127.0.0.1", userAgent: "test-agent" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", {
        title: "Updated License",
      }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credential.title).toBe("Updated License");
    expect(mockCredentialUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cred-1" },
        data: expect.objectContaining({ title: "Updated License" }),
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CREDENTIAL_UPDATED",
        userId: "user-1",
        email: "test@example.com",
        metadata: { credentialId: "cred-1" },
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { title: "Updated" }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when credential not found", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { title: "Updated" }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Credential not found");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { title: "Updated" }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Credential not found");
  });

  it("returns 404 when user tries to access another user's credential", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockOtherUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockOtherProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(null);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { title: "Hacked" }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Credential not found");
  });

  it("returns 400 for validation errors (invalid type)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(mockCredential);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { type: "invalid_type" }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns 400 when title is empty", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(mockCredential);

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { title: "" }),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(mockCredential);
    mockCredentialUpdate.mockResolvedValueOnce(mockCredential);
    mockGetClientInfo.mockReturnValueOnce({ ip: "127.0.0.1", userAgent: "test-agent" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "PATCH", { title: "Updated" }),
      makeParams("cred-1")
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("DELETE /api/v1/credentials/[id]", () => {
  beforeEach(() => {
    mockProfileFindUnique.mockReset();
    mockCredentialFindFirst.mockReset();
    mockCredentialUpdate.mockReset();
    mockCredentialDelete.mockReset();
    mockGetUser.mockReset();
    mockAuditLog.mockReset();
    mockGetClientInfo.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerError.mockReset();
  });

  it("deletes a credential and returns 200", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(mockCredential);
    mockCredentialDelete.mockResolvedValueOnce(mockCredential);
    mockGetClientInfo.mockReturnValueOnce({ ip: "127.0.0.1", userAgent: "test-agent" });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "DELETE"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockCredentialDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cred-1" },
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CREDENTIAL_DELETED",
        userId: "user-1",
        email: "test@example.com",
        metadata: { credentialId: "cred-1" },
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "DELETE"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when credential not found", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "DELETE"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Credential not found");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "DELETE"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Credential not found");
  });

  it("returns 404 when user tries to delete another user's credential", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockOtherUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockOtherProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "DELETE"),
      makeParams("cred-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Credential not found");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindFirst.mockResolvedValueOnce(mockCredential);
    mockCredentialDelete.mockResolvedValueOnce(mockCredential);
    mockGetClientInfo.mockReturnValueOnce({ ip: "127.0.0.1", userAgent: "test-agent" });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/credentials/cred-1", "DELETE"),
      makeParams("cred-1")
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
