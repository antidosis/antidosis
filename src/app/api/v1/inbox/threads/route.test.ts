import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockProfileFindUnique = vi.fn();
const mockProfileFindMany = vi.fn();
const mockNeedMessageFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
      findMany: (...args: unknown[]) => mockProfileFindMany(...args),
    },
    needMessage: {
      findMany: (...args: unknown[]) => mockNeedMessageFindMany(...args),
    },
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const ME = "me-profile";
const OTHER = "other-profile";

function message(overrides: Record<string, unknown>) {
  return {
    id: Math.random().toString(36).slice(2),
    content: "hello",
    createdAt: new Date("2026-11-20T10:00:00Z"),
    isRead: true,
    senderId: OTHER,
    needId: "need-1",
    need: { id: "need-1", title: "Fix fence", postedAs: "personal", posterId: ME, status: "open" },
    acceptance: { userId: OTHER },
    ...overrides,
  };
}

describe("GET /api/v1/inbox/threads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "t@example.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });
    mockProfileFindUnique.mockResolvedValue({ id: ME });
    mockProfileFindMany.mockResolvedValue([{ id: OTHER, fullName: "Sam", avatarUrl: null }]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(new Request("http://localhost/api/v1/inbox/threads") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the profile is missing", async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/v1/inbox/threads") as never);
    expect(res.status).toBe(404);
  });

  it("groups messages into one thread per need and counterparty", async () => {
    mockNeedMessageFindMany.mockResolvedValue([
      message({ content: "newest", createdAt: new Date("2026-11-22T10:00:00Z"), isRead: false }),
      message({ content: "older", createdAt: new Date("2026-11-21T10:00:00Z"), isRead: false }),
      message({
        content: "other need",
        needId: "need-2",
        need: {
          id: "need-2",
          title: "Business clean",
          postedAs: "business",
          posterId: ME,
          status: "open",
        },
        createdAt: new Date("2026-11-20T10:00:00Z"),
      }),
    ]);

    const res = await GET(new Request("http://localhost/api/v1/inbox/threads") as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.threads).toHaveLength(2);
    // Sorted by last message, newest first
    expect(body.threads[0].needId).toBe("need-1");
    expect(body.threads[0].lastMessage.content).toBe("newest");
    expect(body.threads[0].unreadCount).toBe(2);
    expect(body.threads[0].postedAs).toBe("personal");
    expect(body.threads[0].counterparty.fullName).toBe("Sam");
    expect(body.threads[1].postedAs).toBe("business");
    expect(body.threads[1].unreadCount).toBe(0);
  });

  it("resolves the counterparty for messages the member sent", async () => {
    mockNeedMessageFindMany.mockResolvedValue([
      message({
        senderId: ME,
        content: "my reply",
        createdAt: new Date("2026-11-22T10:00:00Z"),
      }),
    ]);

    const res = await GET(new Request("http://localhost/api/v1/inbox/threads") as never);
    const body = await res.json();

    expect(body.threads).toHaveLength(1);
    expect(body.threads[0].counterparty.id).toBe(OTHER);
    expect(body.threads[0].lastMessage.fromMe).toBe(true);
    expect(body.threads[0].unreadCount).toBe(0);
  });

  it("skips broadcast messages with no counterparty", async () => {
    mockNeedMessageFindMany.mockResolvedValue([message({ senderId: ME, acceptance: null })]);

    const res = await GET(new Request("http://localhost/api/v1/inbox/threads") as never);
    const body = await res.json();

    expect(body.threads).toHaveLength(0);
  });

  it("queries only messages involving the member", async () => {
    mockNeedMessageFindMany.mockResolvedValue([]);
    await GET(new Request("http://localhost/api/v1/inbox/threads") as never);

    const where = mockNeedMessageFindMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([{ need: { posterId: ME } }, { senderId: ME }]);
  });
});
