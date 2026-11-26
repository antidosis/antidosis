import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, PATCH } from "./route";

const mockBuilderFindUnique = vi.fn();
const mockBuilderUpdate = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshBuilder: {
      findUnique: (...args: unknown[]) => mockBuilderFindUnique(...args),
      update: (...args: unknown[]) => mockBuilderUpdate(...args),
    },
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

function makeRequest(body?: unknown): NextRequest {
  return new Request("http://localhost/api/v1/store/builders/mine", {
    method: body === undefined ? "GET" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as NextRequest;
}

const BUILDER = {
  id: "builder-1",
  profileId: "profile-1",
  businessName: "CoastMesh Works",
  suburb: "Noraville",
  website: null,
  description: "Boards, antennas, range tests and repair terms for local mesh nodes.",
  status: "approved",
  products: [],
};

describe("/api/v1/store/builders/mine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null });
    mockBuilderFindUnique.mockResolvedValue(BUILDER);
    mockBuilderUpdate.mockResolvedValue({ ...BUILDER });
  });

  it("returns the member's builder record", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.builder.businessName).toBe("CoastMesh Works");
  });

  it("returns a null builder when the member has not applied", async () => {
    mockBuilderFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.builder).toBeNull();
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("edits details and clears the website with null", async () => {
    const res = await PATCH(makeRequest({ website: null, suburb: "Norah Head" }), {
      params: {},
    });
    expect(res.status).toBe(200);
    expect(mockBuilderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ website: null, suburb: "Norah Head" }),
      })
    );
  });

  it("resubmits a rejected application on edit", async () => {
    mockBuilderFindUnique.mockResolvedValue({ ...BUILDER, status: "rejected" });
    const res = await PATCH(makeRequest({ description: BUILDER.description }), { params: {} });
    expect(res.status).toBe(200);
    expect(mockBuilderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "pending", reviewedAt: null }),
      })
    );
  });

  it("blocks edits while suspended", async () => {
    mockBuilderFindUnique.mockResolvedValue({ ...BUILDER, status: "suspended" });
    const res = await PATCH(makeRequest({ suburb: "x" }), { params: {} });
    expect(res.status).toBe(403);
    expect(mockBuilderUpdate).not.toHaveBeenCalled();
  });

  it("rejects a blocked website link", async () => {
    const res = await PATCH(makeRequest({ website: "https://bit.ly/abc" }), { params: {} });
    expect(res.status).toBe(400);
  });
});
