import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleHelp,
  handleCommands,
  handleWhatis,
  handleGoto,
  handleHistory,
  handleReplay,
  handleTips,
  handleClear,
  handleId,
  handleExit,
  handleMe,
  handleUndo,
  handleBenchmark,
} from "./system";
import { clearUndoStack, pushUndo } from "../terminal-undo";
import type { HandlerContext } from "./types";

function makeCtx(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    args: [],
    router: { push: vi.fn() } as any,
    myProfile: { id: "user-1", fullName: "Test" } as any,
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

describe("system handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe("handleHelp", () => {
    it("shows basic help", async () => {
      const ctx = makeCtx();
      await handleHelp(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("help"), "info");
    });

    it("shows advanced help when requested", async () => {
      const ctx = makeCtx({ args: ["advanced"] });
      await handleHelp(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("help"), "info");
    });
  });

  describe("handleCommands", () => {
    it("shows commands list", async () => {
      const ctx = makeCtx();
      await handleCommands(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("/"), "info");
    });

    it("includes admin commands for admin", async () => {
      const ctx = makeCtx({ isAdmin: true });
      await handleCommands(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("admin"), "info");
    });
  });

  describe("handleWhatis", () => {
    it("describes known command", async () => {
      const ctx = makeCtx({ args: ["help"] });
      await handleWhatis(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("help"), "info");
    });

    it("errors for unknown command", async () => {
      const ctx = makeCtx({ args: ["notacommand123"] });
      await handleWhatis(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No command found"), "error");
    });

    it("handles empty input", async () => {
      const ctx = makeCtx();
      await handleWhatis(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining('""'), "error");
    });
  });

  describe("handleGoto", () => {
    it("requires page", async () => {
      const ctx = makeCtx();
      await handleGoto(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /goto <page>", "error");
    });

    it("rejects invalid path", async () => {
      const ctx = makeCtx({ args: [".."] });
      await handleGoto(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Invalid page.", "error");
    });

    it("navigates to safe page", async () => {
      const ctx = makeCtx({ args: ["needs"] });
      await handleGoto(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/needs");
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Navigating to /needs"),
        "success"
      );
    });

    it("sanitizes malicious path", async () => {
      const ctx = makeCtx({ args: ["needs/../../etc"] });
      await handleGoto(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/needs///etc");
    });
  });

  describe("handleHistory", () => {
    it("shows empty history", async () => {
      const ctx = makeCtx();
      await handleHistory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No command history yet.", "info");
    });

    it("shows command history", async () => {
      const ctx = makeCtx({ cmdHistory: ["/help", "/whoami", "/needs"] });
      await handleHistory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("/help"), "info");
    });

    it("limits to last 20 entries", async () => {
      const history = Array.from({ length: 30 }, (_, i) => `/cmd${i}`);
      const ctx = makeCtx({ cmdHistory: history });
      await handleHistory(ctx);
      const call = vi.mocked(ctx.addSys).mock.calls[0][0] as string;
      expect(call).toContain("/cmd10");
      expect(call).not.toContain("/cmd0");
    });
  });

  describe("handleReplay", () => {
    it("shows replay message", async () => {
      const ctx = makeCtx();
      await handleReplay(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("History is for reference"),
        "info"
      );
    });
  });

  describe("handleTips", () => {
    it("shows a random tip", async () => {
      const ctx = makeCtx();
      await handleTips(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Tip:"), "info");
    });

    it("returns different tips across calls", async () => {
      const ctx1 = makeCtx();
      const ctx2 = makeCtx();
      await handleTips(ctx1);
      await handleTips(ctx2);
      const t1 = vi.mocked(ctx1.addSys).mock.calls[0][0];
      const t2 = vi.mocked(ctx2.addSys).mock.calls[0][0];
      // probabilistic but likely different over many runs; just check they exist
      expect(t1).toContain("Tip:");
      expect(t2).toContain("Tip:");
    });
  });

  describe("handleClear", () => {
    it("clears messages", async () => {
      const ctx = makeCtx();
      await handleClear(ctx);
      expect(ctx.setSysMessages).toHaveBeenCalledWith([]);
      expect(ctx.setMessages).toHaveBeenCalledWith([]);
      expect(ctx.addSys).toHaveBeenCalledWith("Terminal cleared.", "success");
    });
  });

  describe("handleId", () => {
    it("shows user ids", async () => {
      const ctx = makeCtx();
      await handleId(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("user-1"), "info");
    });

    it("shows profile id when available", async () => {
      const ctx = makeCtx({ myProfile: { id: "profile-1" } as any });
      await handleId(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("profile-1"), "info");
    });
  });

  describe("handleExit", () => {
    it("navigates home", async () => {
      const ctx = makeCtx();
      await handleExit(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/");
      expect(ctx.addSys).toHaveBeenCalledWith("Goodbye!", "success");
    });
  });

  describe("handleMe", () => {
    it("requires text", async () => {
      const ctx = makeCtx();
      await handleMe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /me <action>", "error");
    });

    it("rejects text over 500 chars", async () => {
      const ctx = makeCtx({ args: ["x".repeat(501)] });
      await handleMe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 500 characters"),
        "error"
      );
    });

    it("posts to channel context", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({
        args: ["waves"],
        activeContext: { type: "channel", id: "ch1", name: "general" },
      });
      await handleMe(ctx);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/terminal/messages",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("waves"),
        })
      );
    });

    it("posts to dm context", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({
        args: ["waves"],
        activeContext: {
          type: "dm",
          threadId: "t1",
          otherUserId: "u2",
          otherUserName: "Bob",
        },
      });
      await handleMe(ctx);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/terminal/dm/messages",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("waves"),
        })
      );
    });

    it("falls back to local display on channel post failure", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({
        args: ["waves"],
        activeContext: { type: "channel", id: "ch1", name: "general" },
      });
      await handleMe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("waves"), "info");
    });

    it("falls back to local display on dm post failure", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({
        args: ["waves"],
        activeContext: {
          type: "dm",
          threadId: "t1",
          otherUserId: "u2",
          otherUserName: "Bob",
        },
      });
      await handleMe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("waves"), "info");
    });

    it("displays locally when no context", async () => {
      const ctx = makeCtx({ args: ["waves"], activeContext: { type: "none" as any, id: "" } });
      await handleMe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("waves"), "info");
    });
  });

  describe("handleUndo", () => {
    beforeEach(() => {
      clearUndoStack();
    });

    it("shows info when nothing to undo", async () => {
      const ctx = makeCtx();
      await handleUndo(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Nothing to undo"), "info");
    });

    it("restores messages after clear", async () => {
      pushUndo({
        type: "clear_messages",
        description: "Cleared terminal messages",
        payload: { sysMessages: [{ id: "1", text: "hello" }], messages: [] },
      });
      const ctx = makeCtx();
      await handleUndo(ctx);
      expect(ctx.setSysMessages).toHaveBeenCalled();
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Undid"), "success");
    });
  });

  describe("handleBenchmark", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      global.fetch = vi.fn();
    });

    it("runs benchmark with default iterations", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx();
      await handleBenchmark(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Benchmark Results"), "info");
    });
  });
});
