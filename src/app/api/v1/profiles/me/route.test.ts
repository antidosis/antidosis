import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, PATCH, DELETE } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileCreate = vi.fn();
const mockProfileUpdate = vi.fn();
const mockProfileDelete = vi.fn();
const mockAuditLogDeleteMany = vi.fn();
const mockMobileVerificationCodeDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      create: (...args: unknown[]) => mockProfileCreate(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
      delete: (...args: unknown[]) => mockProfileDelete(...args),
    },
    auditLog: {
      deleteMany: (...args: unknown[]) => mockAuditLogDeleteMany(...args),
    },
    mobileVerificationCode: {
      deleteMany: (...args: unknown[]) => mockMobileVerificationCodeDeleteMany(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
  createAdminClient: () => ({
    auth: { admin: { deleteUser: (...args: unknown[]) => mockDeleteUser(...args) } },
  }),
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

// ─── Helpers ───
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as NextRequest;
}

function makeAuthUser(
  overrides?: Partial<{
    id: string;
    email: string;
    email_confirmed_at: string;
    user_metadata: Record<string, unknown>;
  }>
) {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    user_metadata: { full_name: "Test User" },
    ...overrides,
  };
}

describe("GET /api/v1/profiles/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email_confirmed_at: "" }) },
      error: null,
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns 200 with existing profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      fullName: "Test User",
      skills: [],
      socialLinks: [],
      credentials: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fullName).toBe("Test User");
  });

  it("auto-creates profile when missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);
    mockProfileCreate.mockResolvedValue({
      id: "profile-1",
      fullName: "Test User",
      skills: [],
      socialLinks: [],
      credentials: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("profile-1");
    expect(mockProfileCreate).toHaveBeenCalled();
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      skills: [],
      socialLinks: [],
      credentials: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("PATCH /api/v1/profiles/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({}),
      })
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid location", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ locationName: "Sydney" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Central Coast NSW");
  });

  it("returns 400 for invalid mobile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ mobile: "12345" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid mobile number format");
  });

  it("returns 409 when mobile already registered", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", mobile: null, mobileVerified: false })
      .mockResolvedValueOnce({ id: "profile-2" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ mobile: "0400123456" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("Mobile number already registered");
  });

  it("returns 200 on successful update", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
    });
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      fullName: "Updated",
      skills: [],
      socialLinks: [],
      credentials: [],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: "Updated" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fullName).toBe("Updated");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", fullName: "Updated" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: "Updated" }),
      })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("DELETE /api/v1/profiles/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 200 and deletes profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      playStorePurchaseToken: null,
      playStoreProductId: null,
    });
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockProfileDelete).toHaveBeenCalledWith({ where: { id: "profile-1" } });
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      playStorePurchaseToken: null,
      playStoreProductId: null,
    });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
