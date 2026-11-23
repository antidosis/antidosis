import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockGetUser = vi.fn();
const mockActive = vi.fn();
const mockRateLimit = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));
vi.mock("@/lib/participation", () => ({
  requireActiveAccount: (...args: unknown[]) => mockActive(...args),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test",
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contract: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

function request() {
  const req = new Request("http://localhost/api/v1/contracts/c1/invite", {
    method: "POST",
  }) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL("http://localhost/api/v1/contracts/c1/invite"),
  });
  return req;
}

describe("POST /api/v1/contracts/[id]/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-a" } } });
    mockActive.mockResolvedValue({ ok: true, profileId: "profile-a" });
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockFindUnique.mockResolvedValue({
      id: "c1",
      kind: "direct",
      partyAId: "profile-a",
      partyBId: null,
      status: "draft",
    });
    mockUpdate.mockResolvedValue({ id: "c1" });
  });

  it("lets the creator replace an unused invitation", async () => {
    const response = await POST(request(), { params: { id: "c1" } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.inviteUrl).toContain("/contracts/join/");
    expect(mockUpdate.mock.calls[0][0].data.inviteTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockUpdate.mock.calls[0][0].data.inviteExpiresAt).toBeInstanceOf(Date);
  });

  it("rejects another member attempting to regenerate the link", async () => {
    mockActive.mockResolvedValue({ ok: true, profileId: "intruder" });
    const response = await POST(request(), { params: { id: "c1" } });
    expect(response.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not regenerate a claimed invitation", async () => {
    mockFindUnique.mockResolvedValue({
      id: "c1",
      kind: "direct",
      partyAId: "profile-a",
      partyBId: "profile-b",
      status: "draft",
    });
    const response = await POST(request(), { params: { id: "c1" } });
    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not regenerate a marketplace contract invitation", async () => {
    mockFindUnique.mockResolvedValue({
      id: "c1",
      kind: "exchange",
      partyAId: "profile-a",
      partyBId: null,
      status: "draft",
    });
    const response = await POST(request(), { params: { id: "c1" } });
    expect(response.status).toBe(400);
  });
});
