import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, PATCH, DELETE } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileCreate = vi.fn();
const mockProfileUpdate = vi.fn();
const mockProfileDelete = vi.fn();
const mockDirectorySpecialtyCount = vi.fn();
const mockAuditLogDeleteMany = vi.fn();
const mockMobileVerificationCodeDeleteMany = vi.fn();
const mockCredentialDeleteMany = vi.fn();
const mockSkillDeleteMany = vi.fn();
const mockSocialLinkDeleteMany = vi.fn();
const mockNotificationDeleteMany = vi.fn();
const mockDeviceTokenDeleteMany = vi.fn();
const mockContractUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      create: (...args: unknown[]) => mockProfileCreate(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
      delete: (...args: unknown[]) => mockProfileDelete(...args),
    },
    directorySpecialty: {
      count: (...args: unknown[]) => mockDirectorySpecialtyCount(...args),
    },
    auditLog: {
      deleteMany: (...args: unknown[]) => mockAuditLogDeleteMany(...args),
    },
    mobileVerificationCode: {
      deleteMany: (...args: unknown[]) => mockMobileVerificationCodeDeleteMany(...args),
    },
    credential: {
      deleteMany: (...args: unknown[]) => mockCredentialDeleteMany(...args),
    },
    skill: {
      deleteMany: (...args: unknown[]) => mockSkillDeleteMany(...args),
    },
    socialLink: {
      deleteMany: (...args: unknown[]) => mockSocialLinkDeleteMany(...args),
    },
    notification: {
      deleteMany: (...args: unknown[]) => mockNotificationDeleteMany(...args),
    },
    deviceToken: {
      deleteMany: (...args: unknown[]) => mockDeviceTokenDeleteMany(...args),
    },
    contract: {
      updateMany: (...args: unknown[]) => mockContractUpdateMany(...args),
    },
  },
}));

// ─── Bans mock ───
const mockRecordBannedMobile = vi.fn();

vi.mock("@/lib/bans", () => ({
  recordBannedMobile: (...args: unknown[]) => mockRecordBannedMobile(...args),
}));

