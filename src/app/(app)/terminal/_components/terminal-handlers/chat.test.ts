import { describe, expect, it, vi, beforeEach } from "vitest";

import { handleChat, handleDm } from "./chat";
import type { HandlerContext } from "./types";

function makeCtx(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    args: [],
    router: { push: vi.fn() } as any,
    myProfile: null,
    user: { id: "user-1" },
    isAdmin: false,
    channels: [],
    setActiveContext: vi.fn(),
    activeContext: { type: "none" as any, id: "" },
    session: {
      version: 2,
      userId: "user-1",
      cwd: "/",
      wizard: null,
      env: {},
      aliases: {},
      macros: {},
      history: [],
      bookmarks: {},
      lab: { drafts: [], notes: [], wants: [], scripts: {}, folders: [] },
      xp: 0,
      badges: [],
      streakDays: 0,
      lastActiveDate: "2026-05-25",
      settings: {
        theme: "default",
        compactMode: false,
        notifyDm: true,
        notifyMention: true,
        showAmbientStatus: true,
        showTypingIndicator: true,
        voiceEnabled: false,
        vimMode: false,
        commandProgression: false,
      },
      lastViewed: {},
      lastReadAt: {},
    },
    setSession: vi.fn(),
    setMessages: vi.fn(),
    setSysMessages: vi.fn(),
    addSys: vi.fn(),
    onlineUsers: [],
    dmThreads: [],
    setWizard: vi.fn(),
    setPendingChoices: vi.fn(),
    cmdHistory: [],
    ...overrides,
  };
}

describe("handleChat", () => {
  it("switches to existing channel", async () => {
    const ctx = makeCtx({
      args: ["general"],
      channels: [{ id: "ch1", name: "general" }] as any,
    });
    await handleChat(ctx);
    expect(ctx.setActiveContext).toHaveBeenCalledWith({
      type: "channel",
      id: "ch1",
      name: "general",
    });
    expect(ctx.addSys).toHaveBeenCalledWith("Switched to #general", "success");
  });

  it("lists channels when no arg", async () => {
    const ctx = makeCtx({
      channels: [{ id: "ch1", name: "general" }] as any,
    });
    await handleChat(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("general"), "info");
  });

  it("errors when channel not found", async () => {
    const ctx = makeCtx({ args: ["missing"], channels: [] });
    await handleChat(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(
      expect.stringContaining('Channel "missing" not found'),
      "error"
    );
  });

  it("is case-insensitive", async () => {
    const ctx = makeCtx({
      args: ["GENERAL"],
      channels: [{ id: "ch1", name: "general" }] as any,
    });
    await handleChat(ctx);
    expect(ctx.setActiveContext).toHaveBeenCalledWith({
      type: "channel",
      id: "ch1",
      name: "general",
    });
  });
});

describe("handleDm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("shows usage when no recipient and no last dm", async () => {
    const ctx = makeCtx();
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /dm"), "info");
  });

  it("rejects messages over 2000 chars", async () => {
    const ctx = makeCtx({ args: ["Alice", "x".repeat(2001)] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(
      expect.stringContaining("under 2000 characters"),
      "error"
    );
  });

  it("errors when no users found", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ profiles: [] }),
    } as Response);
    const ctx = makeCtx({ args: ["Nobody"] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No users found"), "error");
  });

  it("errors on failed search response", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ profiles: [] }),
    } as Response);
    const ctx = makeCtx({ args: ["Nobody"] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No users found"), "error");
  });

  it("starts DM and sends message for single match", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profiles: [{ id: "p1", fullName: "Alice" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threadId: "t1" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
    const ctx = makeCtx({ args: ["Alice", "hello"] });
    await handleDm(ctx);
    expect(ctx.setActiveContext).toHaveBeenCalledWith({
      type: "dm",
      threadId: "t1",
      otherUserId: "p1",
      otherUserName: "Alice",
    });
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Sent DM"), "success");
  });

  it("starts DM without message for single match", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profiles: [{ id: "p1", fullName: "Alice" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threadId: "t1" }),
      } as Response);
    const ctx = makeCtx({ args: ["Alice"] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith(
      expect.stringContaining("Started DM with Alice"),
      "success"
    );
  });

  it("handles message send failure gracefully", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profiles: [{ id: "p1", fullName: "Alice" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threadId: "t1" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "blocked" }),
      } as Response);
    const ctx = makeCtx({ args: ["Alice", "hello"] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith("blocked", "error");
  });

  it("handles thread creation failure", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profiles: [{ id: "p1", fullName: "Alice" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "server error" }),
      } as Response);
    const ctx = makeCtx({ args: ["Alice", "hello"] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith("server error", "error");
  });

  it("shows choice prompt for multiple matches", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        profiles: [
          { id: "p1", fullName: "Alice", locationName: "Sydney" },
          { id: "p2", fullName: "Alicia", locationName: "Melbourne" },
        ],
      }),
    } as Response);
    const ctx = makeCtx({ args: ["Ali"] });
    await handleDm(ctx);
    expect(ctx.setPendingChoices).toHaveBeenCalled();
    expect(ctx.addSys).toHaveBeenCalledWith(
      expect.stringContaining("Multiple users found"),
      "info"
    );
  });

  it("strips @ prefix from recipient", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profiles: [{ id: "p1", fullName: "Alice" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threadId: "t1" }),
      } as Response);
    const ctx = makeCtx({ args: ["@Alice"] });
    await handleDm(ctx);
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining("q=alice"));
  });

  it("handles search exception", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error(""));
    const ctx = makeCtx({ args: ["Alice"] });
    await handleDm(ctx);
    expect(ctx.addSys).toHaveBeenCalledWith("Failed to search for user", "error");
  });
});
