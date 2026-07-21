import { describe, expect, it, vi, beforeEach } from "vitest";

import { handleProClaim, handleProStatus, handleSubscribe } from "./pro";
import type { HandlerContext } from "./types";

function makeCtx(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    args: [],
    router: { push: vi.fn() } as any,
    myProfile: { id: "user-1", fullName: "Test", isPro: false } as any,
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
      xp: 100,
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

describe("pro handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    vi.stubGlobal("window", { open: vi.fn() });
  });

  describe("handleProClaim", () => {
    it("claims pro successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx();
      await handleProClaim(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Pro status claimed"),
        "success"
      );
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ xp: 200 }));
    });

    it("shows verification error for verified message", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("verified mobile required"));
      const ctx = makeCtx();
      await handleProClaim(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("verified mobile number"),
        "error"
      );
    });

    it("shows generic error for other failures", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("server down"));
      const ctx = makeCtx();
      await handleProClaim(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("server down", "error");
    });

    it("handles non-error rejection", async () => {
      vi.mocked(global.fetch).mockRejectedValue("string error");
      const ctx = makeCtx();
      await handleProClaim(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("string error", "error");
    });
  });

  describe("handleProStatus", () => {
    it("shows non-pro status", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", isPro: false } as any });
      await handleProStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("not a Pro member yet"),
        "info"
      );
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Enhanced visibility"),
        "info"
      );
    });

    it("shows pro status with directory listing", async () => {
      const ctx = makeCtx({
        myProfile: {
          id: "user-1",
          isPro: true,
          proSource: "monthly",
          showInDirectory: true,
        } as any,
      });
      await handleProStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Active Pro Member"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Listed"), "info");
    });

    it("shows pro status with hidden directory", async () => {
      const ctx = makeCtx({
        myProfile: {
          id: "user-1",
          isPro: true,
          proSource: "annual",
          showInDirectory: false,
        } as any,
      });
      await handleProStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Hidden"), "info");
    });

    it("shows free trial source", async () => {
      const ctx = makeCtx({
        myProfile: { id: "user-1", isPro: true, proSource: "Free Trial" } as any,
      });
      await handleProStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Free Trial"), "info");
    });
  });

  describe("handleSubscribe", () => {
    it("explains Pro is free and how to claim it", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", isPro: false } as any });
      await handleSubscribe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Pro is now FREE"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("/pro claim"), "info");
    });

    it("tells existing Pro members no billing is needed", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", isPro: true } as any });
      await handleSubscribe(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("free, forever"), "info");
    });

    it("never calls the billing API (parked)", async () => {
      const ctx = makeCtx();
      await handleSubscribe(ctx);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
