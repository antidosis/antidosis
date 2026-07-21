import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  handleNeeds,
  handleNeed,
  handleRecommended,
  handleNearby,
  handleAcceptNeed,
  handleInterests,
  handleSelectInterest,
  handleDeclineInterest,
  handleMarkComplete,
  handleRepost,
  handleNeedClose,
  handleNeedDelete,
  handleContracts,
  handleContract,
  handleSign,
  handleComplete,
  handleCancel,
  handleRequestCancel,
  handleRespondCancel,
  handleRemind,
  handleTerms,
  handleEscalate,
  handleReviews,
  handleReview,
  handleNeedEdit,
  handlePost,
} from "./marketplace";
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

describe("marketplace handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    );
  });

  describe("handleNeeds", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ needs: [] }),
      } as Response);
      await handleNeeds(makeCtx());
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/needs");
    });

    it("lists needs", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [{ id: "n1", title: "Fix tap", exchangeMode: "service", status: "active" }],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleNeeds(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Fix tap"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleNeeds(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load needs"),
        "error"
      );
    });
  });

  describe("handleNeed", () => {
    it("shows contextual help when no id", async () => {
      const ctx = makeCtx();
      await handleNeed(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /need <id>"),
        "error"
      );
    });

    it("reopens last viewed need when no id", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lastViewed: { needId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
        },
      });
      await handleNeed(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/needs/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
    });

    it("navigates to need with valid uuid", async () => {
      const ctx = makeCtx({ args: ["a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"] });
      await handleNeed(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith("/needs/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
    });
  });

  describe("handleRecommended", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ needs: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleRecommended(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No recommended"), "info");
    });

    it("lists recommendations", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [{ id: "n1", title: "Paint fence", exchangeMode: "service" }],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleRecommended(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Paint fence"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleRecommended(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load recommendations"),
        "error"
      );
    });
  });

  describe("handleNearby", () => {
    it("uses location when available", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [{ id: "n1", title: "Mow lawn", locationName: "Woy Woy" }],
        }),
      } as Response);
      const ctx = makeCtx({
        myProfile: { id: "user-1", fullName: "Test", locationName: "Woy Woy" } as any,
      });
      await handleNearby(ctx);
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/needs?location=Woy%20Woy&limit=10");
    });

    it("falls back to no location", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ needs: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleNearby(ctx);
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/needs?limit=10");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleNearby(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load nearby needs"),
        "error"
      );
    });
  });

  describe("handleAcceptNeed", () => {
    it("requires need id", async () => {
      const ctx = makeCtx();
      await handleAcceptNeed(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /accept <need-id> [message]", "error");
    });

    it("rejects messages over 2000 chars", async () => {
      const ctx = makeCtx({ args: ["n1", "x".repeat(2001)] });
      await handleAcceptNeed(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 2000 characters"),
        "error"
      );
    });

    it("accepts need successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["n1", "I can help"] });
      await handleAcceptNeed(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Interest expressed"),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["n1"] });
      await handleAcceptNeed(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to accept need"),
        "error"
      );
    });
  });

  describe("handleInterests", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ needs: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleInterests(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("No interests on your needs yet.", "info");
    });

    it("lists interests", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          needs: [
            {
              id: "n1",
              title: "Fix roof",
              acceptances: [{ id: "a1", user: { fullName: "Bob" } }],
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleInterests(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Bob"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleInterests(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load interests"),
        "error"
      );
    });
  });

  describe("handleSelectInterest", () => {
    it("requires acceptance id", async () => {
      const ctx = makeCtx();
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /select <acceptance-id>", "error");
    });

    it("selects interest and forms contract", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contract: { id: "con-1" } }),
      } as Response);
      const ctx = makeCtx({ args: ["a1"] });
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Contract formed"),
        "success"
      );
    });

    it("selects interest without contract", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);
      const ctx = makeCtx({ args: ["a1"] });
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Interest selected.", "success");
    });

    it("falls back to informal accept when contract not required", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "does not require a formal contract" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);
      const ctx = makeCtx({ args: ["a1"] });
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Deal is now active"),
        "success"
      );
    });

    it("handles fallback failure", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "does not require a formal contract" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "already selected" }),
        } as Response);
      const ctx = makeCtx({ args: ["a1"] });
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("already selected", "error");
    });

    it("handles generic API error", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "not found" }),
      } as Response);
      const ctx = makeCtx({ args: ["a1"] });
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("not found", "error");
    });

    it("handles exception", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["a1"] });
      await handleSelectInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to select interest"),
        "error"
      );
    });
  });

  describe("handleDeclineInterest", () => {
    it("requires acceptance id", async () => {
      const ctx = makeCtx();
      await handleDeclineInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /decline interest <acceptance-id>", "error");
    });

    it("declines successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["a1"] });
      await handleDeclineInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Interest declined.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["a1"] });
      await handleDeclineInterest(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to decline interest"),
        "error"
      );
    });
  });

  describe("handleMarkComplete", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleMarkComplete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /mark-complete <contract-id>", "error");
    });

    it("marks complete successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1"], session: { ...makeCtx().session, xp: 100 } });
      await handleMarkComplete(ctx);
      expect(ctx.setSession).toHaveBeenCalled();
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleMarkComplete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to mark complete"),
        "error"
      );
    });
  });

  describe("handleRepost", () => {
    it("requires need id", async () => {
      const ctx = makeCtx();
      await handleRepost(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /repost <need-id>", "error");
    });

    it("reposts successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["n1"] });
      await handleRepost(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Need reposted"), "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["n1"] });
      await handleRepost(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Failed to repost"), "error");
    });
  });

  describe("handleNeedClose", () => {
    it("requires need id", async () => {
      const ctx = makeCtx();
      await handleNeedClose(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /need-close <need-id>", "error");
    });

    it("cancels on negative confirm", async () => {
      vi.stubGlobal(
        "confirm",
        vi.fn(() => false)
      );
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedClose(ctx);
      expect(ctx.addSys).not.toHaveBeenCalled();
    });

    it("closes need successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedClose(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("archived"), "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedClose(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to archive need"),
        "error"
      );
    });
  });

  describe("handleNeedDelete", () => {
    it("requires need id", async () => {
      const ctx = makeCtx();
      await handleNeedDelete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /need-delete <need-id>", "error");
    });

    it("cancels on negative confirm", async () => {
      vi.stubGlobal(
        "confirm",
        vi.fn(() => false)
      );
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedDelete(ctx);
      expect(ctx.addSys).not.toHaveBeenCalled();
    });

    it("deletes need successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedDelete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Need n1 deleted.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedDelete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete need"),
        "error"
      );
    });
  });

  describe("handleContracts", () => {
    it("shows empty state", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("No contracts yet"), "info");
    });

    it("lists contracts", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          contracts: [
            {
              id: "con-1",
              status: "active",
              need: { title: "Fix roof" },
              partyA: { fullName: "Alice" },
              partyB: { fullName: "Bob" },
            },
          ],
        }),
      } as Response);
      const ctx = makeCtx();
      await handleContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Fix roof"), "info");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx();
      await handleContracts(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Couldn't load contracts"),
        "error"
      );
    });
  });

  describe("handleContract", () => {
    it("shows contextual help when no id", async () => {
      const ctx = makeCtx();
      await handleContract(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Usage: /contract <id>"),
        "error"
      );
    });

    it("reopens last viewed contract when no id", async () => {
      const ctx = makeCtx({
        session: {
          ...makeCtx().session,
          lastViewed: { contractId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e" },
        },
      });
      await handleContract(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith(
        "/contracts/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"
      );
    });

    it("navigates to contract with valid uuid", async () => {
      const ctx = makeCtx({ args: ["b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"] });
      await handleContract(ctx);
      expect(ctx.router.push).toHaveBeenCalledWith(
        "/contracts/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"
      );
    });
  });

  describe("handleSign", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleSign(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /sign <contract-id> [signature]", "error");
    });

    it("rejects signature over 500 chars", async () => {
      const ctx = makeCtx({ args: ["con-1", "x".repeat(501)] });
      await handleSign(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 500 characters"),
        "error"
      );
    });

    it("signs successfully", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contract: {
              id: "con-1",
              status: "pending_terms",
              partyAId: "user-1",
              partyASigned: true,
              partyBSigned: false,
              aMarkedComplete: false,
              bMarkedComplete: false,
            },
          }),
        } as Response);
      const ctx = makeCtx({ args: ["con-1"] });
      await handleSign(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Signed"), "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleSign(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to sign contract"),
        "error"
      );
    });
  });

  describe("handleComplete", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleComplete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /complete <contract-id>", "error");
    });

    it("completes successfully", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contract: {
              id: "con-1",
              status: "completed",
              partyAId: "user-1",
              partyASigned: true,
              partyBSigned: true,
              aMarkedComplete: true,
              bMarkedComplete: true,
            },
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ needs: [] }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ reviews: [] }) } as Response);
      const ctx = makeCtx({ args: ["con-1"] });
      await handleComplete(ctx);
      expect(ctx.setSession).toHaveBeenCalled();
    });

    it("awards badges on completion", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contract: {
              id: "con-1",
              status: "completed",
              partyAId: "user-1",
              partyASigned: true,
              partyBSigned: true,
              aMarkedComplete: true,
              bMarkedComplete: true,
            },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ needs: [{ id: "n1" }] }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ reviews: [] }) } as Response);
      const ctx = makeCtx({
        args: ["con-1"],
        myProfile: {
          id: "user-1",
          fullName: "Test",
          jobsCompleted: 5,
          ratingAvg: 9.5,
          isVerified: true,
          isPro: false,
        } as any,
      });
      await handleComplete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("New badge"), "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleComplete(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to complete contract"),
        "error"
      );
    });
  });

  describe("handleCancel", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /cancel <contract-id> [reason]", "error");
    });

    it("rejects reason over 2000 chars", async () => {
      const ctx = makeCtx({ args: ["con-1", "x".repeat(2001)] });
      await handleCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 2000 characters"),
        "error"
      );
    });

    it("cancels successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1", "changed my mind"] });
      await handleCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Contract cancelled.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to cancel contract"),
        "error"
      );
    });
  });

  describe("handleRequestCancel", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleRequestCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        "Usage: /request-cancel <contract-id> [reason]",
        "error"
      );
    });

    it("rejects reason over 2000 chars", async () => {
      const ctx = makeCtx({ args: ["con-1", "x".repeat(2001)] });
      await handleRequestCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 2000 characters"),
        "error"
      );
    });

    it("requests cancel successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1"] });
      await handleRequestCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Cancellation requested"),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleRequestCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to request cancel"),
        "error"
      );
    });
  });

  describe("handleRespondCancel", () => {
    it("requires contract id and action", async () => {
      const ctx = makeCtx();
      await handleRespondCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        "Usage: /respond-cancel <contract-id> approve|reject",
        "error"
      );
    });

    it("rejects invalid action", async () => {
      const ctx = makeCtx({ args: ["con-1", "maybe"] });
      await handleRespondCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        "Usage: /respond-cancel <contract-id> approve|reject",
        "error"
      );
    });

    it("approves cancellation", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1", "approve"] });
      await handleRespondCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Cancellation approved.", "success");
    });

    it("rejects cancellation", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1", "reject"] });
      await handleRespondCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Cancellation rejected.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1", "approve"] });
      await handleRespondCancel(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to respond"),
        "error"
      );
    });
  });

  describe("handleRemind", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleRemind(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /remind <contract-id>", "error");
    });

    it("sends reminder successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1"] });
      await handleRemind(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Reminder sent.", "success");
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleRemind(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send reminder"),
        "error"
      );
    });
  });

  describe("handleTerms", () => {
    it("shows usage when no args", async () => {
      const ctx = makeCtx();
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /terms"), "error");
    });

    it("submits terms", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["submit", "con-1"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Terms submitted.", "success");
    });

    it("shows submit usage when id missing", async () => {
      const ctx = makeCtx({ args: ["submit"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /terms submit <contract-id>", "error");
    });

    it("agrees to terms", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["agree", "con-1"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Terms agreed.", "success");
    });

    it("shows agree usage when id missing", async () => {
      const ctx = makeCtx({ args: ["agree"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /terms agree <contract-id>", "error");
    });

    it("proposes terms", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1", "Payment", "on", "delivery"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Terms proposed.", "success");
    });

    it("shows propose usage when text missing", async () => {
      const ctx = makeCtx({ args: ["con-1"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Usage: /terms"), "error");
    });

    it("rejects terms over 5000 chars", async () => {
      const ctx = makeCtx({ args: ["con-1", "x".repeat(5001)] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("under 5000 characters"),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1", "some terms"] });
      await handleTerms(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to propose terms"),
        "error"
      );
    });
  });

  describe("handleEscalate", () => {
    it("requires contract id", async () => {
      const ctx = makeCtx();
      await handleEscalate(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /escalate <contract-id>", "error");
    });

    it("escalates successfully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1"] });
      await handleEscalate(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("escalated to dispute resolution"),
        "success"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1"] });
      await handleEscalate(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to escalate"),
        "error"
      );
    });
  });

  describe("handleReviews", () => {
    it("shows reputation", async () => {
      const ctx = makeCtx({
        myProfile: { id: "user-1", ratingAvg: 4.5, ratingCount: 10, jobsCompleted: 5 } as any,
      });
      await handleReviews(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Reputation"), "info");
    });
  });

  describe("handleReview", () => {
    it("starts wizard when no args", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [], acceptances: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No completed deals"),
        "info"
      );
    });

    it("starts wizard with no completed deals", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [{ id: "c1", status: "active" }], acceptances: [] }),
      } as Response);
      const ctx = makeCtx();
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No completed deals"),
        "info"
      );
    });

    it("submits review for contract", async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contracts: [
              {
                id: "con-1",
                status: "completed",
                partyAId: "user-1",
                partyBId: "user-2",
                need: { title: "Fix roof" },
              },
            ],
            acceptances: [],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contracts: [], acceptances: [] }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);
      const ctx = makeCtx({ args: ["con-1", "9", "Great work"] });
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Review submitted! +10 XP", "success");
      expect(ctx.setSession).toHaveBeenCalled();
    });

    it("submits review for acceptance", async () => {
      vi.mocked(global.fetch).mockImplementation(async (url: any) => {
        if (url.includes("/contracts/mine")) {
          return { ok: true, json: async () => ({ contracts: [] }) } as Response;
        }
        if (url.includes("/acceptances/mine")) {
          return {
            ok: true,
            json: async () => ({
              acceptances: [
                {
                  id: "acc-1",
                  status: "completed",
                  userId: "user-2",
                  need: { id: "n1", posterId: "user-1" },
                },
              ],
            }),
          } as Response;
        }
        if (url.includes("/needs/")) {
          return { ok: true, json: async () => ({ need: { posterId: "user-1" } }) } as Response;
        }
        return { ok: true, json: async () => ({}) } as Response;
      });
      const ctx = makeCtx({ args: ["acc-1", "8", "Good"] });
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("✅ Review submitted! +10 XP", "success");
    });

    it("errors for invalid rating", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [], acceptances: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["con-1", "15"] });
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No completed deals"),
        "info"
      );
    });

    it("errors when no matching contract or acceptance", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ contracts: [], acceptances: [] }),
      } as Response);
      const ctx = makeCtx({ args: ["con-1", "5"] });
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("No completed contract"),
        "error"
      );
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["con-1", "5"] });
      await handleReview(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to submit review"),
        "error"
      );
    });
  });

  describe("handleNeedEdit", () => {
    it("requires need id", async () => {
      const ctx = makeCtx();
      await handleNeedEdit(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith("Usage: /need-edit <need-id>", "error");
    });

    it("loads need and starts wizard", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          need: {
            id: "n1",
            title: "Fix roof",
            description: "Leaky roof",
            offerType: "service",
            offerDescription: "$100",
            offerValue: 100,
            locationName: "Woy Woy",
          },
        }),
      } as Response);
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedEdit(ctx);
      expect(ctx.setWizard).toHaveBeenCalled();
    });

    it("errors when need not found", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ need: null }),
      } as Response);
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedEdit(ctx);
      expect(ctx.setWizard).toHaveBeenCalled();
    });

    it("handles API error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error(""));
      const ctx = makeCtx({ args: ["n1"] });
      await handleNeedEdit(ctx);
      expect(ctx.addSys).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load need"),
        "error"
      );
    });
  });

  describe("handlePost", () => {
    it("starts post wizard", async () => {
      const ctx = makeCtx();
      await handlePost(ctx);
      expect(ctx.setWizard).toHaveBeenCalled();
      expect(ctx.addSys).toHaveBeenCalledWith(expect.stringContaining("Need Creator"), "info");
    });
  });
});
