import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockQueryRaw = vi.fn();
const mockNeedCreate = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockSpecialtyCount = vi.fn();
const mockAuditLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    need: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockNeedCreate(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    directorySpecialty: {
      count: (...args: unknown[]) => mockSpecialtyCount(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test-id",
}));

vi.mock("@/lib/audit", () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

function makeRequest(url: string): NextRequest {
  return new Request(url) as NextRequest;
}

describe("GET /api/v1/needs", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockQueryRaw.mockReset();
  });

  it("returns needs list with pagination", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "1",
        title: "Need plumber",
        createdAt: new Date("2026-11-20T00:00:00Z"),
        boostedUntil: null,
        poster: { fullName: "John" },
      },
    ]);
    mockCount.mockResolvedValueOnce(1);
    mockFindMany.mockResolvedValueOnce([{ offerType: "service" }]);
    mockFindMany.mockResolvedValueOnce([{ needCategory: "home" }]);
    mockQueryRaw.mockResolvedValueOnce([{ name: "plumbing" }]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.needs).toHaveLength(1);
    expect(body.needs[0].title).toBe("Need plumber");
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.availableFilters.offerTypes).toContain("service");
  });

  it("filters by search query", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?q=plumber"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.OR).toEqual([
      { title: { contains: "plumber", mode: "insensitive" } },
      { description: { contains: "plumber", mode: "insensitive" } },
    ]);
  });

  it("filters by offer type", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?type=service"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.offerType).toBe("service");
  });

  it("filters by location", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?location=Terrigal"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.locationName).toEqual({
      contains: "Terrigal",
      mode: "insensitive",
    });
  });

  it("filters by skill", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?skill=plumbing"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.where.requiredSkills).toEqual({
      some: { name: { contains: "plumbing", mode: "insensitive" } },
    });
  });

  it("limits page size to 50", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    await GET(makeRequest("http://localhost/api/v1/needs?limit=100"));

    const firstCall = mockFindMany.mock.calls[0][0];
    expect(firstCall.take).toBe(50);
  });

  it("sets cache headers", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs"));

    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  });

  it("includes x-request-id header", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([]);
    mockFindMany.mockResolvedValueOnce([]);
    mockQueryRaw.mockResolvedValueOnce([]);

    const res = await GET(makeRequest("http://localhost/api/v1/needs"));

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});

