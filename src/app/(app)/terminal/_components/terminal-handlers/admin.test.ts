import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleAdminStats,
  handleAdminUsers,
  handleAdminVerifications,
  handleAdminVerify,
  handleAdminReject,
  handleAdminForceCancel,
  handleAdminContracts,
  handleAdminMsg,
  handleAdminAnnounce,
  handleStaff,
  handleBan,
} from "./admin";
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

describe("admin handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe("handleAdminStats", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminStats(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("shows stats for admin", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          totalUsers: 10,
          totalPros: 2,
          totalNeeds: 5,
          totalContracts: 3,
          pendingVerifications: 1,
          pendingContractCancellations: 0,
        }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminStats(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Admin Dashboard"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminStats(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Couldn't load"), "error");
    });
  });

  describe("handleAdminUsers", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("lists users for admin", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [{ id: "u1", fullName: "Alice" }] }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
    });

    it("handles empty users list", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Users (0)"), "info");
    });

    it("handles fetch error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminUsers(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Failed to fetch"), "error");
    });
  });

  describe("handleAdminVerifications", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminVerifications(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("shows pending verifications", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          credentials: [{ id: "c1", user: { fullName: "Bob" }, type: "license", title: "Driver" }],
        }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminVerifications(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Pending Verifications"),
        "info"
      );
    });

    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ credentials: [] }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminVerifications(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("🛡️ No pending verifications.", "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminVerifications(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load verifications"),
        "error"
      );
    });
  });

  describe("handleAdminVerify", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminVerify(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires credential id", async () => {
      const ctx = makeCtx({ isAdmin: true, args: [] });
      await handleAdminVerify(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /admin verify"),
        "error"
      );
    });

    it("verifies credential successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["cred-1"] });
      await handleAdminVerify(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Credential verified.", "success");
    });

    it("handles verify failure", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true, args: ["cred-1"] });
      await handleAdminVerify(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Couldn't verify"), "error");
    });
  });

  describe("handleAdminReject", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminReject(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires credential id", async () => {
      const ctx = makeCtx({ isAdmin: true, args: [] });
      await handleAdminReject(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /admin reject"),
        "error"
      );
    });

    it("rejects with reason", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["cred-1", "bad", "photo"] });
      await handleAdminReject(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Credential rejected"),
        "success"
      );
    });

    it("rejects with default reason when none provided", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["cred-1"] });
      await handleAdminReject(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Rejected by admin"),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true, args: ["cred-1"] });
      await handleAdminReject(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Couldn't reject"), "error");
    });
  });

  describe("handleAdminForceCancel", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminForceCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires contract id", async () => {
      const ctx = makeCtx({ isAdmin: true, args: [] });
      await handleAdminForceCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /admin force-cancel"),
        "error"
      );
    });

    it("force-cancels successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["con-1"] });
      await handleAdminForceCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Contract force-cancelled.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true, args: ["con-1"] });
      await handleAdminForceCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't force-cancel"),
        "error"
      );
    });
  });

  describe("handleAdminContracts", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("lists escalated cancellations", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [
            {
              id: "con-1",
              need: { title: "Fix roof" },
              partyA: { fullName: "Alice" },
              partyB: { fullName: "Bob" },
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Escalated Cancellations"),
        "info"
      );
    });

    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [] }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("🛡️ No escalated cancellation requests.", "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true });
      await handleAdminContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load escalated"),
        "error"
      );
    });
  });

  describe("handleAdminMsg", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminMsg(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires userId and message", async () => {
      const ctx = makeCtx({ isAdmin: true, args: ["user-2"] });
      await handleAdminMsg(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /admin msg"),
        "error"
      );
    });

    it("sends admin message", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["user-2", "hello", "there"] });
      await handleAdminMsg(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Message sent.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true, args: ["user-2", "hello"] });
      await handleAdminMsg(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't send message"),
        "error"
      );
    });
  });

  describe("handleAdminAnnounce", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleAdminAnnounce(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires channel and message", async () => {
      const ctx = makeCtx({ isAdmin: true, args: ["general"] });
      await handleAdminAnnounce(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /admin announce"),
        "error"
      );
    });

    it("announces to channel successfully", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            channels: [{ id: "ch1", slug: "general", type: "public" }],
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["general", "hello", "world"] });
      await handleAdminAnnounce(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Announcement sent to #general"),
        "success"
      );
    });

    it("errors when channel not found", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ channels: [] }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["general", "hello"] });
      await handleAdminAnnounce(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('Channel "general" not found'),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true, args: ["general", "hello"] });
      await handleAdminAnnounce(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't send announcement"),
        "error"
      );
    });
  });

  describe("handleStaff", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleStaff(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires message", async () => {
      const ctx = makeCtx({ isAdmin: true, args: [] });
      await handleStaff(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /staff"), "error");
    });

    it("sends to staff channel", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            channels: [{ id: "staff1", slug: "staff", type: "staff" }],
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["meeting", "now"] });
      await handleStaff(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Message sent to staff channel"),
        "success"
      );
    });

    it("errors when no staff channel", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ channels: [] }),
      } as Response);
      const ctx = makeCtx({ isAdmin: true, args: ["hello"] });
      await handleStaff(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No staff channel found.", "error");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ isAdmin: true, args: ["hello"] });
      await handleStaff(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send staff message"),
        "error"
      );
    });
  });

  describe("handleBan", () => {
    it("rejects non-admin", async () => {
      const ctx = makeCtx({ isAdmin: false });
      await handleBan(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Admin only.", "error");
    });

    it("requires userId", async () => {
      const ctx = makeCtx({ isAdmin: true, args: [] });
      await handleBan(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /ban"), "error");
    });

    it("shows not implemented message", async () => {
      const ctx = makeCtx({ isAdmin: true, args: ["user-2"] });
      await handleBan(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("not yet implemented"),
        "error"
      );
    });
  });
});
