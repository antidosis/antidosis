import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import type * as socialAvatar from "@/lib/social-avatar";

import { POST } from "./route";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));

const mockProfileUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { profile: { update: (...a: unknown[]) => mockProfileUpdate(...a) } },
}));

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

const mockFetchOgImage = vi.fn();

const mockFetchImage = vi.fn();
vi.mock("@/lib/social-avatar", async (importOriginal) => {
  const actual = await importOriginal<typeof socialAvatar>();
  return {
    ...actual,
    fetchOgImage: (...a: unknown[]) => mockFetchOgImage(...a),
    fetchImage: (...a: unknown[]) => mockFetchImage(...a),
  };
});

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/v1/profiles/avatar-from-social", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function makeAuthUser(confirmed = true) {
  return {
    id: "user-1",
    email: "a@b.com",
    email_confirmed_at: confirmed ? "2026-01-01" : null,
  };
}

describe("POST /api/v1/profiles/avatar-from-social", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest({ url: "https://facebook.com/x" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when email is unverified", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser(false) }, error: null });
    const res = await POST(makeRequest({ url: "https://facebook.com/x" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 for a non-allowlisted URL without fetching anything", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const res = await POST(makeRequest({ url: "https://evil.io/x" }));
    expect(res.status).toBe(400);
    expect(mockFetchOgImage).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed body", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 422 with the platform error when no public picture is found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFetchOgImage.mockRejectedValue(new Error("No public profile picture found — private"));
    const res = await POST(makeRequest({ url: "https://instagram.com/private_account" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain("No public profile picture");
  });

  it("imports the image, stores it, persists avatarUrl, and returns the URL", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFetchOgImage.mockResolvedValue("https://cdn.fb.com/pic.jpg");
    mockFetchImage.mockResolvedValue({ buffer: new ArrayBuffer(8), ext: "jpg", bytes: 8 });
    mockUpload.mockResolvedValue({ data: { path: "avatars/user-1/abc.jpg" }, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.antidosis.com/avatars/user-1/abc.jpg" },
    });
    mockProfileUpdate.mockResolvedValue({ id: "p1" });

    const res = await POST(makeRequest({ url: "https://facebook.com/local.cafe" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://cdn.antidosis.com/avatars/user-1/abc.jpg");

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/user-1\/[a-f0-9-]+\.jpg$/),
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: "image/jpeg" })
    );
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        data: expect.objectContaining({
          avatarUrl: "https://cdn.antidosis.com/avatars/user-1/abc.jpg",
        }),
      })
    );
  });

  it("returns 500 when storage upload fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockFetchOgImage.mockResolvedValue("https://cdn.fb.com/pic.jpg");
    mockFetchImage.mockResolvedValue({ buffer: new ArrayBuffer(8), ext: "png", bytes: 8 });
    mockUpload.mockResolvedValue({ data: null, error: { message: "boom" } });

    const res = await POST(makeRequest({ url: "https://facebook.com/x" }));
    expect(res.status).toBe(500);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });
});