describe("POST /api/v1/needs (participation gate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "test@example.com", email_confirmed_at: "2024-01-01" },
      },
      error: null,
    });
  });

  function makePost(body?: Record<string, unknown>): NextRequest {
    return new Request("http://localhost/api/v1/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }) as NextRequest;
  }

  it("returns 403 MOBILE_NOT_VERIFIED when the poster has no verified mobile", async () => {
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: false,
      bannedAt: null,
    });

    const res = await POST(makePost({ title: "x" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("MOBILE_NOT_VERIFIED");
    expect(mockRateLimit).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns 403 ACCOUNT_SUSPENDED for banned profiles", async () => {
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: new Date("2026-01-01"),
    });

    const res = await POST(makePost({ title: "x" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("ACCOUNT_SUSPENDED");
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it("stores urgency and opt-in contact without copying the phone number", async () => {
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
      mobile: "+61400000000",
    });
    mockNeedCreate.mockImplementation(({ data }) => ({
      id: "need-1",
      ...data,
      requiredSkills: [],
    }));

    const res = await POST(
      makePost({
        title: "Broken down on the roadside",
        description: "My car will not start and I need a jump start.",
        offerType: "money",
        offerDescription: "$50 for your time",
        isLocal: true,
        locationName: "terrigal_2260",
        urgency: 9,
        allowUrgentContact: true,
        requiredSkills: [],
        images: [],
        offerImages: [],
      })
    );

    expect(res.status).toBe(201);
    expect(mockNeedCreate).toHaveBeenCalledOnce();
    const createData = mockNeedCreate.mock.calls[0][0].data;
    expect(createData.urgency).toBe(9);
    expect(createData.allowUrgentContact).toBe(true);
    expect(createData).not.toHaveProperty("mobile");
  });

  it("rejects urgent contact when no verified mobile is available", async () => {
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      mobileVerified: true,
      bannedAt: null,
      mobile: null,
    });

    const res = await POST(
      makePost({
        title: "Urgent roadside help",
        description: "I need somebody nearby to help with my vehicle.",
        offerType: "money",
        offerDescription: "$50",
        isLocal: true,
        locationName: "terrigal_2260",
        urgency: 8,
        allowUrgentContact: true,
      })
    );

    expect(res.status).toBe(400);
    expect(mockNeedCreate).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/needs (business posting)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "test@example.com", email_confirmed_at: "2024-01-01" },
      },
      error: null,
    });
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockNeedCreate.mockImplementation(({ data }) => ({
      id: "need-1",
      ...data,
      requiredSkills: [],
    }));
  });

  function makePost(body: Record<string, unknown>): NextRequest {
    return new Request("http://localhost/api/v1/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as NextRequest;
  }

  const businessProfile = {
    id: "profile-1",
    mobileVerified: true,
    bannedAt: null,
    mobile: "+61400000000",
    accountType: "business",
    abn: "12345678901",
    businessName: "Acme Plumbing",
    fullName: "Martin K",
    showInDirectory: true,
  };

  const validBody = {
    title: "Office cleaned weekly",
    description: "Looking for a cleaner for our office, once a week ongoing.",
    offerType: "money",
    offerDescription: "$60 per visit",
    isLocal: true,
    locationName: "terrigal_2260",
    requiredSkills: [],
    images: [],
    offerImages: [],
  };

  it("snapshots the business identity when posting as a business", async () => {
    mockProfileFindUnique.mockResolvedValue(businessProfile);
    mockSpecialtyCount.mockResolvedValue(1);

    const res = await POST(makePost({ ...validBody, postedAs: "business" }));

    expect(res.status).toBe(201);
    const createData = mockNeedCreate.mock.calls[0][0].data;
    expect(createData.postedAs).toBe("business");
    expect(createData.posterBusinessName).toBe("Acme Plumbing");
    expect(createData.posterAbn).toBe("12345678901");
  });

  it("falls back to the member's name when no trading name is set", async () => {
    mockProfileFindUnique.mockResolvedValue({ ...businessProfile, businessName: null });
    mockSpecialtyCount.mockResolvedValue(2);

    const res = await POST(makePost({ ...validBody, postedAs: "business" }));

    expect(res.status).toBe(201);
    const createData = mockNeedCreate.mock.calls[0][0].data;
    expect(createData.posterBusinessName).toBe("Martin K");
  });

  it("rejects business posting without a claimed specialty", async () => {
    mockProfileFindUnique.mockResolvedValue(businessProfile);
    mockSpecialtyCount.mockResolvedValue(0);

    const res = await POST(makePost({ ...validBody, postedAs: "business" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("BUSINESS_POSTING_NOT_AVAILABLE");
    expect(mockNeedCreate).not.toHaveBeenCalled();
  });

  it("rejects business posting when the directory listing is hidden", async () => {
    mockProfileFindUnique.mockResolvedValue({ ...businessProfile, showInDirectory: false });
    mockSpecialtyCount.mockResolvedValue(1);

    const res = await POST(makePost({ ...validBody, postedAs: "business" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("BUSINESS_POSTING_NOT_AVAILABLE");
    expect(mockNeedCreate).not.toHaveBeenCalled();
  });

  it("rejects business posting for individual accounts", async () => {
    mockProfileFindUnique.mockResolvedValue({
      ...businessProfile,
      accountType: "individual",
      abn: null,
    });
    mockSpecialtyCount.mockResolvedValue(0);

    const res = await POST(makePost({ ...validBody, postedAs: "business" }));

    expect(res.status).toBe(403);
    expect(mockNeedCreate).not.toHaveBeenCalled();
  });

  it("defaults to personal posting with no business snapshot", async () => {
    mockProfileFindUnique.mockResolvedValue(businessProfile);
    mockSpecialtyCount.mockResolvedValue(1);

    const res = await POST(makePost(validBody));

    expect(res.status).toBe(201);
    const createData = mockNeedCreate.mock.calls[0][0].data;
    expect(createData.postedAs).toBe("personal");
    expect(createData.posterBusinessName).toBeNull();
    expect(createData.posterAbn).toBeNull();
  });
});
