import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockBlockFindFirst = vi.fn();
const mockContactRevealCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
    block: { findFirst: (...args: unknown[]) => mockBlockFindFirst(...args) },
    contactReveal: { create: (...args: unknown[]) => mockContactRevealCreate(...args) },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Rate-limit mocks ───
const mockRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "ip:1.2.3.4",
}));

const TARGET_ID = "d77c9f75-b27d-41a6-bfcb-6069c9884e35";

function makeRequest(userAgent: string | null = BROWSER_UA): NextRequest {
  const headers: Record<string, string> = { "x-forwarded-for": "1.2.3.4" };
  if (userAgent) headers["user-agent"] = userAgent;
  return new Request(`http://localhost/api/v1/profiles/${TARGET_ID}/reveal-contact`, {
    method: "POST",
    headers,
  }) as NextRequest;
}

const LIVE_LISTING = {
  id: TARGET_ID,
  bannedAt: null,
  isVerified: true,
  mobileVerified: true,
  showInDirectory: true,
  publicPhone: "0400000000",
  businessPhone: "0457189685",
  businessEmail: "admin@hekaweb.com",
  businessSocialLinks:
    '[{"platform":"website","url":"https://hekaweb.com"},{"platform":"facebook","url":"https://facebook.com/hekaweb"}]',
  socialLinks: [{ platform: "instagram", url: "https://instagram.com/martin" }],
};

function authed() {
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockRateLimit.mockResolvedValue({ allowed: true, remaining: 19, resetAt: Date.now() + 1000 });
  mockContactRevealCreate.mockResolvedValue({});
  mockBlockFindFirst.mockResolvedValue(null);
  mockProfileFindUnique.mockImplementation((args: { where: Record<string, string> }) =>
    Promise.resolve("userId" in args.where ? { id: "viewer-1" } : LIVE_LISTING)
  );
}

describe("POST /api/v1/profiles/[id]/reveal-contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses known crawler agents before any auth or DB work", async () => {
    const res = await POST(makeRequest("Mozilla/5.0 (compatible; GPTBot/1.2)"), {
      params: { id: TARGET_ID },
    });
    expect(res.status).toBe(403);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("refuses requests with no user agent", async () => {
    const res = await POST(makeRequest(null), { params: { id: TARGET_ID } });
    expect(res.status).toBe(403);
  });

  it("requires login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("LOGIN_REQUIRED");
    expect(mockContactRevealCreate).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when a budget is exhausted", async () => {
    authed();
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const res = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(mockContactRevealCreate).not.toHaveBeenCalled();
  });

  it("reveals the listing contact for a live directory entry and audits the reveal", async () => {
    authed();
    const res = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.listing).toEqual({
      phone: "0457189685",
      email: "admin@hekaweb.com",
      links: [
        { platform: "website", url: "https://hekaweb.com" },
        { platform: "facebook", url: "https://facebook.com/hekaweb" },
      ],
    });
    expect(body.personal).toEqual({
      phone: "0400000000",
      links: [{ platform: "instagram", url: "https://instagram.com/martin" }],
    });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");

    expect(mockContactRevealCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        viewerId: "viewer-1",
        targetId: TARGET_ID,
        scope: "listing",
        ip: "1.2.3.4",
      }),
    });
    const audit = mockContactRevealCreate.mock.calls[0][0].data;
    expect(JSON.parse(audit.fields)).toEqual(["phone", "email", "website", "socials"]);
  });

  it("withholds the listing group when the profile is not a live directory entry", async () => {
    authed();
    mockProfileFindUnique.mockImplementation((args: { where: Record<string, string> }) =>
      Promise.resolve(
        "userId" in args.where ? { id: "viewer-1" } : { ...LIVE_LISTING, showInDirectory: false }
      )
    );
    const res = await POST(makeRequest(), { params: { id: TARGET_ID } });
    const body = await res.json();
    expect(body.listing).toBeNull();
    expect(body.personal.phone).toBe("0400000000");
  });

  it("returns 404 when the target is banned or blocked", async () => {
    authed();
    mockProfileFindUnique.mockImplementation((args: { where: Record<string, string> }) =>
      Promise.resolve(
        "userId" in args.where ? { id: "viewer-1" } : { ...LIVE_LISTING, bannedAt: new Date() }
      )
    );
    const banned = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(banned.status).toBe(404);

    authed();
    mockBlockFindFirst.mockResolvedValue({ id: "block-1" });
    const blocked = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(blocked.status).toBe(404);
  });

  it("returns 404 when the target shares nothing", async () => {
    authed();
    mockProfileFindUnique.mockImplementation((args: { where: Record<string, string> }) =>
      Promise.resolve(
        "userId" in args.where
          ? { id: "viewer-1" }
          : {
              ...LIVE_LISTING,
              publicPhone: null,
              businessPhone: null,
              businessEmail: null,
              businessSocialLinks: null,
              socialLinks: [],
            }
      )
    );
    const res = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(res.status).toBe(404);
    expect(mockContactRevealCreate).not.toHaveBeenCalled();
  });
});
