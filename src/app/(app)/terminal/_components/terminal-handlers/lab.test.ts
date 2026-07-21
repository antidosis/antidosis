import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleLab,
  handleLabDraft,
  handleLabDrafts,
  handleLabPost,
  handleLabNote,
  handleLabNotes,
  handleLabWant,
  handleLabWants,
  handleLabScript,
  handleLabScripts,
  handleLabRun,
  handleLabClear,
} from "./lab";
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

describe("lab handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleLab", () => {
    it("shows lab help", async () => {
      const ctx = makeCtx();
      await handleLab(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Personal Lab"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("/lab draft"), "info");
    });
  });

  describe("handleLabDraft", () => {
    it("shows usage when no title", async () => {
      const ctx = makeCtx();
      await handleLabDraft(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /lab draft <title>", "error");
    });

    it("saves draft", async () => {
      const ctx = makeCtx({ args: ["Fix roof idea"] });
      await handleLabDraft(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: expect.objectContaining({
            drafts: expect.arrayContaining([expect.objectContaining({ title: "Fix roof idea" })]),
          }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Draft saved"), "success");
    });
  });

  describe("handleLabDrafts", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleLabDrafts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No drafts yet"), "info");
    });

    it("lists drafts", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lab: {
            ...makeCtx().session.lab,
            drafts: [{ title: "Draft 1", createdAt: "2026-05-25T00:00:00Z" }],
          },
        },
      });
      await handleLabDrafts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Draft 1"), "info");
    });
  });

  describe("handleLabPost", () => {
    it("errors for invalid index", async () => {
      const ctx = makeCtx({ args: ["5"] });
      await handleLabPost(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No draft #5"), "error");
    });

    it("starts post wizard from draft", async () => {
      const ctx = makeCtx({
        args: ["1"],
        session: {
          ...makeCtx().session,
          lab: {
            ...makeCtx().session.lab,
            drafts: [{ title: "Draft 1", createdAt: "2026-05-25T00:00:00Z" }],
          },
        },
      });
      await handleLabPost(ctx);
      expect(ctx.setWizard).toHaveBeenCalled();
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Need Creator"), "info");
    });

    it("errors for non-numeric index", async () => {
      const ctx = makeCtx({ args: ["abc"] });
      await handleLabPost(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No draft #abc"), "error");
    });
  });

  describe("handleLabNote", () => {
    it("shows usage when no text", async () => {
      const ctx = makeCtx();
      await handleLabNote(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /lab note <text>", "error");
    });

    it("saves note", async () => {
      const ctx = makeCtx({ args: ["Remember to call Bob"] });
      await handleLabNote(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: expect.objectContaining({
            notes: expect.arrayContaining([
              expect.objectContaining({ text: "Remember to call Bob" }),
            ]),
          }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Note saved"), "success");
    });
  });

  describe("handleLabNotes", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleLabNotes(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No notes yet.", "info");
    });

    it("lists notes", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lab: {
            ...makeCtx().session.lab,
            notes: [{ text: "Note 1", createdAt: "2026-05-25T00:00:00Z" }],
          },
        },
      });
      await handleLabNotes(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Note 1"), "info");
    });
  });

  describe("handleLabWant", () => {
    it("shows usage when no skill", async () => {
      const ctx = makeCtx();
      await handleLabWant(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /lab want <skill>", "error");
    });

    it("adds want", async () => {
      const ctx = makeCtx({ args: ["plumbing"] });
      await handleLabWant(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: expect.objectContaining({ wants: ["plumbing"] }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('"plumbing" added'),
        "success"
      );
    });

    it("rejects duplicate want", async () => {
      const ctx = makeCtx({
        args: ["plumbing"],
        session: {
          ...makeCtx().session,
          lab: { ...makeCtx().session.lab, wants: ["plumbing"] },
        },
      });
      await handleLabWant(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("already on your want-list"),
        "info"
      );
    });
  });

  describe("handleLabWants", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleLabWants(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No wants saved yet.", "info");
    });

    it("lists wants", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lab: { ...makeCtx().session.lab, wants: ["plumbing", "carpentry"] },
        },
      });
      await handleLabWants(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("plumbing"), "info");
    });
  });

  describe("handleLabScript", () => {
    it("shows usage when missing args", async () => {
      const ctx = makeCtx({ args: ["daily"] });
      await handleLabScript(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /lab script"),
        "error"
      );
    });

    it("saves script", async () => {
      const ctx = makeCtx({ args: ["daily", "whoami; stats"] });
      await handleLabScript(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: expect.objectContaining({
            scripts: { daily: ["whoami", "stats"] },
          }),
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('Script "daily" saved'),
        "success"
      );
    });

    it("strips surrounding quotes", async () => {
      const ctx = makeCtx({ args: ["daily", '"whoami; stats"'] });
      await handleLabScript(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: expect.objectContaining({
            scripts: { daily: ["whoami", "stats"] },
          }),
        })
      );
    });

    it("filters empty commands", async () => {
      const ctx = makeCtx({ args: ["daily", "whoami;; stats; "] });
      await handleLabScript(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: expect.objectContaining({
            scripts: { daily: ["whoami", "stats"] },
          }),
        })
      );
    });
  });

  describe("handleLabScripts", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx();
      await handleLabScripts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No scripts saved yet.", "info");
    });

    it("lists scripts", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lab: {
            ...makeCtx().session.lab,
            scripts: { daily: ["whoami", "stats"], weekly: ["needs"] },
          },
        },
      });
      await handleLabScripts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("daily: whoami; stats"),
        "info"
      );
    });
  });

  describe("handleLabRun", () => {
    it("shows usage when no name", async () => {
      const ctx = makeCtx();
      await handleLabRun(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /lab run <scriptName>", "error");
    });

    it("shows script not found", async () => {
      const ctx = makeCtx({ args: ["missing"] });
      await handleLabRun(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('Script "missing" not found'),
        "error"
      );
    });

    it("shows script commands", async () => {
      const ctx = makeCtx({
        args: ["daily"],
        session: {
          ...makeCtx().session,
          lab: {
            ...makeCtx().session.lab,
            scripts: { daily: ["whoami", "stats"] },
          },
        },
      });
      await handleLabRun(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("whoami"), "info");
    });
  });

  describe("handleLabClear", () => {
    it("clears all lab data", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lab: {
            drafts: [{ title: "Draft", createdAt: "2024-01-01T00:00:00Z" }],
            notes: [{ text: "Note", createdAt: "2024-01-01T00:00:00Z" }],
            wants: ["plumbing"],
            scripts: { daily: ["whoami"] },
            folders: ["folder1"],
          },
        },
      });
      await handleLabClear(ctx);
      expect(ctx.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lab: { drafts: [], notes: [], wants: [], scripts: {}, folders: [] },
        })
      );
      expect(ctx.addSys).toHaveBeenCalledWith("🧪 Lab cleared.", "success");
    });
  });
});
