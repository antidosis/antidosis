import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleWhoami,
  handleStats,
  handleReputation,
  handleSkills,
  handleCredentials,
  handleSetBio,
  handleSetName,
  handleLocation,
  handleAddSkill,
  handleRemoveSkill,
  handlePhone,
  handleDirectory,
  handleLink,
  handleUnlink,
  handleCredentialAdd,
  handleCredentialList,
  handleCredentialShare,
  handleCredentialDelete,
} from "./profile";
import type { HandlerContext } from "./types";

function makeCtx(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    args: [],
    router: { push: vi.fn() } as any,
    myProfile: { id: "user-1", fullName: "Test User" } as any,
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

describe("profile handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  describe("handleWhoami", () => {
    it("shows profile info", async () => {
      const ctx = makeCtx({
        myProfile: {
          id: "user-1",
          fullName: "Alice",
          isVerified: true,
          isPro: true,
          ratingAvg: 4.5,
          ratingCount: 10,
          jobsCompleted: 5,
          locationName: "Sydney",
          skills: [{ id: "s1", name: "Plumbing" }],
        } as any,
      });
      await handleWhoami(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Alice"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Plumbing"), "info");
    });

    it("handles minimal profile", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", fullName: null } as any });
      await handleWhoami(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("You"), "info");
    });

    it("shows unverified and non-pro", async () => {
      const ctx = makeCtx({
        myProfile: {
          id: "user-1",
          fullName: "Bob",
          isVerified: false,
          isPro: false,
          skills: [],
        } as any,
      });
      await handleWhoami(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("❌"), "info");
    });
  });

  describe("handleStats", () => {
    it("shows stats", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [{ status: "active" }, { status: "pending_terms" }],
          needs: [{}, {}],
          reviews: [{}, {}],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleStats(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Your Stats"), "info");
    });

    it("shows zero counts", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [], needs: [], reviews: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleStats(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("0"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleStats(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load stats"),
        "error"
      );
    });
  });

  describe("handleReputation", () => {
    it("shows reputation", async () => {
      const ctx = makeCtx({
        myProfile: { id: "user-1", ratingAvg: 4.5, ratingCount: 10, jobsCompleted: 5 } as any,
      });
      await handleReputation(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Reputation"), "info");
    });

    it("handles null rating", async () => {
      const ctx = makeCtx({
        myProfile: { id: "user-1", ratingAvg: null, ratingCount: null, jobsCompleted: 0 } as any,
      });
      await handleReputation(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("0"), "info");
    });
  });

  describe("handleSkills", () => {
    it("shows skills", async () => {
      const ctx = makeCtx({
        myProfile: {
          id: "user-1",
          skills: [
            { id: "s1", name: "Plumbing" },
            { id: "s2", name: "Carpentry" },
          ],
        } as any,
      });
      await handleSkills(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Plumbing"), "info");
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Carpentry"), "info");
    });

    it("shows empty state", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", skills: [] } as any });
      await handleSkills(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No skills yet"), "info");
    });
  });

  describe("handleCredentials", () => {
    it("shows credentials", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          credentials: [
            { type: "license", title: "Driver", isVerified: true },
            { type: "cert", title: "AWS", isVerified: false },
          ],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleCredentials(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Driver"), "info");
    });

    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ credentials: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleCredentials(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No credentials yet"),
        "info"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleCredentials(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load credentials"),
        "error"
      );
    });
  });

  describe("handleSetBio", () => {
    it("requires bio text", async () => {
      const ctx = makeCtx();
      await handleSetBio(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /setbio <bio text>", "error");
    });

    it("rejects bio over 2000 chars", async () => {
      const ctx = makeCtx({ args: ["x".repeat(2001)] });
      await handleSetBio(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 2000 characters"),
        "error"
      );
    });

    it("updates bio successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["I am a developer"] });
      await handleSetBio(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Bio updated.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["bio"] });
      await handleSetBio(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update bio"),
        "error"
      );
    });
  });

  describe("handleSetName", () => {
    it("requires name", async () => {
      const ctx = makeCtx();
      await handleSetName(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /setname <full name>", "error");
    });

    it("rejects name over 100 chars", async () => {
      const ctx = makeCtx({ args: ["x".repeat(101)] });
      await handleSetName(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 100 characters"),
        "error"
      );
    });

    it("updates name successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Alice Smith"] });
      await handleSetName(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Name updated.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Alice"] });
      await handleSetName(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update name"),
        "error"
      );
    });
  });

  describe("handleLocation", () => {
    it("rejects location over 100 chars", async () => {
      const ctx = makeCtx({ args: ["x".repeat(101)] });
      await handleLocation(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 100 characters"),
        "error"
      );
    });

    it("updates location successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Sydney"] });
      await handleLocation(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('Location updated to "Sydney"'),
        "success"
      );
    });

    it("clears location with empty string", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: [] });
      await handleLocation(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('Location updated to ""'),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Sydney"] });
      await handleLocation(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update location"),
        "error"
      );
    });
  });

  describe("handleAddSkill", () => {
    it("requires skill name", async () => {
      const ctx = makeCtx();
      await handleAddSkill(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /addskill <skill name>", "error");
    });

    it("adds skill successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Plumbing"] });
      await handleAddSkill(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith('✅ Skill "Plumbing" added.', "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Plumbing"] });
      await handleAddSkill(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add skill"),
        "error"
      );
    });
  });

  describe("handleRemoveSkill", () => {
    it("requires skill name", async () => {
      const ctx = makeCtx();
      await handleRemoveSkill(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /removeskill <skill name>", "error");
    });

    it("removes skill successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["Plumbing"] });
      await handleRemoveSkill(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith('✅ Skill "Plumbing" removed.', "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["Plumbing"] });
      await handleRemoveSkill(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to remove skill"),
        "error"
      );
    });
  });

  describe("handlePhone", () => {
    it("rejects phone over 50 chars", async () => {
      const ctx = makeCtx({ args: ["x".repeat(51)] });
      await handlePhone(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 50 characters"),
        "error"
      );
    });

    it("updates phone successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["+61 400 000 000"] });
      await handlePhone(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining('Phone updated to "+61 400 000 000"'),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["123"] });
      await handlePhone(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update phone"),
        "error"
      );
    });
  });

  describe("handleDirectory", () => {
    it("rejects non-pro users", async () => {
      const ctx = makeCtx({ myProfile: { id: "user-1", isPro: false } as any });
      await handleDirectory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Pro members only.", "error");
    });

    it("shows current status for pro", async () => {
      const ctx = makeCtx({
        myProfile: { id: "user-1", isPro: true, showInDirectory: true } as any,
      });
      await handleDirectory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Visible"), "info");
    });

    it("toggles directory on", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({
        myProfile: { id: "user-1", isPro: true, showInDirectory: false } as any,
        args: ["on"],
      });
      await handleDirectory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Directory listing enabled.", "success");
    });

    it("toggles directory off", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({
        myProfile: { id: "user-1", isPro: true, showInDirectory: true } as any,
        args: ["off"],
      });
      await handleDirectory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Directory listing disabled.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({
        myProfile: { id: "user-1", isPro: true } as any,
        args: ["on"],
      });
      await handleDirectory(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to update directory"),
        "error"
      );
    });
  });

  describe("handleLink", () => {
    it("requires platform and url", async () => {
      const ctx = makeCtx({ args: ["twitter"] });
      await handleLink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /link <platform> <url>", "error");
    });

    it("rejects unsafe URL", async () => {
      const ctx = makeCtx({ args: ["twitter", "ftp://bad.com"] });
      await handleLink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("http:// or https://"),
        "error"
      );
    });

    it("adds social link", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ socialLinks: [] }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["twitter", "https://twitter.com/me"] });
      await handleLink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Linked twitter.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["twitter", "https://twitter.com/me"] });
      await handleLink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Failed to link"), "error");
    });
  });

  describe("handleUnlink", () => {
    it("requires provider", async () => {
      const ctx = makeCtx();
      await handleUnlink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /unlink <provider>", "error");
    });

    it("removes social link", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            socialLinks: [{ platform: "twitter", url: "https://x.com/me" }],
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["twitter"] });
      await handleUnlink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Unlinked twitter.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["twitter"] });
      await handleUnlink(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Failed to unlink"), "error");
    });
  });

  describe("handleCredentialAdd", () => {
    it("starts credential wizard", async () => {
      const ctx = makeCtx();
      await handleCredentialAdd(ctx);
      expect(ctx.setWizard).toHaveBeenCalled();
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Credential"), "info");
    });
  });

  describe("handleCredentialList", () => {
    it("delegates to handleCredentials", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ credentials: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleCredentialList(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No credentials yet"),
        "info"
      );
    });
  });

  describe("handleCredentialShare", () => {
    it("requires credential id", async () => {
      const ctx = makeCtx();
      await handleCredentialShare(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /credential share"),
        "error"
      );
    });

    it("shares credential", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ shareText: "Check my credential" }),
      } as Response);
      const ctx = makeCtx({ args: ["cred-1"] });
      await handleCredentialShare(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Check my credential"),
        "info"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["cred-1"] });
      await handleCredentialShare(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't share credential"),
        "error"
      );
    });
  });

  describe("handleCredentialDelete", () => {
    it("requires credential id", async () => {
      const ctx = makeCtx();
      await handleCredentialDelete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /credential delete"),
        "error"
      );
    });

    it("deletes credential", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["cred-1"] });
      await handleCredentialDelete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Credential deleted.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["cred-1"] });
      await handleCredentialDelete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't delete credential"),
        "error"
      );
    });
  });
});
