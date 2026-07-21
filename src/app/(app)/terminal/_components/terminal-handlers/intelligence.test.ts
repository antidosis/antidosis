import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleAsk,
  handleStatus,
  handleTutorial,
  handleTheme,
  handleVoice,
  handleSettings,
} from "./intelligence";
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
      xp: 150,
      badges: ["🌱 Seedling"],
      streakDays: 3,
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

describe("intelligence handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe("handleAsk", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      global.fetch = vi.fn();
    });

    it("requires question", async () => {
      const ctx = makeCtx();
      await handleAsk(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /ask <question>", "error");
    });

    it("fetches context and responds", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [],
          needs: [],
          acceptances: [],
          notifications: [],
          reviews: [],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["how do I post a need?"] });
      await handleAsk(ctx);
      expect(global.fetch).toHaveBeenCalledTimes(5);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Agent"), "info");
    });

    it("handles API errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["how?"] });
      await handleAsk(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Agent failed"), "error");
    });

    it("routes explicit commands through intent parser", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [],
          needs: [],
          acceptances: [],
          notifications: [],
          reviews: [],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["/help"] });
      await handleAsk(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Agent"), "info");
      const call = vi.mocked(ctx.addSys).mock.calls[0][0] as string;
      expect(call).toContain("here to help");
    });

    it("routes 'what should I do?' to pending actions", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [
            {
              id: "c1",
              status: "pending_terms",
              partyAId: "user-1",
              partyASigned: false,
              partyBSigned: true,
              need: { title: "Garden" },
            },
          ],
          needs: [],
          acceptances: [],
          notifications: [{ read: false }],
          reviews: [],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["what should i do?"] });
      await handleAsk(ctx);
      const call = vi.mocked(ctx.addSys).mock.calls[0][0] as string;
      expect(call).toContain("Here's what needs your attention");
      expect(call).toContain("Garden");
      expect(call).toContain("unread notification");
    });

    it("shows pending reviews when contracts are completed", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [
            { id: "c1", status: "completed", partyAId: "user-1", need: { title: "Garden" } },
          ],
          needs: [],
          acceptances: [],
          notifications: [],
          reviews: [],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["what should i do?"] });
      await handleAsk(ctx);
      const call = vi.mocked(ctx.addSys).mock.calls[0][0] as string;
      expect(call).toContain("review pending");
      expect(call).toContain("Garden");
    });

    it("shows 'all caught up' when no pending actions", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [],
          needs: [],
          acceptances: [],
          notifications: [],
          reviews: [],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["what should i do?"] });
      await handleAsk(ctx);
      const call = vi.mocked(ctx.addSys).mock.calls[0][0] as string;
      expect(call).toContain("all caught up");
    });

    it("routes 'sign contract' intent with contextual data", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [
            {
              id: "c1",
              status: "pending_terms",
              partyAId: "user-1",
              partyASigned: false,
              partyBSigned: true,
              need: { title: "Garden" },
            },
          ],
          needs: [],
          acceptances: [],
          notifications: [],
          reviews: [],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["/sign my contract"] });
      await handleAsk(ctx);
      const call = vi.mocked(ctx.addSys).mock.calls[0][0] as string;
      expect(call).toContain("Signing a Contract");
      expect(call).toContain("Garden");
    });
  });

  describe("handleStatus", () => {
    it("shows status for level 1", async () => {
      const ctx = makeCtx({ session: { ...makeCtx().session, xp: 50 } });
      await handleStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Level 1"), "info");
    });

    it("shows status for higher level", async () => {
      const ctx = makeCtx({ session: { ...makeCtx().session, xp: 350 } });
      await handleStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Level 3"), "info");
    });

    it("shows badges when present", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          xp: 150,
          badges: ["🌱 Seedling", "🤝 Dealmaker"],
        },
      });
      await handleStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("🌱 Seedling"), "info");
    });

    it("shows encouragement when no badges", async () => {
      const ctx = makeCtx({
        session: { ...makeCtx().session, xp: 50, badges: [] },
      });
      await handleStatus(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("None yet"), "info");
    });
  });

  describe("handleTutorial", () => {
    it("starts tutorial wizard", async () => {
      const ctx = makeCtx();
      await handleTutorial(ctx);
      expect(ctx.setWizard).toHaveBeenCalled();
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Welcome"), "info");
    });
  });

  describe("handleTheme", () => {
    it("shows usage for invalid theme", async () => {
      const ctx = makeCtx({ args: ["invalid"] });
      await handleTheme(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /theme"), "error");
    });

    it("shows usage when no theme", async () => {
      const ctx = makeCtx();
      await handleTheme(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /theme"), "error");
    });

    it("changes theme successfully", async () => {
      const ctx = makeCtx({ args: ["cyberpunk"] });
      await handleTheme(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ theme: "cyberpunk" }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith('✅ Theme changed to "cyberpunk".', "success");
    });

    it("accepts matrix theme", async () => {
      const ctx = makeCtx({ args: ["matrix"] });
      await handleTheme(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ theme: "matrix" }),
        })
      );
    });

    it("accepts ocean theme", async () => {
      const ctx = makeCtx({ args: ["ocean"] });
      await handleTheme(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ theme: "ocean" }),
        })
      );
    });

    it("accepts minimal theme", async () => {
      const ctx = makeCtx({ args: ["minimal"] });
      await handleTheme(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ theme: "minimal" }),
        })
      );
    });
  });

  describe("handleSettings", () => {
    it("shows current settings", async () => {
      const ctx = makeCtx();
      await handleSettings(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Settings"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("default"), "info");
    });

    it("shows compact mode on", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          settings: { ...makeCtx().session.settings, compactMode: true },
        },
      });
      await handleSettings(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("On"), "info");
    });

    it("shows voice enabled", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          settings: { ...makeCtx().session.settings, voiceEnabled: true },
        },
      });
      await handleSettings(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("On"), "info");
    });
  });

  describe("handleVoice", () => {
    it("toggles voice on", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          settings: { ...makeCtx().session.settings, voiceEnabled: false },
        },
      });
      await handleVoice(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ voiceEnabled: true }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("enabled"), "success");
    });

    it("toggles voice off", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          settings: { ...makeCtx().session.settings, voiceEnabled: true },
        },
      });
      await handleVoice(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ voiceEnabled: false }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("disabled"), "success");
    });
  });
});
