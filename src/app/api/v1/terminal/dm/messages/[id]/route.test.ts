import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE } from "./route";

// ─── Prisma mocks ───
const mockProfileFindUnique = vi.fn();
const mockDirectMessageFindUnique = vi.fn();
const mockDirectMessageUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
    directMessage: {
      findUnique: (...args: unknown[]) => mockDirectMessageFindUnique(...args),
      update: (...args: unknown[]) => mockDirectMessageUpdate(...args),
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

// ─── Admin mock ───
const mockIsAdminEmail = vi.fn();

vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => mockIsAdminEmail(email),
}));

// ─── Helpers ───
function makeRequest(url: string): NextRequest {
  return new Request(url, { method: "DELETE" }) as NextRequest;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

describe("DELETE /api/v1/terminal/dm/messages/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdminEmail.mockReturnValue(false);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth error") });

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when message not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", email: "test@example.com" });
    mockDirectMessageFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Message not found");
  });

  it("returns 403 when not sender or admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", email: "test@example.com" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-2",
      deletedAt: null,
    });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("allows sender to delete", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", email: "test@example.com" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockIsAdminEmail.mockReturnValue(false);
    mockDirectMessageUpdate.mockResolvedValue({});

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockDirectMessageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deletedAt: expect.any(Date) },
      })
    );
  });

  it("allows admin to delete", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "admin@example.com" }) },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-admin", email: "admin@example.com" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockIsAdminEmail.mockReturnValue(true);
    mockDirectMessageUpdate.mockResolvedValue({});

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({ data: { user: makeAuthUser() }, error: null });
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1", email: "test@example.com" });
    mockDirectMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockIsAdminEmail.mockReturnValue(false);
    mockDirectMessageUpdate.mockResolvedValue({});

    const res = await DELETE(makeRequest("http://localhost/api/v1/terminal/dm/messages/msg-1"), {
      params: { id: "msg-1" },
    });

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
