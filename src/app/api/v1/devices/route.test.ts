import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST, DELETE } from "./route";

const mockUpsert = vi.fn();
const mockDeleteMany = vi.fn();
const mockProfileFindUnique = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    deviceToken: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeRequest(method: string, body?: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/v1/devices", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

const validToken = "fcm-token-0123456789abcdef";

describe("/api/v1/devices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" });
  });

  it("POST returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await POST(makeRequest("POST", { token: validToken, platform: "android" }));
    expect(res.status).toBe(401);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("POST returns 400 for an invalid payload", async () => {
    const res = await POST(makeRequest("POST", { token: "short", platform: "android" }));
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("POST upserts the token against the caller's profile", async () => {
    const res = await POST(makeRequest("POST", { token: validToken, platform: "ios" }));
    expect(res.status).toBe(201);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { token: validToken },
      create: { profileId: "profile-1", token: validToken, platform: "ios" },
      update: { profileId: "profile-1", platform: "ios" },
    });
  });

  it("DELETE removes only the caller's own token", async () => {
    const res = await DELETE(makeRequest("DELETE", { token: validToken }));
    expect(res.status).toBe(200);
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { token: validToken, profileId: "profile-1" },
    });
  });

  it("DELETE returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });
    const res = await DELETE(makeRequest("DELETE", { token: validToken }));
    expect(res.status).toBe(401);
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
});