// ─── Storage (service client) mock ───
const mockStorageRemove = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: () => ({ remove: (...args: unknown[]) => mockStorageRemove(...args) }),
    },
  }),
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
      handle: "test_user",
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
    expect(body.handle).toBe("test_user");
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

  it("self-heals business accounts whose directory specialty was removed", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      accountType: "business",
      abn: "51824753556",
      skills: [],
      socialLinks: [],
      credentials: [],
      reviewsReceived: [],
    });
    mockDirectorySpecialtyCount.mockResolvedValue(0);
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      accountType: "individual",
      businessSocialLinks: null,
      acceptedExchanges: null,
      skills: [],
      socialLinks: [],
      credentials: [],
      reviewsReceived: [],
    });

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: { accountType: "individual" },
      })
    );
    expect(body.accountType).toBe("individual");
  });

  it("keeps business accounts that still hold a directory specialty", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      accountType: "business",
      skills: [],
      socialLinks: [],
      credentials: [],
      reviewsReceived: [],
    });
    mockDirectorySpecialtyCount.mockResolvedValue(2);

    const res = await GET(makeRequest("http://localhost/api/v1/profiles/me"));

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/v1/profiles/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDirectorySpecialtyCount.mockResolvedValue(0);
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

  it("persists business social links as an independent JSON blob", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "business",
    });
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      // The stored column is a JSON string on the raw row — the response must
      // present it parsed (the dashboard editor maps over this value).
      businessSocialLinks: JSON.stringify([
        { platform: "website", url: "https://acme.com.au" },
        { platform: "instagram", url: "https://instagram.com/acme" },
      ]),
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          businessSocialLinks: [
            { platform: "website", url: "https://acme.com.au" },
            { platform: "instagram", url: "https://instagram.com/acme" },
          ],
        }),
      })
    );

    expect(res.status).toBe(200);
    const stored = JSON.parse(mockProfileUpdate.mock.calls[0][0].data.businessSocialLinks);
    expect(stored).toEqual([
      { platform: "website", url: "https://acme.com.au" },
      { platform: "instagram", url: "https://instagram.com/acme" },
    ]);
    // Personal links untouched
    expect(mockProfileUpdate.mock.calls[0][0].data.socialLinks).toBeUndefined();

    // Response shape: parsed array, not the raw JSON string (regression —
    // a string here crashed the dashboard form reset after saving).
    const body = await res.json();
    expect(body.businessSocialLinks).toEqual([
      { platform: "website", url: "https://acme.com.au" },
      { platform: "instagram", url: "https://instagram.com/acme" },
    ]);
  });

  it("persists business contact details and clears them on empty string", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
    });
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      businessPhone: "02 4321 0987",
      businessEmail: "bookings@example.com.au",
      skills: [],
      socialLinks: [],
      credentials: [],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          businessPhone: "02 4321 0987",
          businessEmail: "bookings@example.com.au",
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessPhone: "02 4321 0987",
          businessEmail: "bookings@example.com.au",
        }),
      })
    );

    mockProfileUpdate.mockClear();
    const cleared = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ businessPhone: "", businessEmail: "" }),
      })
    );
    expect(cleared.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessPhone: null, businessEmail: null }),
      })
    );
  });

  it("returns 400 for a malformed business email", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ businessEmail: "not-an-email" }),
      })
    );

    expect(res.status).toBe(400);
  });

  it("normalizes scheme-less social link URLs to https", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      socialLinks: [{ platform: "instagram", url: "https://instagram.com/me", isPublic: true }],
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          socialLinks: [{ platform: "instagram", url: "instagram.com/me", isPublic: true }],
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          socialLinks: expect.objectContaining({
            create: [{ platform: "instagram", url: "https://instagram.com/me", isPublic: true }],
          }),
        }),
      })
    );
  });

  it("returns 400 for a social link URL that is not a valid http(s) URL", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          socialLinks: [{ platform: "website", url: "definitely not a url" }],
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("http(s) URL");
  });

  it("returns 400 for schema-invalid profile data instead of 500", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: "a".repeat(101) }),
      })
    );

    expect(res.status).toBe(400);
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

  it("returns 400 when becoming a business without an ABN", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ accountType: "business" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Business accounts require an ABN");
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when becoming a business with a checksum-invalid ABN", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ accountType: "business", abn: "12345678901" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Invalid ABN");
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("becoming a business with a valid ABN stores it normalised and unverified (no ABR GUID)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      accountType: "business",
      abn: "51824753556",
      abnVerified: false,
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ accountType: "business", abn: "51 824 753 556" }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accountType).toBe("business");
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountType: "business",
          abn: "51824753556",
          abnVerified: false,
        }),
      })
    );
  });

  it("becoming a business re-validates the ABN already on file", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: "51824753556",
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", accountType: "business" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ accountType: "business" }),
      })
    );

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accountType: "business", abn: "51824753556" }),
      })
    );
  });

  it("rejects becoming a business when the stored ABN is checksum-invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: "12345678901",
      accountType: "individual",
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ accountType: "business" }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("rejects clearing the ABN in the same request as becoming a business", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ accountType: "business", abn: null }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("resetting abnVerified when the ABN is cleared", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: "51824753556",
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", abn: null, abnVerified: false });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ abn: "" }),
      })
    );

    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ abn: null, abnVerified: false }),
      })
    );
  });

  describe("publicPhone — verified mobile only", () => {
    it("rejects a public phone that is not the account's verified mobile", async () => {
      mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
      mockProfileFindUnique.mockResolvedValue({
        id: "profile-1",
        mobile: "0400123456",
        mobileVerified: true,
        abn: null,
        accountType: "individual",
      });

      const res = await PATCH(
        makeRequest("http://localhost/api/v1/profiles/me", {
          method: "PATCH",
          body: JSON.stringify({ publicPhone: "0499777666" }),
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Only your verified mobile number can be shown publicly");
      expect(mockProfileUpdate).not.toHaveBeenCalled();
    });

    it("rejects a public phone when the account mobile is not verified", async () => {
      mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
      mockProfileFindUnique.mockResolvedValue({
        id: "profile-1",
        mobile: "0400123456",
        mobileVerified: false,
        abn: null,
        accountType: "individual",
      });

      const res = await PATCH(
        makeRequest("http://localhost/api/v1/profiles/me", {
          method: "PATCH",
          body: JSON.stringify({ publicPhone: "0400123456" }),
        })
      );

      expect(res.status).toBe(400);
      expect(mockProfileUpdate).not.toHaveBeenCalled();
    });

    it("accepts the verified mobile and stores it in canonical form", async () => {
      mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
      mockProfileFindUnique.mockResolvedValue({
        id: "profile-1",
        mobile: "+61400123456",
        mobileVerified: true,
        abn: null,
        accountType: "individual",
      });
      mockProfileUpdate.mockResolvedValue({ id: "profile-1", publicPhone: "+61400123456" });

      const res = await PATCH(
        makeRequest("http://localhost/api/v1/profiles/me", {
          method: "PATCH",
          body: JSON.stringify({ publicPhone: "0400 123 456" }),
        })
      );

      expect(res.status).toBe(200);
      expect(mockProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publicPhone: "+61400123456" }),
        })
      );
    });
  });

  describe("directory specialty — business derivation", () => {
    it("rejects saves while a specialty is held without an ABN", async () => {
      mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
      mockProfileFindUnique.mockResolvedValue({
        id: "profile-1",
        mobile: null,
        mobileVerified: false,
        abn: null,
        accountType: "individual",
      });
      mockDirectorySpecialtyCount.mockResolvedValue(1);

      const res = await PATCH(
        makeRequest("http://localhost/api/v1/profiles/me", {
          method: "PATCH",
          body: JSON.stringify({ bio: "Just updating my bio" }),
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Directory listings require an ABN");
      expect(mockProfileUpdate).not.toHaveBeenCalled();
    });

    it("derives the business account type when a specialty and ABN are both present", async () => {
      mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
      mockProfileFindUnique.mockResolvedValue({
        id: "profile-1",
        mobile: null,
        mobileVerified: false,
        abn: "51824753556",
        accountType: "individual",
      });
      mockDirectorySpecialtyCount.mockResolvedValue(1);
      mockProfileUpdate.mockResolvedValue({ id: "profile-1", accountType: "business" });

      const res = await PATCH(
        makeRequest("http://localhost/api/v1/profiles/me", {
          method: "PATCH",
          body: JSON.stringify({ bio: "Listed in the directory" }),
        })
      );

      expect(res.status).toBe(200);
      expect(mockProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accountType: "business" }),
        })
      );
    });
  });

  it("persists audienceSize and allows clearing it with null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", audienceSize: 3200 });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ audienceSize: 3200 }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ audienceSize: 3200 }),
      })
    );

    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", audienceSize: null });

    const clearRes = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ audienceSize: null }),
      })
    );
    expect(clearRes.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ audienceSize: null }),
      })
    );
  });

  it("rejects a non-integer audienceSize", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ audienceSize: "lots" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("stores appearance preferences as validated JSON, mapping theme onto its slot", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ preferences: { theme: "porcelain", font: "editorial" } }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferences: JSON.stringify({ light: "porcelain", dark: null, font: "editorial" }),
        }),
      })
    );
  });

  it("accepts explicit light/dark pair slots and validates their brightness", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1" });

    const ok = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ preferences: { light: "porcelain", dark: "chrome" } }),
      })
    );
    expect(ok.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferences: JSON.stringify({ light: "porcelain", dark: "chrome", font: null }),
        }),
      })
    );

    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });

    const wrongSide = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ preferences: { light: "ember", dark: "porcelain" } }),
      })
    );
    expect(wrongSide.status).toBe(400);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("rejects unknown theme or font ids in preferences", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });

    const badTheme = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ preferences: { theme: "hacked", font: "system" } }),
      })
    );
    expect(badTheme.status).toBe(400);

    const badFont = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ preferences: { theme: "chrome", font: "wingdings" } }),
      })
    );
    expect(badFont.status).toBe(400);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("clears preferences with null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobile: null,
      mobileVerified: false,
      abn: null,
      accountType: "individual",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1" });

    const res = await PATCH(
      makeRequest("http://localhost/api/v1/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ preferences: null }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ preferences: null }) })
    );
  });
});

