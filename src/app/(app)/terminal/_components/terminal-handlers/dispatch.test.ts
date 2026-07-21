import { describe, expect, it, vi, beforeEach } from "vitest";

import { dispatchCommand } from "./dispatch";
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

describe("dispatchCommand", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it("returns handled:false for unknown command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("notacommand", [], ctx);
    expect(result).toEqual({ handled: false });
  });

  it("blocks admin-only commands for non-admins", async () => {
    const ctx = makeCtx({ isAdmin: false });
    await dispatchCommand("admin-stats", [], ctx);
    expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
  });

  it("allows admin commands for admins", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ totalUsers: 5 }),
    } as Response);
    const ctx = makeCtx({ isAdmin: true });
    const result = await dispatchCommand("admin-stats", [], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes chat command to handleChat", async () => {
    const ctx = makeCtx({ channels: [{ id: "ch1", name: "general" }] as any, args: ["general"] });
    const result = await dispatchCommand("chat", ["general"], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.setActiveContext).toHaveBeenCalled();
  });

  it("routes dm command with aliases", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profiles: [{ id: "p1", fullName: "Alice" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threadId: "t1" }),
      } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("msg", ["Alice", "hello"], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes help command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("help", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalled();
  });

  it("routes help alias 'h'", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("h", [], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes needs command", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ needs: [] }),
    } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("needs", [], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes post command to wizard", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("post", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.setWizard).toHaveBeenCalled();
  });

  it("routes whoami command", async () => {
    const ctx = makeCtx({ myProfile: { id: "user-1", fullName: "Test" } as any });
    const result = await dispatchCommand("whoami", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalled();
  });

  it("routes clear command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("clear", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.setSysMessages).toHaveBeenCalledWith([]);
    expect(ctx.setMessages).toHaveBeenCalledWith([]);
  });

  it("routes exit command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("exit", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.router.push).toHaveBeenCalledWith("/");
  });

  it("routes ls command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("ls", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalled();
  });

  it("routes ask command", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ contracts: [], needs: [], acceptances: [], notifications: [] }),
    } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("ask", ["how do I post?"], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes status command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("status", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalled();
  });

  it("routes friend command", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [{ id: "u2", fullName: "Bob" }] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("friend", ["Bob"], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes pro-claim command", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("pro-claim", [], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes ban command for admin", async () => {
    const ctx = makeCtx({ isAdmin: true });
    const result = await dispatchCommand("ban", ["user-2"], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalledWith(
      expect.stringContaining("not yet implemented"),
      "error"
    );
  });

  it("routes lab command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("lab", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalled();
  });

  it("routes cd command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("cd", ["home"], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.setSession).toHaveBeenCalled();
  });

  it("routes theme command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("theme", ["cyberpunk"], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.setSession).toHaveBeenCalled();
  });

  it("routes review command with no args and no completed deals", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ contracts: [], acceptances: [] }),
    } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("review", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No completed deals"), "info");
  });

  it("routes review command with no args starts wizard when deals exist", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        contracts: [
          { id: "c1", status: "completed", partyAId: "u1", partyBId: "u2", need: { title: "Fix" } },
        ],
        acceptances: [],
      }),
    } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("review", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.setWizard).toHaveBeenCalled();
  });

  it("routes search command", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ needs: [], users: [], pros: [] }),
    } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("search", ["plumber"], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes notifications command", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [] }),
    } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("notifications", [], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes readall command", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    const ctx = makeCtx();
    const result = await dispatchCommand("readall", [], ctx);
    expect(result).toEqual({ handled: true });
  });

  it("routes goto command", async () => {
    const ctx = makeCtx();
    const result = await dispatchCommand("goto", ["needs"], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.router.push).toHaveBeenCalledWith("/needs");
  });

  it("routes history command", async () => {
    const ctx = makeCtx({ cmdHistory: ["/help", "/whoami"] });
    const result = await dispatchCommand("history", [], ctx);
    expect(result).toEqual({ handled: true });
    expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("/help"), "info");
  });
});
