"use client";

import { generateAgentResponse } from "../terminal-agent";
import { fmtCard, xpBar } from "../terminal-render";
import { getLevel } from "../terminal-session";
import { createWizard } from "../terminal-wizard";
import type { HandlerContext, HandlerResult } from "./types";
import { friendlyError } from "./utils";

export async function handleAsk(ctx: HandlerContext): Promise<HandlerResult> {
  const question = ctx.args.join(" ").trim();
  if (!question) {
    ctx.addSys("Usage: /ask <question>", "error");
    return { handled: true };
  }
  try {
    const [cData, nData, aData, notifData] = await Promise.all([
      fetch("/api/v1/contracts/mine").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/needs/mine").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/acceptances/mine").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/notifications").then((r) => (r.ok ? r.json() : { notifications: [] })),
    ]);
    const contracts = Array.isArray(cData) ? cData : cData.contracts || [];
    const needs = Array.isArray(nData) ? nData : nData.needs || [];
    const acceptances = Array.isArray(aData) ? aData : aData.acceptances || [];
    const notifications = notifData.notifications || [];
    const pendingSignatures = contracts.filter(
      (c: any) =>
        (c.status === "pending_terms" || c.status === "draft") &&
        !(c.partyAId === ctx.myProfile?.id ? c.partyASigned : c.partyBSigned)
    );
    const pendingCompletions = contracts.filter(
      (c: any) =>
        c.status === "active" &&
        !(c.partyAId === ctx.myProfile?.id ? c.aMarkedComplete : c.bMarkedComplete)
    );
    const response = await generateAgentResponse(question, {
      myProfile: ctx.myProfile,
      notifications,
      contracts,
      needs,
      acceptances,
      unreadDmCount: ctx.dmThreads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0),
      pendingSignatures,
      pendingCompletions,
      pendingReviews: [],
    });
    ctx.addSys(`🤖 Agent\n\n${response}`, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Agent failed."), "error");
  }
  return { handled: true };
}

export async function handleStatus(ctx: HandlerContext): Promise<HandlerResult> {
  const { level, title, nextThreshold } = getLevel(ctx.session.xp);
  const xpPct = Math.round((ctx.session.xp / nextThreshold) * 100);
  ctx.addSys(
    `🏆 Level ${level} ${title}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `XP:     ${ctx.session.xp} / ${nextThreshold}  ${xpBar(ctx.session.xp, nextThreshold, 25)}\n` +
      `Streak: 🔥 ${ctx.session.streakDays} days\n` +
      `Badges: ${ctx.session.badges.length > 0 ? ctx.session.badges.join(" ") : "None yet — keep going!"}\n\n` +
      `💡 Complete deals, post needs, and verify credentials to earn XP.`,
    "info"
  );
  return { handled: true };
}

export async function handleTutorial(ctx: HandlerContext): Promise<HandlerResult> {
  const wizard = createWizard("tutorial");
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}

export async function handleTheme(ctx: HandlerContext): Promise<HandlerResult> {
  const theme = ctx.args[0] as any;
  const valid = ["default", "cyberpunk", "matrix", "minimal", "ocean"];
  if (!theme || !valid.includes(theme)) {
    ctx.addSys(
      `Usage: /theme <name>\nAvailable: ${valid.join(", ")}\nCurrent: ${ctx.session.settings.theme}`,
      "error"
    );
    return { handled: true };
  }
  ctx.setSession({ ...ctx.session, settings: { ...ctx.session.settings, theme } });
  ctx.addSys(`✅ Theme changed to "${theme}".`, "success");
  return { handled: true };
}

export async function handleSettings(ctx: HandlerContext): Promise<HandlerResult> {
  const s = ctx.session.settings;
  ctx.addSys(
    `⚙️ Settings\n\n` +
      fmtCard({
        "Theme:": s.theme,
        "Compact mode:": s.compactMode ? "On" : "Off",
        "DM notifications:": s.notifyDm ? "On" : "Off",
        "Mention notifications:": s.notifyMention ? "On" : "Off",
        "Ambient status bar:": s.showAmbientStatus ? "On" : "Off",
        "Typing indicator:": s.showTypingIndicator ? "On" : "Off",
        "Voice input:": s.voiceEnabled ? "On" : "Off",
        "Vim mode:": s.vimMode ? "On" : "Off",
      }) +
      `\n\n💡 /theme <name> to change theme`,
    "info"
  );
  return { handled: true };
}

export async function handleVoice(ctx: HandlerContext): Promise<HandlerResult> {
  const s = {
    ...ctx.session,
    settings: { ...ctx.session.settings, voiceEnabled: !ctx.session.settings.voiceEnabled },
  };
  ctx.setSession(s);
  ctx.addSys(`🎤 Voice input ${s.settings.voiceEnabled ? "enabled" : "disabled"}.`, "success");
  return { handled: true };
}
