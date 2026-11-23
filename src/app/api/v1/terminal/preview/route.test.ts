import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const mockChannelFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    terminalChannel: { findMany: (...a: unknown[]) => mockChannelFindMany(...a) },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("GET /api/v1/terminal/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns channels with last message and 30d activity, excluding staff", async () => {
    mockChannelFindMany.mockResolvedValue([
      {
        id: "c1",
        name: "general",
        slug: "general",
        description: "The main channel",
        _count: { messages: 42 },
        messages: [
          {
            content: "anyone near Gosford?",
            createdAt: new Date("2026-11-23T10:00:00Z"),
            sender: { fullName: "Martin" },
          },
        ],
      },
      {
        id: "c2",
        name: "quiet",
        slug: "quiet",
        description: null,
        _count: { messages: 0 },
        messages: [],
      },
    ]);

    const res = await GET(new Request("http://localhost/api/v1/terminal/preview") as never);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(mockChannelFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: { not: "staff" } } })
    );
    expect(body.channels).toHaveLength(2);
    expect(body.channels[0]).toMatchObject({
      name: "general",
      activity30d: 42,
      lastMessage: { snippet: "anyone near Gosford?", senderName: "Martin" },
    });
    expect(body.channels[1].lastMessage).toBeNull();
  });

  it("truncates long message snippets to 120 chars", async () => {
    mockChannelFindMany.mockResolvedValue([
      {
        id: "c1",
        name: "general",
        slug: "general",
        description: null,
        _count: { messages: 1 },
        messages: [{ content: "x".repeat(300), createdAt: new Date(), sender: { fullName: null } }],
      },
    ]);
    const res = await GET(new Request("http://localhost/api/v1/terminal/preview") as never);
    const body = await res.json();
    expect(body.channels[0].lastMessage.snippet).toHaveLength(120);
  });
});
