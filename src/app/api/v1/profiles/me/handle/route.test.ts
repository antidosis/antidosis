import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockProfileUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      update: (...args: unknown[]) => mockProfileUpdate(...args),
    },
  },
}));

// ─── Supabase mocks ───
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Helpers ───
function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as NextRequest;
}

function makeAuthUser() {
  return {
    id: "user-1",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    user_metadata: { full_name: "Test User" },
  };
}

function postHandle(handle: string) {
  return POST(
    makeRequest("http://localhost/api/v1/profiles/me/handle", {
      method: "POST",
      body: JSON.stringify({ handle }),
    })
  );
}

describe("POST /api/v1/profiles/me/handle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await postHandle("test_user");

    expect(res.status).toBe(401);
    expect(mockProfileFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the caller has no profile", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await postHandle("test_user");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it.each([
    ["too short", "ab"],
    ["too long", "a".repeat(21)],
    ["bad chars (hyphen)", "bad-handle"],
    ["bad chars (space)", "bad handle"],
    ["bad chars (emoji)", "héllo_world"],
    ["starts with a digit", "1abc"],
    ["starts with underscore", "_abc"],
  ])("returns 400 when handle is %s (%s)", async (_label, handle) => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });

    const res = await postHandle(handle);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(Array.isArray(body.error)).toBe(true);
    expect(mockProfileFindUnique).not.toHaveBeenCalled();
  });

  it("claims a handle and lowercases it", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", handle: null })
      .mockResolvedValueOnce(null);
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", handle: "test_user" });

    const res = await postHandle("Test_User");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.handle).toBe("test_user");
    expect(mockProfileFindUnique).toHaveBeenNthCalledWith(2, {
      where: { handle: "test_user" },
      select: { id: true },
    });
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { handle: "test_user", updatedAt: expect.any(Date) },
    });
  });

  it("returns 409 HANDLE_TAKEN when the handle is taken (exact)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", handle: null })
      .mockResolvedValueOnce({ id: "profile-2" });

    const res = await postHandle("taken_handle");
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe("HANDLE_TAKEN");
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns 409 HANDLE_TAKEN on a case-insensitive collision", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", handle: null })
      .mockResolvedValueOnce({ id: "profile-2" });

    const res = await postHandle("Taken_Handle");

    // The lookup uses the lowercased handle, so it collides with "taken_handle"
    expect(mockProfileFindUnique).toHaveBeenNthCalledWith(2, {
      where: { handle: "taken_handle" },
      select: { id: true },
    });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("HANDLE_TAKEN");
  });

  it("returns 409 HANDLE_LOCKED when the caller already has a handle", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", handle: "old_handle" });

    const res = await postHandle("new_handle");
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe("HANDLE_LOCKED");
    // No availability lookup or update needed once locked
    expect(mockProfileFindUnique).toHaveBeenCalledTimes(1);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("returns 409 HANDLE_TAKEN when the update hits a P2002 race", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", handle: null })
      .mockResolvedValueOnce(null);
    mockProfileUpdate.mockRejectedValue(
      Object.assign(new Error("Unique constraint"), { code: "P2002" })
    );

    const res = await postHandle("race_handle");
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe("HANDLE_TAKEN");
  });

  it("rethrows non-P2002 update errors as 500", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", handle: null })
      .mockResolvedValueOnce(null);
    mockProfileUpdate.mockRejectedValue(new Error("connection reset"));

    const res = await postHandle("some_handle");

    expect(res.status).toBe(500);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique
      .mockResolvedValueOnce({ id: "profile-1", handle: null })
      .mockResolvedValueOnce(null);
    mockProfileUpdate.mockResolvedValue({ id: "profile-1", handle: "test_user" });

    const res = await postHandle("test_user");

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
