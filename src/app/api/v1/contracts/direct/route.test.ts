import { type NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockGetUser = vi.fn();
const mockParticipation = vi.fn();
const mockRateLimit = vi.fn();
const mockCreate = vi.fn();

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
  prisma: { contract: { create: (...args: unknown[]) => mockCreate(...args) } },
}));

function request(body: unknown) {
  const req = new Request("http://localhost/api/v1/contracts/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL("http://localhost/api/v1/contracts/direct"),
  });
  return req;
}

const valid = {
  title: "Website for local café",
  description: "A five-page website with copy and launch support.",
  terms: "50% deposit; balance on completion",
  paymentAmount: 1200,
  inviteEmail: "Person@Example.com",
};

describe("POST /api/v1/contracts/direct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01" } },
    });
    mockParticipation.mockResolvedValue({ ok: true, profileId: "profile-1" });
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockCreate.mockResolvedValue({ id: "contract-1", title: valid.title, status: "draft" });
  });

  it("creates a direct agreement with a hashed expiring invitation", async () => {
    const response = await POST(request(valid));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.inviteUrl).toMatch(/^http:\/\/localhost\/contracts\/join\/[\w-]+$/);
    const data = mockCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({
      kind: "direct",
      partyAId: "profile-1",
      partyATerms: valid.terms,
      considerationType: "money",
      considerationValue: 1200,
      inviteEmail: "person@example.com",
      status: "draft",
    });
    expect(data.inviteTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.inviteExpiresAt).toBeInstanceOf(Date);
    expect(data.inviteTokenHash).not.toEqual(body.inviteUrl.split("/").pop());
  });

  it("records non-cash exchanges without inventing a zero-dollar payment", async () => {
    await POST(request({ ...valid, paymentAmount: undefined, inviteEmail: undefined }));
    expect(mockCreate.mock.calls[0][0].data).toMatchObject({
      considerationType: "direct",
      considerationValue: null,
      inviteEmail: null,
    });
  });

  it("rejects invalid terms before touching the database", async () => {
    const response = await POST(request({ ...valid, terms: "" }));
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("requires verified participation", async () => {
    mockParticipation.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Mobile required" }, { status: 403 }),
    });
    const response = await POST(request(valid));
    expect(response.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(request(valid));
    expect(response.status).toBe(401);
  });
});
