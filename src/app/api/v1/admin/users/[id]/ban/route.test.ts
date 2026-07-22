import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireAdmin = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
  getClientInfo: () => ({ ip: "127.0.0.1", userAgent: "test" }),
}));

import { POST, DELETE } from "./route";

function makeRequest(body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/admin/users/profile-1/ban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

const params = { params: { id: "profile-1" } };

describe("POST /api/v1/admin/users/[id]/ban", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ authorized: true });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null, userId: "user-1" });
    mockProfileUpdate.mockResolvedValue({
      id: "profile-1",
      fullName: "Sam",
      bannedAt: new Date(),
      bannedReason: "scam reports",
    });
  });

  it("returns the admin response when not authorized", async () => {
    mockRequireAdmin.mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    });

    const res = await POST(makeRequest({ reason: "scam reports" }), params);
    expect(res.status).toBe(403);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("bans a profile with a reason and writes an audit entry", async () => {
    const res = await POST(makeRequest({ reason: "scam reports" }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.bannedAt).toBeTruthy();
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { bannedAt: expect.any(Date), bannedReason: "scam reports" },
      select: { id: true, fullName: true, bannedAt: true, bannedReason: true },
    });
  });

  it("returns 404 when the profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({}), params);
    expect(res.status).toBe(404);
  });

  it("returns 409 when the profile is already banned", async () => {
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      bannedAt: new Date(),
      userId: "user-1",
    });

    const res = await POST(makeRequest({}), params);
    expect(res.status).toBe(409);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/admin/users/[id]/ban", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ authorized: true });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      bannedAt: new Date(),
      userId: "user-1",
    });
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", fullName: "Sam", bannedAt: null });
  });

  it("lifts a ban", async () => {
    const res = await DELETE(makeRequest(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.bannedAt).toBeNull();
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { bannedAt: null, bannedReason: null },
      select: { id: true, fullName: true, bannedAt: true },
    });
  });

  it("returns 409 when the profile is not banned", async () => {
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", bannedAt: null, userId: "user-1" });

    const res = await DELETE(makeRequest(), params);
    expect(res.status).toBe(409);
  });
});
