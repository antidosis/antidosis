import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
    },
  },
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function makeRequest(url: string): NextRequest {
  const req = new Request(url, { headers: { "user-agent": BROWSER_UA } }) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

describe("GET /api/v1/pros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with pros list", async () => {
    mockProfileFindMany.mockResolvedValue([
      { id: "p1", fullName: "Pro One", skills: [{ name: "React" }], credentials: [{ id: "c1" }] },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("p1");
    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isVerified: true,
          mobileVerified: true,
          showInDirectory: true,
        }),
        take: 100,
      })
    );
  });

  it("returns 200 with search query", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?q=react"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(Array.isArray(call.where.AND)).toBe(true);
    expect(call.where.AND[0].OR).toBeDefined();
  });

  it("sets cache-control header", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=120");
  });

  it("filters to businesses when type=businesses", async () => {
    mockProfileFindMany.mockResolvedValue([
      {
        id: "b1",
        fullName: "Acme Plumbing",
        accountType: "business",
        abn: "12345678901",
        abnVerified: true,
        skills: [],
        credentials: [],
      },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?type=businesses"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].accountType).toBe("business");
    expect(json[0].abn).toBe("12345678901");
    expect(json[0].abnVerified).toBe(true);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.accountType).toBe("business");
  });

  it("filters to individuals when type=people", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?type=people"));
    expect(res.status).toBe(200);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.accountType).toBe("individual");
  });

  it("ignores unknown type values and applies no account filter", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?type=hack"));
    expect(res.status).toBe(200);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.accountType).toBeUndefined();
  });

  it("hides an individual's ABN and keeps their audience size", async () => {
    mockProfileFindMany.mockResolvedValue([
      {
        id: "i1",
        fullName: "Creator",
        accountType: "individual",
        abn: "51824753556",
        abnVerified: true,
        audienceSize: 3200,
        skills: [],
        credentials: [],
      },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros"));
    const json = await res.json();
    expect(json[0].abn).toBeNull();
    expect(json[0].abnVerified).toBe(false);
    expect(json[0].audienceSize).toBe(3200);
  });

  it("keeps a business's ABN and hides audience size", async () => {
    mockProfileFindMany.mockResolvedValue([
      {
        id: "b1",
        fullName: "Acme",
        accountType: "business",
        abn: "51824753556",
        abnVerified: true,
        audienceSize: 99000,
        skills: [],
        credentials: [],
      },
    ]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros"));
    const json = await res.json();
    expect(json[0].abn).toBe("51824753556");
    expect(json[0].abnVerified).toBe(true);
    expect(json[0].audienceSize).toBeNull();
  });

  it("directory projection never selects account-only fields", async () => {
    // Directory cards promise business contact details (business phone /
    // email, public phone) but never the member's account mobile, private
    // phone or sign-in email.
    mockProfileFindMany.mockResolvedValue([]);
    await GET(makeRequest("http://localhost/api/v1/pros"));
    const select = mockProfileFindMany.mock.calls[0][0].select;
    const selected = Object.keys(select);
    for (const forbidden of ["mobile", "privatePhone", "email"]) {
      expect(selected).not.toContain(forbidden);
    }
    expect(selected).toContain("publicPhone");
    expect(selected).toContain("businessPhone");
    expect(selected).toContain("businessEmail");
  });

  it("filters by profession specialty when profession param is set", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?profession=plumber"));
    expect(res.status).toBe(200);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.directorySpecialties).toEqual({ some: { profession: "plumber" } });
  });

  it("AND-combines profession filter with text search", async () => {
    mockProfileFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/v1/pros?profession=influencer&q=food"));
    expect(res.status).toBe(200);
    const call = mockProfileFindMany.mock.calls[0][0];
    expect(call.where.directorySpecialties).toEqual({ some: { profession: "influencer" } });
    expect(Array.isArray(call.where.AND)).toBe(true);
    expect(call.where.OR).toBeUndefined();
  });
});
