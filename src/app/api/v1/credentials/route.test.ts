import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

const mockProfileFindUnique = vi.fn();
const mockCredentialFindMany = vi.fn();
const mockCredentialCreate = vi.fn();
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
      findMany: (...args: unknown[]) => mockCredentialFindMany(...args),
      create: (...args: unknown[]) => mockCredentialCreate(...args),
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

const mockUser = { id: "user-1", email: "test@example.com" };
const mockProfile = { id: "profile-1" };
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
  createdAt: new Date("2024-01-01"),
};

describe("GET /api/v1/credentials", () => {
  beforeEach(() => {
    mockProfileFindUnique.mockReset();
    mockCredentialFindMany.mockReset();
    mockCredentialCreate.mockReset();
    mockGetUser.mockReset();
    mockAuditLog.mockReset();
    mockGetClientInfo.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerError.mockReset();
  });

  it("returns credentials list for authenticated user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindMany.mockResolvedValueOnce([mockCredential]);

    const res = await GET(makeRequest("http://localhost/api/v1/credentials"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.credentials).toHaveLength(1);
    expect(body.credentials[0].id).toBe("cred-1");
    expect(mockCredentialFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: "profile-1" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await GET(makeRequest("http://localhost/api/v1/credentials"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(null);

    const res = await GET(makeRequest("http://localhost/api/v1/credentials"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialFindMany.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/credentials"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/credentials", () => {
  beforeEach(() => {
    mockProfileFindUnique.mockReset();
    mockCredentialFindMany.mockReset();
    mockCredentialCreate.mockReset();
    mockGetUser.mockReset();
    mockAuditLog.mockReset();
    mockGetClientInfo.mockReset();
    mockLoggerInfo.mockReset();
    mockLoggerError.mockReset();
  });

  it("creates a credential and returns 201", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialCreate.mockResolvedValueOnce(mockCredential);
    mockGetClientInfo.mockReturnValueOnce({ ip: "127.0.0.1", userAgent: "test-agent" });

    const body = {
      type: "license",
      title: "Driver License",
    };

    const res = await POST(makeRequest("http://localhost/api/v1/credentials", "POST", body));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.credential.id).toBe("cred-1");
    expect(mockCredentialCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileId: "profile-1",
          type: "license",
          title: "Driver License",
        }),
      })
    );
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "CREDENTIAL_CREATED",
        userId: "user-1",
        email: "test@example.com",
        metadata: { credentialId: "cred-1", type: "license" },
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials", "POST", { type: "license", title: "Test" })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials", "POST", { type: "license", title: "Test" })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 400 for validation errors (invalid type)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);

    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials", "POST", {
        type: "invalid_type",
        title: "Test",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns 400 when missing required fields", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);

    const res = await POST(makeRequest("http://localhost/api/v1/credentials", "POST", {}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns 400 when title is empty", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);

    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials", "POST", { type: "license", title: "" })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockProfileFindUnique.mockResolvedValueOnce(mockProfile);
    mockCredentialCreate.mockResolvedValueOnce(mockCredential);
    mockGetClientInfo.mockReturnValueOnce({ ip: "127.0.0.1", userAgent: "test-agent" });

    const res = await POST(
      makeRequest("http://localhost/api/v1/credentials", "POST", { type: "license", title: "Test" })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
