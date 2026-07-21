import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleLs,
  handleCd,
  handlePwd,
  handleCat,
  handleSetEnv,
  handleUnsetEnv,
  handleEnv,
  handleAlias,
  handleUnalias,
  handleMacro,
} from "./shell";
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

describe("shell handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe("handleLs", () => {
    it("lists root contents", async () => {
      const ctx = makeCtx();
      await handleLs(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("home/"), "info");
    });

    it("lists home contents", async () => {
      const ctx = makeCtx({ args: ["/home"] });
      await handleLs(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("needs/"), "info");
    });

    it("shows empty for unknown path", async () => {
      const ctx = makeCtx({ args: ["/unknown"] });
      await handleLs(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("empty"), "info");
    });

    it("uses cwd when no arg", async () => {
      const ctx = makeCtx({ session: { ...makeCtx().session, cwd: "/home" } });
      await handleLs(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("needs/"), "info");
    });

    it("routes needs/active to handleNeeds", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ needs: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["/home/needs/active"] });
      await handleLs(ctx);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("routes contracts/pending to handleContracts", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["/home/contracts/pending"] });
      await handleLs(ctx);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("handleCd", () => {
    it("changes to absolute path", async () => {
      const ctx = makeCtx({ args: ["/home"] });
      await handleCd(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ cwd: "/home" }));
    });

    it("changes to relative path", async () => {
      const ctx = makeCtx({ args: ["home"], session: { ...makeCtx().session, cwd: "/" } });
      await handleCd(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ cwd: "/home" }));
    });

    it("goes up with ..", async () => {
      const ctx = makeCtx({ args: [".."], session: { ...makeCtx().session, cwd: "/home/needs" } });
      await handleCd(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ cwd: "/home" }));
    });

    it("goes up with ../", async () => {
      const ctx = makeCtx({ args: ["../"], session: { ...makeCtx().session, cwd: "/home/needs" } });
      await handleCd(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ cwd: "/home" }));
    });

    it("defaults to / when no arg", async () => {
      const ctx = makeCtx();
      await handleCd(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ cwd: "/" }));
    });
  });

  describe("handlePwd", () => {
    it("shows current directory", async () => {
      const ctx = makeCtx({ session: { ...makeCtx().session, cwd: "/home/needs" } });
      await handlePwd(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("/home/needs"), "info");
    });
  });

  describe("handleCat", () => {
    it("shows usage when no path", async () => {
      const ctx = makeCtx();
      await handleCat(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /cat <path-or-id>", "error");
    });

    it("navigates to need for full uuid", async () => {
      const ctx = makeCtx({ args: ["a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"] });
      await handleCat(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/needs/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
    });

    it("shows info for non-uuid path", async () => {
      const ctx = makeCtx({ args: ["readme.txt"] });
      await handleCat(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("readme.txt"), "info");
    });

    it("shows info for non-hex path", async () => {
      const ctx = makeCtx({ args: ["readme.txt"] });
      await handleCat(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("readme.txt"), "info");
    });

    it("shows generic info for non-hex path", async () => {
      const ctx = makeCtx({ args: ["readme.txt"] });
      await handleCat(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("readme.txt"), "info");
    });
  });

  describe("handleSetEnv", () => {
    it("shows usage when no key", async () => {
      const ctx = makeCtx();
      await handleSetEnv(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /set <key> <value>", "error");
    });

    it("sets environment variable", async () => {
      const ctx = makeCtx({ args: ["API_URL", "https://api.example.com"] });
      await handleSetEnv(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ env: { API_URL: "https://api.example.com" } })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('API_URL = "https://api.example.com"'),
        "success"
      );
    });

    it("sets empty value", async () => {
      const ctx = makeCtx({ args: ["KEY"] });
      await handleSetEnv(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ env: { KEY: "" } }));
    });
  });

  describe("handleUnsetEnv", () => {
    it("shows usage when no key", async () => {
      const ctx = makeCtx();
      await handleUnsetEnv(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /unset <key>", "error");
    });

    it("removes environment variable", async () => {
      const ctx = makeCtx({
        args: ["API_URL"],
        session: { ...makeCtx().session, env: { API_URL: "x", OTHER: "y" } },
      });
      await handleUnsetEnv(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ env: { OTHER: "y" } }));
      expect(ctx.addSys).toHaveBeenCalledWith("✅ $API_URL removed.", "success");
    });

    it("handles missing key gracefully", async () => {
      const ctx = makeCtx({ args: ["MISSING"] });
      await handleUnsetEnv(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ env: {} }));
    });
  });

  describe("handleEnv", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleEnv(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No environment variables set.", "info");
    });

    it("lists environment variables", async () => {
      const ctx = makeCtx({
        session: { ...makeCtx().session, env: { KEY1: "val1", KEY2: "val2" } },
      });
      await handleEnv(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("KEY1"), "info");
    });
  });

  describe("handleAlias", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleAlias(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No aliases set.", "info");
    });

    it("lists aliases", async () => {
      const ctx = makeCtx({
        session: { ...makeCtx().session, aliases: { h: "help", w: "whoami" } },
      });
      await handleAlias(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("h → help"), "info");
    });

    it("creates alias", async () => {
      const ctx = makeCtx({ args: ["h", "help"] });
      await handleAlias(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ aliases: { h: "help" } })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Alias: /h → help"),
        "success"
      );
    });

    it("strips surrounding quotes", async () => {
      const ctx = makeCtx({ args: ["h", '"help"'] });
      await handleAlias(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ aliases: { h: "help" } })
      );
    });
  });

  describe("handleUnalias", () => {
    it("shows usage when no name", async () => {
      const ctx = makeCtx();
      await handleUnalias(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /unalias <name>", "error");
    });

    it("removes alias", async () => {
      const ctx = makeCtx({
        args: ["h"],
        session: { ...makeCtx().session, aliases: { h: "help" } },
      });
      await handleUnalias(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ aliases: {} }));
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Alias /h removed.", "success");
    });

    it("handles missing alias gracefully", async () => {
      const ctx = makeCtx({ args: ["missing"] });
      await handleUnalias(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(expect.objectContaining({ aliases: {} }));
    });
  });

  describe("handleMacro", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleMacro(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No macros set.", "info");
    });

    it("lists macros", async () => {
      const ctx = makeCtx({
        session: { ...makeCtx().session, macros: { daily: ["whoami", "stats"] } },
      });
      await handleMacro(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("daily → whoami; stats"),
        "info"
      );
    });

    it("creates macro", async () => {
      const ctx = makeCtx({ args: ["daily", "whoami; stats"] });
      await handleMacro(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ macros: { daily: ["whoami", "stats"] } })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Macro: /daily → whoami; stats"),
        "success"
      );
    });

    it("strips surrounding quotes", async () => {
      const ctx = makeCtx({ args: ["daily", '"whoami; stats"'] });
      await handleMacro(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ macros: { daily: ["whoami", "stats"] } })
      );
    });

    it("filters empty commands", async () => {
      const ctx = makeCtx({ args: ["daily", "whoami;; stats; "] });
      await handleMacro(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({ macros: { daily: ["whoami", "stats"] } })
      );
    });
  });
});
