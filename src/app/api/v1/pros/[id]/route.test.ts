import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// ─── Prisma mocks ───
const mockProfileFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findFirst: (...args: unknown[]) => mockProfileFindFirst(...args),
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

const LIVE_PROFILE = {
  id: "d77c9f75-b27d-41a6-bfcb-6069c9884e35",
  fullName: "Martin Khoury",
  avatarUrl: null,
  bio: "founder",
  locationName: "noraville_2263",
  publicPhone: null,
  businessPhone: "0457189685",
  businessEmail: "admin@hekaweb.com",
  businessSocialLinks: '[{"platform":"website","url":"https://hekaweb.com"}]',
  ratingAvg: 10,
  ratingCount: 2,
  jobsCompleted: 1,
  isVerified: true,
  accountType: "business",
  abn: "12345678901",
  abnVerified: true,
  audienceSize: null,
  skills: [{ name: "web development" }],
  credentials: [{ id: "c1" }],
  directorySpecialties: [
    { profession: "web_developer", headline: "Sites & apps", attributes: null },
  ],
};

describe("GET /api/v1/pros/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regression: withCors used to drop the route context, so `params` arrived
  // undefined in production and every listing request 500'd.
  it("passes route params through the CORS wrapper and returns the live listing", async () => {
    mockProfileFindFirst.mockResolvedValue(LIVE_PROFILE);
    const res = await GET(
      makeRequest("http://localhost/api/v1/pros/d77c9f75-b27d-41a6-bfcb-6069c9884e35"),
      { params: { id: "d77c9f75-b27d-41a6-bfcb-6069c9884e35" } }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(LIVE_PROFILE.id);
    // Contact values never leave the public payload — only availability
    // flags; the reveal endpoint is the single door for the values.
    expect(json.contact).toEqual({
      phone: true,
      email: true,
      website: true,
      socials: [],
    });
    expect(json.businessPhone).toBeUndefined();
    expect(json.businessEmail).toBeUndefined();
    expect(json.businessSocialLinks).toBeUndefined();
    expect(json.publicPhone).toBeUndefined();
    expect(JSON.stringify(json)).not.toContain("0457189685");
    expect(JSON.stringify(json)).not.toContain("hekaweb.com");
    expect(mockProfileFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: LIVE_PROFILE.id,
          isVerified: true,
          mobileVerified: true,
          showInDirectory: true,
          bannedAt: null,
        }),
      })
    );
  });

  it("returns 404 when the profile is not a live directory entry", async () => {
    mockProfileFindFirst.mockResolvedValue(null);
    const res = await GET(
      makeRequest("http://localhost/api/v1/pros/d77c9f75-b27d-41a6-bfcb-6069c9884e35"),
      { params: { id: "d77c9f75-b27d-41a6-bfcb-6069c9884e35" } }
    );
    expect(res.status).toBe(404);
  });
});
