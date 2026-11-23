import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const mockGetUser = vi.fn();
const mockParticipation = vi.fn();
const mockRateLimit = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();
const mockNotify = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));
vi.mock("@/lib/participation", () => ({
  requireVerifiedParticipation: (...args: unknown[]) => mockParticipation(...args),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "test",
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contract: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));
vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockNotify(...args),
}));

const token = "a".repeat(43);
const context = { params: { token } };
const future = new Date(Date.now() + 60_000);
const invitation = {
  id: "contract-1",
  kind: "direct",
  title: "Private design work",
  status: "draft",
  partyAId: "profile-a",
  partyBId: null,
  inviteEmail: "person@example.com",
  inviteExpiresAt: future,
  partyA: { fullName: "Alex", avatarUrl: null },
};

function request(method = "POST") {
  return new Request(`http://localhost/api/v1/contracts/invite/${token}`, {
    method,
  }) as NextRequest;
}

describe("direct contract invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-b",
          email: "person@example.com",
          email_confirmed_at: "2026-01-01",
        },
      },
    });
    mockParticipation.mockResolvedValue({ ok: true, profileId: "profile-b" });
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockFindUnique.mockResolvedValue(invitation);
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockNotify.mockResolvedValue(undefined);
  });

  it("previews only minimal public invitation details", async () => {
    const response = await GET(request("GET"), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.invitation).toEqual({
      title: "Private design work",
      inviter: { fullName: "Alex", avatarUrl: null },
      expiresAt: future.toISOString(),
    });
    expect(JSON.stringify(body)).not.toContain("person@example.com");
    expect(JSON.stringify(body)).not.toContain("profile-a");
  });

  it("rejects an expired invitation", async () => {
    mockFindUnique.mockResolvedValue({ ...invitation, inviteExpiresAt: new Date(Date.now() - 1) });
    const response = await GET(request("GET"), context);
    expect(response.status).toBe(404);
  });

  it("atomically claims an invitation and consumes its token and email", async () => {
    const response = await POST(request(), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.contractId).toBe("contract-1");
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract-1",
        partyBId: null,
        inviteTokenHash: expect.any(String),
        status: "draft",
      },
      data: {
        partyBId: "profile-b",
        claimedAt: expect.any(Date),
        inviteTokenHash: null,
        inviteEmail: null,
      },
    });
    expect(mockNotify).toHaveBeenCalled();
  });

  it("rejects a different email when the invitation is restricted", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-b", email: "other@example.com", email_confirmed_at: "2026-01-01" },
      },
    });
    const response = await POST(request(), context);
    expect(response.status).toBe(403);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects self-acceptance", async () => {
    mockParticipation.mockResolvedValue({ ok: true, profileId: "profile-a" });
    const response = await POST(request(), context);
    expect(response.status).toBe(400);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("prevents replay and concurrent double claims", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const response = await POST(request(), context);
    expect(response.status).toBe(409);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("requires verified mobile participation", async () => {
    mockParticipation.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Mobile required" }, { status: 403 }),
    });
    const response = await POST(request(), context);
    expect(response.status).toBe(403);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
