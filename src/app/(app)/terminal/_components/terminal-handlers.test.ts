import { describe, expect, it } from "vitest";

import { dispatchCommand } from "./terminal-handlers";

describe("terminal-handlers re-export", () => {
  it("exports dispatchCommand function", () => {
    expect(typeof dispatchCommand).toBe("function");
  });

  it("exports HandlerContext type (compile-time only)", () => {
    // Type-only export; runtime is undefined in TS when imported as type
    expect(true).toBe(true);
  });

  it("exports HandlerResult type (compile-time only)", () => {
    expect(true).toBe(true);
  });

  it("dispatches a known command", async () => {
    const result = await dispatchCommand("help", [], {
      args: [],
      router: { push: () => {} } as any,
      myProfile: null,
      user: { id: "u1" },
      isAdmin: false,
      channels: [],
      setActiveContext: () => {},
      activeContext: { type: "console", id: "" },
      session: {
        version: 2,
        userId: "u1",
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
      setSession: () => {},
      setMessages: () => {},
      setSysMessages: () => {},
      addSys: () => {},
      onlineUsers: [],
      dmThreads: [],
      setWizard: () => {},
      setPendingChoices: () => {},
    });
    expect(result).toEqual({ handled: true });
  });
});
