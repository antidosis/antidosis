import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleSearch,
  handleSkillDiscovery,
  handlePros,
  handleUsers,
  handleProfileView,
  handleWho,
  handleFriend,
  handleUnfriend,
  handleFriends,
  handleBlock,
  handleUnblock,
  handleBlocks,
  handleNotifications,
  handleRead,
  handleReadAll,
  handleActivity,
} from "./social";
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

describe("social handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe("handleNotifications", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ notifications: [] }),
      } as Response);
      await handleNotifications(makeCtx());
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/notifications");
    });

    it("lists notifications with unread count", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: [
            { id: "n1", title: "New interest", readAt: null, createdAt: "2026-05-25T00:00:00Z" },
            {
              id: "n2",
              title: "Message",
              readAt: "2026-05-25T01:00:00Z",
              createdAt: "2026-05-25T01:00:00Z",
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleNotifications(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("New interest"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleNotifications(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load notifications"),
        "error"
      );
    });
  });

  describe("handleRead", () => {
    it("requires notification id", async () => {
      const ctx = makeCtx();
      await handleRead(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /read <notification-id>", "error");
    });

    it("marks notification as read", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["n1"] });
      await handleRead(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Marked as read.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["n1"] });
      await handleRead(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Failed."), "error");
    });
  });

  describe("handleReadAll", () => {
    it("marks all as read", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx();
      await handleReadAll(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ All notifications marked as read.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleReadAll(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Failed."), "error");
    });
  });

  describe("handleActivity", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleActivity(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No recent activity.", "info");
    });

    it("lists activity", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { type: "contract", description: "Signed deal", createdAt: "2026-05-25T00:00:00Z" },
          ],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleActivity(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Signed deal"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleActivity(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load activity"),
        "error"
      );
    });
  });

  describe("handleSearch", () => {
    it("requires query", async () => {
      const ctx = makeCtx();
      await handleSearch(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /search <query>", "error");
    });

    it("shows results with needs, users, pros", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [{ id: "n1", title: "Fix roof" }],
          users: [{ id: "u1", fullName: "Alice" }],
          pros: [{ id: "p1", fullName: "Bob", ratingAvg: 4.5, ratingCount: 10 }],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["plumber"] });
      await handleSearch(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Fix roof"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
    });

    it("shows no results", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ needs: [], users: [], pros: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["xyz123"] });
      await handleSearch(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No results found"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["plumber"] });
      await handleSearch(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Search failed."), "error");
    });
  });

  describe("handlePros", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ pros: [] }),
      } as Response);
      const ctx = makeCtx();
      await handlePros(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No verified pros yet.", "info");
    });

    it("lists pros", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          pros: [
            {
              id: "p1",
              fullName: "Alice",
              ratingAvg: 4.5,
              ratingCount: 10,
              locationName: "Sydney",
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx();
      await handlePros(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handlePros(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load pros"),
        "error"
      );
    });
  });

  describe("handleUsers", () => {
    it("requires query", async () => {
      const ctx = makeCtx();
      await handleUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /users <name>", "error");
    });

    it("shows results", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [{ id: "u1", fullName: "Alice", locationName: "Sydney" }],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["Alice"] });
      await handleUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
    });

    it("shows no results", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["Nobody"] });
      await handleUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No one found matching"),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Alice"] });
      await handleUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Search failed."), "error");
    });
  });

  describe("handleProfileView", () => {
    it("shows own profile when no target", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", fullName: "Me" } as any });
      await handleProfileView(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/profile/user-1");
    });

    it("navigates to UUID directly", async () => {
      const uuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
      const ctx = makeCtx({ args: [uuid] });
      await handleProfileView(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith(`/profile/${uuid}`);
    });

    it("searches and navigates for single match", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [{ id: "u1", fullName: "Alice" }] }),
      } as Response);
      const ctx = makeCtx({ args: ["Alice"] });
      await handleProfileView(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/profile/u1");
    });

    it("shows multiple matches", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            { id: "u1", fullName: "Alice" },
            { id: "u2", fullName: "Alicia" },
          ],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["Ali"] });
      await handleProfileView(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Multiple matches"), "info");
    });

    it("shows no results", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["Nobody"] });
      await handleProfileView(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No one found matching"),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Alice"] });
      await handleProfileView(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Search failed."), "error");
    });
  });

  describe("handleWho", () => {
    it("shows empty state", async () => {
      const ctx = makeCtx({ onlineUsers: [] });
      await handleWho(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No one else is online"),
        "info"
      );
    });

    it("lists online users", async () => {
      const ctx = makeCtx({
        onlineUsers: [{ id: "u1", fullName: "Alice" }] as any,
      });
      await handleWho(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
    });
  });

  describe("handleFriend", () => {
    it("requires target", async () => {
      const ctx = makeCtx();
      await handleFriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /friend <username>", "error");
    });

    it("shows no results", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["Nobody"] });
      await handleFriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No one found matching"),
        "error"
      );
    });

    it("shows multiple matches", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            { id: "u1", fullName: "Alice" },
            { id: "u2", fullName: "Alicia" },
          ],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["Ali"] });
      await handleFriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Multiple matches"), "info");
    });

    it("adds friend successfully", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: [{ id: "u1", fullName: "Alice" }] }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Alice"] });
      await handleFriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("is now your friend"),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Alice"] });
      await handleFriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't add friend"),
        "error"
      );
    });
  });

  describe("handleUnfriend", () => {
    it("requires target", async () => {
      const ctx = makeCtx();
      await handleUnfriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /unfriend <username>", "error");
    });

    it("removes friend", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            friends: [{ id: "f1", user: { fullName: "Alice" } }],
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Alice"] });
      await handleUnfriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("removed from friends"),
        "success"
      );
    });

    it("shows no match", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ friends: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["Alice"] });
      await handleUnfriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No friend matches"),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Alice"] });
      await handleUnfriend(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't remove friend"),
        "error"
      );
    });
  });

  describe("handleFriends", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ friends: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleFriends(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No friends yet"), "info");
    });

    it("lists friends", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          friends: [{ user: { fullName: "Alice" } }, { user: { fullName: "Bob" } }],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleFriends(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleFriends(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load friends"),
        "error"
      );
    });
  });

  describe("handleBlock", () => {
    it("requires target", async () => {
      const ctx = makeCtx();
      await handleBlock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /block <username>", "error");
    });

    it("blocks user", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: [{ id: "u2", fullName: "Bob" }] }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Bob"] });
      await handleBlock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Bob blocked.", "success");
    });

    it("shows multiple matches", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            { id: "u1", fullName: "Bob" },
            { id: "u2", fullName: "Bobby" },
          ],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["Bob"] });
      await handleBlock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Multiple matches"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Bob"] });
      await handleBlock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't block user"),
        "error"
      );
    });
  });

  describe("handleUnblock", () => {
    it("requires target", async () => {
      const ctx = makeCtx();
      await handleUnblock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /unblock <username>", "error");
    });

    it("unblocks user", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            blocks: [{ id: "b1", user: { fullName: "Bob" } }],
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Bob"] });
      await handleUnblock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Bob unblocked.", "success");
    });

    it("shows no match", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ blocks: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["Bob"] });
      await handleUnblock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No blocked user matches"),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Bob"] });
      await handleUnblock(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't unblock user"),
        "error"
      );
    });
  });

  describe("handleBlocks", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ blocks: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleBlocks(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("haven't blocked anyone"),
        "info"
      );
    });

    it("lists blocked users", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          blocks: [{ user: { fullName: "Bob" } }],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleBlocks(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Bob"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleBlocks(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load block list"),
        "error"
      );
    });
  });

  describe("handleSkillDiscovery", () => {
    it("requires skill name", async () => {
      const ctx = makeCtx();
      await handleSkillDiscovery(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /skill <name>", "error");
    });

    it("shows needs and pros", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [{ id: "n1", title: "Fix roof" }],
          pros: [
            {
              id: "p1",
              fullName: "Bob",
              ratingAvg: 4.5,
              ratingCount: 10,
              skills: [{ name: "plumbing" }],
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["plumbing"] });
      await handleSkillDiscovery(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Fix roof"), "info");
    });

    it("shows no needs but matching pros", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [],
          pros: [
            {
              id: "p1",
              fullName: "Bob",
              ratingAvg: 4.5,
              ratingCount: 10,
              skills: [{ name: "plumbing" }],
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx({ args: ["plumbing"] });
      await handleSkillDiscovery(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Bob"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["plumbing"] });
      await handleSkillDiscovery(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Couldn't search"), "error");
    });
  });
});
