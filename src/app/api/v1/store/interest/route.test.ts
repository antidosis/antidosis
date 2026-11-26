import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

const mockUpsert = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockGetUser = vi.fn();
const mockRateLimit = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    meshInterest: { upsert: (...args: unknown[]) => mockUpsert(...args) },
    profile: { findUnique: (...args: unknown[]) => mockProfileFindUnique(...args) },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getRateLimitIdentifier: () => "ip:test",
}));

vi.mock("@/lib/email", () => ({
  sendMeshInterestConfirmationEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/store/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/v1/store/interest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no session") });
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 1000 });
    mockUpsert.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("records interest and sends a confirmation without an account", async () => {
    const res = await POST(makeRequest({ kind: "node", email: "Buyer@Example.com" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email_kind: { email: "buyer@example.com", kind: "node" } },
      })
    );
    expect(mockSendEmail).toHaveBeenCalledWith("buyer@example.com", "node");
  });

  it("links the member profile when a session exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
    const res = await POST(makeRequest({ kind: "updates", email: "member@example.com" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ profileId: "profile-1" }),
      })
    );
  });

  it("silently accepts honeypot submissions without storing anything", async () => {
    const res = await POST(
      makeRequest({ kind: "node", email: "bot@example.com", company: "spammy" })
    );
    expect(res.status).toBe(201);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const res = await POST(makeRequest({ kind: "node", email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects an unknown kind", async () => {
    const res = await POST(makeRequest({ kind: "builder", email: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("rate limits repeat submissions", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 });
    const res = await POST(makeRequest({ kind: "node", email: "a@b.com" }));
    expect(res.status).toBe(429);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("still succeeds when the confirmation email fails", async () => {
    mockSendEmail.mockRejectedValue(new Error("resend down"));
    const res = await POST(makeRequest({ kind: "byo_device", email: "a@b.com" }));
    expect(res.status).toBe(201);
  });
});