describe("DELETE /api/v1/profiles/me", () => {
  function makeDeletableProfile(overrides?: Record<string, unknown>) {
    return {
      id: "profile-1",
      userId: "user-1",
      mobile: "+61400123456",
      bannedAt: null,
      bannedReason: null,
      avatarUrl: "https://x.supabase.co/storage/v1/object/public/uploads/avatars/profile-1/a.png",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      playStorePurchaseToken: null,
      playStoreProductId: null,
      credentials: [],
      ...overrides,
    };
  }

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

  it("anonymizes the profile instead of cascade-deleting it", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(makeDeletableProfile());
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // No hard delete — contracts, reviews, needs, and messages survive
    expect(mockProfileDelete).not.toHaveBeenCalled();

    // Tombstone: PII scrubbed, email/mobile uniqueness freed
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: expect.objectContaining({
        fullName: "Deleted User",
        handle: null,
        email: "deleted+profile-1@deleted.invalid",
        mobile: null,
        mobileVerified: false,
        bio: null,
        avatarUrl: null,
        locationName: null,
        publicPhone: null,
        privatePhone: null,
        abn: null,
        bannedAt: null,
        bannedReason: null,
      }),
    });

    // Dependent PII removed
    expect(mockCredentialDeleteMany).toHaveBeenCalledWith({ where: { profileId: "profile-1" } });
    expect(mockSkillDeleteMany).toHaveBeenCalledWith({ where: { profileId: "profile-1" } });
    expect(mockSocialLinkDeleteMany).toHaveBeenCalledWith({ where: { profileId: "profile-1" } });
    expect(mockNotificationDeleteMany).toHaveBeenCalledWith({ where: { userId: "profile-1" } });
    expect(mockMobileVerificationCodeDeleteMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1" },
    });
    expect(mockDeviceTokenDeleteMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1" },
    });

    expect(mockContractUpdateMany).toHaveBeenCalledWith({
      where: { partyAId: "profile-1" },
      data: { partyASignature: null, inviteEmail: null },
    });
    expect(mockContractUpdateMany).toHaveBeenCalledWith({
      where: { partyBId: "profile-1" },
      data: { partyBSignature: null },
    });
    expect(mockContractUpdateMany).toHaveBeenCalledWith({
      where: { partyAId: "profile-1", kind: "direct", partyBId: null, status: "draft" },
      data: {
        status: "cancelled",
        cancelledAt: expect.any(Date),
        inviteTokenHash: null,
        inviteEmail: null,
      },
    });

    // Auth user still deleted so the tombstone cannot be logged into
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");

    // Not banned — no ban persistence
    expect(mockRecordBannedMobile).not.toHaveBeenCalled();
  });

  it("persists the mobile to BannedMobile before scrubbing a banned profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(
      makeDeletableProfile({ bannedAt: new Date(), bannedReason: "scam reports" })
    );
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );

    expect(res.status).toBe(200);
    expect(mockRecordBannedMobile).toHaveBeenCalledWith({
      id: "profile-1",
      mobile: "+61400123456",
      bannedReason: "scam reports",
    });
    // The tombstone no longer carries the mobile or the ban markers
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: expect.objectContaining({ mobile: null, bannedAt: null, bannedReason: null }),
    });
  });

  it("does not record a ban when the banned profile has no mobile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(
      makeDeletableProfile({ bannedAt: new Date(), mobile: null })
    );
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );

    expect(res.status).toBe(200);
    expect(mockRecordBannedMobile).not.toHaveBeenCalled();
  });

  it("proceeds with anonymization when storage cleanup fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(makeDeletableProfile());
    mockStorageRemove.mockRejectedValue(new Error("storage down"));
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockProfileUpdate).toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(makeDeletableProfile());

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/profiles/me", { method: "DELETE" })
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
