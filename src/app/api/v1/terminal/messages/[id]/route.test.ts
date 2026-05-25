import { type NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DELETE } from "./route";

// ─── Prisma mocks ───
const mockTerminalMessageFindUnique = vi.fn();
const mockTerminalMessageUpdate = vi.fn();
const mockProfileFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    terminalMessage: {
      findUnique: (...args: unknown[]) => mockTerminalMessageFindUnique(...args),
      update: (...args: unknown[]) => mockTerminalMessageUpdate(...args),
    },
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
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

// ─── Logger mock ───
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Audit mock ───
vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn(),
  getClientInfo: vi.fn(),
}));

// ─── Helpers ───
function makeRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(url, options) as NextRequest;
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
    configurable: true,
  });
  return req;
}

function makeAuthUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-1",
    email: "test@example.com",
    ...overrides,
  };
}

function makeParams(id: string) {
  return { params: { id } };
}

describe("DELETE /api/v1/terminal/messages/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdminEmail.mockReturnValue(false);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth error"),
    });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when message not found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      email: "test@example.com",
    });
    mockTerminalMessageFindUnique.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Message not found");
  });

  it("returns 403 when user is not sender and not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-other",
      email: "other@example.com",
    });
    mockTerminalMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockIsAdminEmail.mockReturnValue(false);

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("allows sender to delete their own message", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      email: "test@example.com",
    });
    mockTerminalMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockTerminalMessageUpdate.mockResolvedValue({ id: "msg-1", deletedAt: new Date() });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockTerminalMessageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "msg-1" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      })
    );
  });

  it("allows admin to delete any message", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser({ email: "admin@example.com" }) },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-admin",
      email: "admin@example.com",
    });
    mockTerminalMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockIsAdminEmail.mockReturnValue(true);
    mockTerminalMessageUpdate.mockResolvedValue({ id: "msg-1", deletedAt: new Date() });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("includes x-request-id header", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: makeAuthUser() },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({
      id: "profile-1",
      email: "test@example.com",
    });
    mockTerminalMessageFindUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "profile-1",
      deletedAt: null,
    });
    mockTerminalMessageUpdate.mockResolvedValue({ id: "msg-1", deletedAt: new Date() });

    const res = await DELETE(
      makeRequest("http://localhost/api/v1/terminal/messages/msg-1"),
      makeParams("msg-1")
    );

    expect(res.headers.get("x-request-id")).toMatch(/^\w+-\w+$/);
  });
});
