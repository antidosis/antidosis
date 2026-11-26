import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, POST } from "./route";

const mockBuilderFindMany = vi.fn();
const mockBuilderFindUnique = vi.fn();
const mockBuilderCreate = vi.fn();
const mockGetUser = vi.fn();
const mockParticipation = vi.fn();
const mockRateLimit = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshBuilder: {
      findMany: (...args: unknown[]) => mockBuilderFindMany(...args),
      findUnique: (...args: unknown[]) => mockBuilderFindUnique(...args),
      create: (...args: unknown[]) => mockBuilderCreate(...args),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

vi.mock("@/lib/participation", () => ({
  requireVerifiedParticipation: (...args: unknown[]) => mockParticipation(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "user:user-1",
}));

vi.mock("@/lib/email", () => ({
  sendMeshBuilderApplicationEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/store/builders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const APPLICATION = {
  businessName: "CoastMesh Works",
  description:
    "I flash and case Heltec and LilyGo boards, run documented range tests, and offer a 12 month repair warranty on every node I sell.",
};

describe("GET /api/v1/store/builders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only approved builders", async () => {
    mockBuilderFindMany.mockResolvedValue([
      { id: "b1", businessName: "CoastMesh Works", products: [] },
    ]);
    const res = await GET(new Request("http://localhost/api/v1/store/builders") as NextRequest);
    expect(res.status).toBe(200);
    expect(mockBuilderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "approved" } })
    );
  });

  it("pins featured products first and flags them", async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    const past = new Date(Date.now() - 24 * 60 * 60_000);
    mockBuilderFindMany.mockResolvedValue([
      {
        id: "b1",
        businessName: "CoastMesh Works",
        products: [
          { id: "p-standard", featuredUntil: null },
          { id: "p-expired", featuredUntil: past },
          { id: "p-featured", featuredUntil: future },
        ],
      },
    ]);
    const res = await GET(new Request("http://localhost/api/v1/store/builders") as NextRequest);
    const body = await res.json();
    const ids = body.builders[0].products.map((p: { id: string }) => p.id);
    expect(ids[0]).toBe("p-featured");
    const featured = body.builders[0].products.find((p: { id: string }) => p.id === "p-featured");
    const expired = body.builders[0].products.find((p: { id: string }) => p.id === "p-expired");
    expect(featured.featured).toBe(true);
    expect(expired.featured).toBe(false);
  });
});

describe("POST /api/v1/store/builders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "builder@example.com", email_confirmed_at: "x" } },
      error: null,
    });
    mockParticipation.mockResolvedValue({ ok: true, profileId: "profile-1" });
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockBuilderFindUnique.mockResolvedValue(null);
    mockBuilderCreate.mockResolvedValue({
      id: "b1",
      status: "pending",
      businessName: "CoastMesh Works",
    });
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("creates a pending application for a verified member", async () => {
    const res = await POST(makeRequest(APPLICATION));
    expect(res.status).toBe(201);
    expect(mockBuilderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileId: "profile-1", businessName: "CoastMesh Works" }),
      })
    );
  });

  it("rejects unauthenticated applicants", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await POST(makeRequest(APPLICATION));
    expect(res.status).toBe(401);
  });

  it("requires verified participation (mobile verified, not banned)", async () => {
    mockParticipation.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Mobile verification required" }), {
        status: 403,
      }),
    });
    const res = await POST(makeRequest(APPLICATION));
    expect(res.status).toBe(403);
    expect(mockBuilderCreate).not.toHaveBeenCalled();
  });

  it("rejects a second application from the same member", async () => {
    mockBuilderFindUnique.mockResolvedValue({ id: "b1", status: "pending" });
    const res = await POST(makeRequest(APPLICATION));
    expect(res.status).toBe(409);
  });

  it("rejects a too-short description", async () => {
    const res = await POST(makeRequest({ ...APPLICATION, description: "too short" }));
    expect(res.status).toBe(400);
  });

  it("rejects blocked website links (shorteners etc.)", async () => {
    const res = await POST(makeRequest({ ...APPLICATION, website: "https://bit.ly/abc" }));
    expect(res.status).toBe(400);
    expect(mockBuilderCreate).not.toHaveBeenCalled();
  });
});
