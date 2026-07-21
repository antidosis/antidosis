import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  loadSession,
  saveSession,
  addXp,
  getLevel,
  checkBadges,
  refreshBadges,
  resolveAlias,
  resolveMacro,
  type TerminalSession,
} from "./terminal-session";

const defaultSession = {
  history: [],
  cwd: "/",
  env: {},
  aliases: {},
  macros: {},
  xp: 0,
  level: 1,
  badges: [],
  theme: "default",
};

const SESSION_KEY = "antidosis_terminal_session_v2";

function makeSession(overrides: Partial<TerminalSession> = {}): TerminalSession {
  const today = new Date().toISOString().split("T")[0];
  return {
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
    lastActiveDate: today,
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
    ...overrides,
  };
}

describe("terminal-session", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  describe("loadSession", () => {
    it("returns default session when no stored data", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const session = loadSession("user-1");
      expect(session.version).toBe(2);
      expect(session.userId).toBe("user-1");
      expect(session.cwd).toBe("/");
    });

    it("parses stored session", () => {
      const stored = makeSession({ xp: 100, cwd: "/home" });
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(stored));
      const session = loadSession("user-1");
      expect(session.xp).toBe(100);
      expect(session.cwd).toBe("/home");
    });

    it("returns default when version mismatch", () => {
      const stored = { version: 1, userId: "user-1", cwd: "/old" };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(stored));
      const session = loadSession("user-1");
      expect(session.cwd).toBe("/");
    });

    it("returns default when JSON parse fails", () => {
      vi.mocked(localStorage.getItem).mockReturnValue("not json");
      const session = loadSession("user-1");
      expect(session.cwd).toBe("/");
    });

    it("merges missing fields with defaults", () => {
      const stored = { version: 2, userId: "user-1", xp: 50 };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(stored));
      const session = loadSession("user-1");
      expect(session.xp).toBe(50);
      expect(session.cwd).toBe("/");
      expect(session.settings.theme).toBe("default");
    });

    it("uses correct storage key", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      loadSession("user-1");
      expect(localStorage.getItem).toHaveBeenCalledWith(`${SESSION_KEY}_user-1`);
    });
  });

  describe("saveSession", () => {
    it("saves session to localStorage", () => {
      const session = makeSession({ xp: 200 });
      saveSession(session);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `${SESSION_KEY}_user-1`,
        expect.stringContaining("200")
      );
    });

    it("handles storage errors gracefully", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("quota exceeded");
      });
      const session = makeSession();
      expect(() => saveSession(session)).not.toThrow();
    });
  });

  describe("addXp", () => {
    it("adds XP for known action", () => {
      const session = makeSession();
      const updated = addXp(session, "post_need");
      expect(updated.xp).toBe(50);
    });

    it("adds zero for unknown action", () => {
      const session = makeSession({ xp: 100 });
      const updated = addXp(session, "unknown_action" as any);
      expect(updated.xp).toBe(100);
    });

    it("maintains streak on same day", () => {
      const today = new Date().toISOString().split("T")[0];
      const session = makeSession({ streakDays: 5, lastActiveDate: today });
      const updated = addXp(session, "daily_login");
      expect(updated.streakDays).toBe(5);
    });

    it("increments streak from yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const session = makeSession({
        streakDays: 3,
        lastActiveDate: yesterday.toISOString().split("T")[0],
      });
      const updated = addXp(session, "daily_login");
      expect(updated.streakDays).toBe(4);
    });

    it("resets streak when gap > 1 day", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const session = makeSession({
        streakDays: 10,
        lastActiveDate: twoDaysAgo.toISOString().split("T")[0],
      });
      const updated = addXp(session, "daily_login");
      expect(updated.streakDays).toBe(1);
    });

    it("caps streak bonus at 7 days", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const session = makeSession({
        streakDays: 10,
        lastActiveDate: yesterday.toISOString().split("T")[0],
      });
      const updated = addXp(session, "daily_login");
      expect(updated.xp).toBe(24); // 10 + 7*2 = 24
    });

    it("does not add streak bonus for non-login actions", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const session = makeSession({
        streakDays: 3,
        lastActiveDate: yesterday.toISOString().split("T")[0],
      });
      const updated = addXp(session, "post_need");
      expect(updated.xp).toBe(50);
      expect(updated.streakDays).toBe(4);
    });
  });

  describe("getLevel", () => {
    it("returns level 1 for 0 XP", () => {
      const result = getLevel(0);
      expect(result.level).toBe(1);
      expect(result.title).toBe("Newcomer");
    });

    it("returns level 1 for 50 XP", () => {
      const result = getLevel(50);
      expect(result.level).toBe(1);
    });

    it("returns level 2 for 100 XP", () => {
      const result = getLevel(100);
      expect(result.level).toBe(2);
      expect(result.title).toBe("Seedling");
    });

    it("returns level 3 for 300 XP", () => {
      const result = getLevel(300);
      expect(result.level).toBe(3);
      expect(result.title).toBe("Trader");
    });

    it("returns level 20 for max XP", () => {
      const result = getLevel(20000);
      expect(result.level).toBe(20);
      expect(result.title).toBe("Omnipotent");
    });

    it("returns max level for XP above max threshold", () => {
      const result = getLevel(999999);
      expect(result.level).toBe(20);
      expect(result.title).toBe("Omnipotent");
    });

    it("has increasing thresholds", () => {
      const thresholds = [0, 100, 300, 600, 1000];
      thresholds.forEach((xp, i) => {
        expect(getLevel(xp).level).toBe(i + 1);
      });
    });
  });

  describe("checkBadges", () => {
    it("awards Seedling for first need", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 1,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("🌱 Seedling");
    });

    it("awards Dealmaker for 5 deals", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 5,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("🤝 Dealmaker");
    });

    it("awards Centurion for 20 deals", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 20,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("🏆 Centurion");
    });

    it("awards Socialite for 100 messages", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 100,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("🗣️ Socialite");
    });

    it("awards Orator for 500 messages", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 500,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("📢 Orator");
    });

    it("awards Critic for 5 reviews", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 5,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("⭐ Critic");
    });

    it("awards Trusted for high rating and deals", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 5,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: 9.5,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("🏅 Trusted");
    });

    it("does not award Trusted for low rating", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 5,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: 8,
        isVerified: false,
        isPro: false,
      });
      expect(badges).not.toContain("🏅 Trusted");
    });

    it("awards Verified badge", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: true,
        isPro: false,
      });
      expect(badges).toContain("🛡️ Verified");
    });

    it("awards Pro badge", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: true,
      });
      expect(badges).toContain("⭐ Pro");
    });

    it("awards Streak Starter for 7 days", () => {
      const session = makeSession({ streakDays: 7 });
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("🔥 Streak Starter");
    });

    it("awards Streak Master for 30 days", () => {
      const session = makeSession({ streakDays: 30 });
      const badges = checkBadges(session, {
        needsPosted: 0,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toContain("⚡ Streak Master");
    });

    it("does not duplicate existing badges", () => {
      const session = makeSession({ badges: ["🌱 Seedling"] });
      const badges = checkBadges(session, {
        needsPosted: 1,
        dealsCompleted: 0,
        messagesSent: 0,
        reviewsGiven: 0,
        ratingAvg: null,
        isVerified: false,
        isPro: false,
      });
      expect(badges).toHaveLength(0);
    });

    it("returns multiple new badges", () => {
      const session = makeSession();
      const badges = checkBadges(session, {
        needsPosted: 1,
        dealsCompleted: 5,
        messagesSent: 100,
        reviewsGiven: 5,
        ratingAvg: 9.5,
        isVerified: true,
        isPro: true,
      });
      expect(badges).toContain("🌱 Seedling");
      expect(badges).toContain("🤝 Dealmaker");
      expect(badges).toContain("🗣️ Socialite");
      expect(badges).toContain("⭐ Critic");
      expect(badges).toContain("🏅 Trusted");
      expect(badges).toContain("🛡️ Verified");
      expect(badges).toContain("⭐ Pro");
    });
  });

  describe("refreshBadges", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      global.fetch = vi.fn();
    });

    it("fetches needs and reviews, awards new badges", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ needs: [{ id: "n1" }, { id: "n2" }] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reviews: [{ id: "r1" }, { id: "r2" }, { id: "r3" }, { id: "r4" }, { id: "r5" }],
          }),
        } as Response);

      const session = makeSession({ streakDays: 7 });
      const profile = {
        jobsCompleted: 5,
        ratingAvg: 9.2,
        isVerified: true,
        isPro: false,
      };

      const result = await refreshBadges(session, profile as any);

      expect(result.newBadges).toContain("🌱 Seedling");
      expect(result.newBadges).toContain("🤝 Dealmaker");
      expect(result.newBadges).toContain("⭐ Critic");
      expect(result.newBadges).toContain("🏅 Trusted");
      expect(result.newBadges).toContain("🛡️ Verified");
      expect(result.newBadges).toContain("🔥 Streak Starter");
      expect(result.session.badges).toEqual(expect.arrayContaining(result.newBadges));
    });

    it("returns unchanged session when no new badges", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ needs: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        } as Response);

      const session = makeSession();
      const result = await refreshBadges(session, null);

      expect(result.newBadges).toHaveLength(0);
      expect(result.session).toBe(session);
    });

    it("handles API errors gracefully", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);

      const session = makeSession();
      const result = await refreshBadges(session, null);

      expect(result.newBadges).toHaveLength(0);
    });

    it("does not duplicate existing badges", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ needs: [{ id: "n1" }] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ reviews: [] }),
        } as Response);

      const session = makeSession({ badges: ["🌱 Seedling"] });
      const result = await refreshBadges(session, null);

      expect(result.newBadges).toHaveLength(0);
      expect(result.session.badges).toEqual(["🌱 Seedling"]);
    });
  });

  describe("resolveAlias", () => {
    it("returns input if not a command", () => {
      const session = makeSession({ aliases: { h: "help" } });
      expect(resolveAlias(session, "hello")).toBe("hello");
    });

    it("resolves simple alias", () => {
      const session = makeSession({ aliases: { h: "help" } });
      expect(resolveAlias(session, "/h")).toBe("/help");
    });

    it("resolves alias with args", () => {
      const session = makeSession({ aliases: { w: "whoami" } });
      expect(resolveAlias(session, "/w advanced")).toBe("/whoami advanced");
    });

    it("resolves chained aliases", () => {
      const session = makeSession({ aliases: { a: "b", b: "c", c: "help" } });
      expect(resolveAlias(session, "/a")).toBe("/help");
    });

    it("stops at max depth to prevent infinite loops", () => {
      const session = makeSession({ aliases: { a: "a" } });
      expect(resolveAlias(session, "/a")).toBe("/a");
    });

    it("returns input if no alias matches", () => {
      const session = makeSession();
      expect(resolveAlias(session, "/help")).toBe("/help");
    });

    it("preserves whitespace around args", () => {
      const session = makeSession({ aliases: { s: "search" } });
      expect(resolveAlias(session, "/s   plumber")).toBe("/search plumber");
    });
  });

  describe("resolveMacro", () => {
    it("returns null if not a command", () => {
      const session = makeSession();
      expect(resolveMacro(session, "hello")).toBeNull();
    });

    it("returns null if no macro matches", () => {
      const session = makeSession();
      expect(resolveMacro(session, "/daily")).toBeNull();
    });

    it("returns macro commands", () => {
      const session = makeSession({ macros: { daily: ["whoami", "stats"] } });
      expect(resolveMacro(session, "/daily")).toEqual(["whoami", "stats"]);
    });

    it("ignores extra args on macro", () => {
      const session = makeSession({ macros: { daily: ["whoami"] } });
      expect(resolveMacro(session, "/daily extra")).toEqual(["whoami"]);
    });
  });
});
