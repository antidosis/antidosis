"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createWizard, createEditNeedWizard, createReviewWizard } from "./terminal-wizard";
import { generateAgentResponse } from "./terminal-agent";
import {
  COMMANDS,
  generateHelpText,
  generateCommandsText,
  generateWhatisText,
} from "./terminal-commands";
import {
  sparkline,
  barChart,
  progressBar,
  contractPipeline,
  fmtTable,
  fmtStatus,
  fmtExchangeMode,
  fmtCard,
  fmtList,
  fmtRating,
  truncate,
  shortId,
  formatTime,
  fmtImageGrid,
  xpBar,
  badgeLine,
  getTrophyArt,
  getCelebrationBanner,
} from "./terminal-render";
import { getLevel, type TerminalSession, type WizardState } from "./terminal-session";

// ─── Types ───────────────────────────────────────────────────

export interface HandlerContext {
  args: string[];
  router: AppRouterInstance;
  myProfile: any;
  user: { id: string };
  isAdmin: boolean;
  channels: any[];
  setActiveContext: (ctx: any) => void;
  activeContext: any;
  session: TerminalSession;
  setSession: (s: TerminalSession) => void;
  setMessages: any;
  setSysMessages: any;
  addSys: (text: string, type?: "info" | "error" | "success" | "command") => void;
  onlineUsers: any[];
  dmThreads: any[];
  setWizard: (w: WizardState | null) => void;
  setPendingChoices: (choices: { type: "dm" | "profile"; options: { id: string; fullName: string | null; locationName: string | null }[] } | null) => void;
  cmdHistory?: string[];
}

export interface HandlerResult {
  handled: boolean;
}

// ─── API Helpers ─────────────────────────────────────────────

async function apiGet(path: string): Promise<any> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path: string, body?: any): Promise<any> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `POST ${path} failed: ${res.status}`);
  return data;
}

async function apiPatch(path: string, body: any): Promise<any> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `PATCH ${path} failed: ${res.status}`);
  return data;
}

async function apiDelete(path: string): Promise<any> {
  const res = await fetch(path, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `DELETE ${path} failed: ${res.status}`);
  return data;
}

function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg || fallback;
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizePath(input: string): string {
  // Prevent path traversal and open redirects
  return input.replace(/[^a-zA-Z0-9-_/]/g, "").replace(/\.\./g, "").replace(/^\//, "");
}

// ─── System Handlers ─────────────────────────────────────────

export async function handleHelp(ctx: HandlerContext): Promise<HandlerResult> {
  const advanced = ctx.args[0]?.toLowerCase() === "advanced";
  ctx.addSys(generateHelpText(ctx.isAdmin, ctx.myProfile?.fullName || "User", advanced), "info");
  return { handled: true };
}

export async function handleCommands(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(generateCommandsText(ctx.isAdmin), "info");
  return { handled: true };
}

export async function handleWhatis(ctx: HandlerContext): Promise<HandlerResult> {
  const cmd = ctx.args[0] || "";
  const result = generateWhatisText(cmd);
  ctx.addSys(result || `No command found for "${cmd}"`, result ? "info" : "error");
  return { handled: true };
}

export async function handleGoto(ctx: HandlerContext): Promise<HandlerResult> {
  const page = ctx.args[0];
  if (!page) { ctx.addSys("Usage: /goto <page>", "error"); return { handled: true }; }
  const safePage = sanitizePath(page);
  if (!safePage) { ctx.addSys("Invalid page.", "error"); return { handled: true }; }
  ctx.router.push(`/${safePage}`);
  ctx.addSys(`Navigating to /${safePage}...`, "success");
  return { handled: true };
}

export async function handleHistory(ctx: HandlerContext): Promise<HandlerResult> {
  const hist = ctx.cmdHistory || [];
  if (!hist.length) { ctx.addSys("No command history yet.", "info"); return { handled: true }; }
  ctx.addSys(`Command History (last ${hist.length}):\n${hist.slice(-20).map((c, i) => `  ${i + 1}. ${c}`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleReplay(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys("Replay: type the command directly. History is for reference only.", "info");
  return { handled: true };
}

export async function handleTips(ctx: HandlerContext): Promise<HandlerResult> {
  const tips = [
    "Type /help to see all available commands.",
    "Use Tab to auto-complete commands.",
    "/dm <name> to start a private conversation.",
    "/post to create a new need through the wizard.",
    "/status to see your XP and level.",
    "/ask <question> for contextual help.",
  ];
  ctx.addSys(`💡 Tip: ${tips[Math.floor(Math.random() * tips.length)]}`, "info");
  return { handled: true };
}

export async function handleClear(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.setSysMessages([]);
  ctx.setMessages([]);
  ctx.addSys("Terminal cleared.", "success");
  return { handled: true };
}

export async function handleId(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(`Your Profile ID: ${ctx.myProfile?.id || ctx.user.id}\nYour Auth ID: ${ctx.user.id}`, "info");
  return { handled: true };
}

export async function handleExit(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.router.push("/");
  ctx.addSys("Goodbye!", "success");
  return { handled: true };
}

export async function handleMe(ctx: HandlerContext): Promise<HandlerResult> {
  const text = ctx.args.join(" ");
  if (!text) { ctx.addSys("Usage: /me <action>", "error"); return { handled: true }; }
  if (text.length > 500) { ctx.addSys("❌ Action text must be under 500 characters.", "error"); return { handled: true }; }
  // Post action to active context if in a channel/DM
  if (ctx.activeContext?.type === "channel") {
    try {
      await apiPost("/api/v1/terminal/messages", {
        channelId: ctx.activeContext.id,
        content: `*${ctx.myProfile?.fullName || "Someone"} ${text}*`,
      });
    } catch {
      ctx.addSys(`* ${ctx.myProfile?.fullName || "You"} ${text}`, "info");
    }
  } else if (ctx.activeContext?.type === "dm") {
    try {
      await apiPost("/api/v1/terminal/dm/messages", {
        userId: ctx.activeContext.otherUserId,
        content: `*${ctx.myProfile?.fullName || "Someone"} ${text}*`,
      });
    } catch {
      ctx.addSys(`* ${ctx.myProfile?.fullName || "You"} ${text}`, "info");
    }
  } else {
    ctx.addSys(`* ${ctx.myProfile?.fullName || "You"} ${text}`, "info");
  }
  return { handled: true };
}

// ─── Profile Handlers ────────────────────────────────────────

export async function handleWhoami(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  const skills = p?.skills?.map((s: any) => s.name).join(", ") || "None";
  ctx.addSys(
    `👤 ${p?.fullName || "You"}\n` +
    `   ID:        ${shortId(ctx.user.id)}\n` +
    `   Verified:  ${p?.isVerified ? "✅" : "❌"}\n` +
    `   Pro:       ${p?.isPro ? "⭐" : "—"}\n` +
    `   Rating:    ${fmtRating(p?.ratingAvg, p?.ratingCount)}\n` +
    `   Jobs:      ${p?.jobsCompleted ?? 0}\n` +
    `   Skills:    ${skills}\n` +
    `   Location:  ${p?.locationName || "Not set"}`,
    "info"
  );
  return { handled: true };
}

export async function handleStats(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const [cData, nData, rData] = await Promise.all([
      apiGet("/api/v1/contracts/mine"),
      apiGet("/api/v1/needs/mine"),
      apiGet("/api/v1/reviews"),
    ]);
    const contracts = Array.isArray(cData) ? cData : cData.contracts || [];
    const needs = Array.isArray(nData) ? nData : nData.needs || [];
    const reviews = rData.reviews || [];
    const activeContracts = contracts.filter((c: any) => c.status === "active");
    const pendingSign = contracts.filter((c: any) => c.status === "pending_terms" || c.status === "draft");

    const { level, title, nextThreshold } = getLevel(ctx.session.xp);

    ctx.addSys(
      `📊 Your Stats\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏆 Level ${level} — ${title}\n` +
      `   ${xpBar(ctx.session.xp, nextThreshold, 30)}  ${ctx.session.xp} / ${nextThreshold} XP\n\n` +
      `📋 Needs posted:     ${needs.length}\n` +
      `📜 Contracts:        ${contracts.length} total, ${activeContracts.length} active, ${pendingSign.length} pending signature\n` +
      `⭐ Reviews:          ${reviews.length} received\n` +
      `🔥 Streak:           ${ctx.session.streakDays} days\n` +
      `🏅 Badges:           ${ctx.session.badges.length ? ctx.session.badges.join(" ") : "None yet"}\n\n` +
      `💡 /dashboard for detailed view  |  /status for gamification`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load stats."), "error");
  }
  return { handled: true };
}

export async function handleReputation(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  ctx.addSys(
    `⭐ Reputation\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `   Rating:      ${fmtRating(p?.ratingAvg, p?.ratingCount)}\n` +
    `   Jobs Done:   ${p?.jobsCompleted ?? 0}\n\n` +
    `💡 /reviews to see your feedback  |  /review <user-id> <rating> <comment> to leave one`,
    "info"
  );
  return { handled: true };
}

export async function handleSkills(ctx: HandlerContext): Promise<HandlerResult> {
  const skills = ctx.myProfile?.skills || [];
  if (!skills.length) {
    ctx.addSys("No skills yet. Add one with /addskill <name>", "info");
    return { handled: true };
  }
  ctx.addSys(
    `🛠️ Your Skills\n` +
    skills.map((s: any, i: number) => `  ${i + 1}. ${s.name}`).join("\n") +
    `\n\n💡 /addskill <name> to add  |  /removeskill <name> to remove`,
    "info"
  );
  return { handled: true };
}

export async function handleCredentials(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/profiles/me/credentials");
    const creds = data.credentials || [];
    if (!creds.length) {
      ctx.addSys("No credentials yet. Add one with /credential-add", "info");
      return { handled: true };
    }
    ctx.addSys(
      `📋 Your Credentials (${creds.length})\n` +
      fmtTable(["Type", "Title", "Status"], creds.map((c: any) => [c.type, truncate(c.title, 30), c.isVerified ? "✅ Verified" : "⏳ Pending"])) +
      `\n\n💡 /credential-add to create one`,
      "info"
    );
  } catch (err) {
    ctx.addSys(friendlyError(err, "Couldn't load credentials."), "error");
  }
  return { handled: true };
}

export async function handleSetBio(ctx: HandlerContext): Promise<HandlerResult> {
  const bio = ctx.args.join(" ");
  if (!bio) { ctx.addSys("Usage: /setbio <bio text>", "error"); return { handled: true }; }
  if (bio.length > 2000) { ctx.addSys("❌ Bio must be under 2000 characters.", "error"); return { handled: true }; }
  try {
    await apiPatch("/api/v1/profiles/me", { bio });
    ctx.addSys("✅ Bio updated.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to update bio."), "error"); }
  return { handled: true };
}

export async function handleSetName(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args.join(" ");
  if (!name) { ctx.addSys("Usage: /setname <full name>", "error"); return { handled: true }; }
  if (name.length > 100) { ctx.addSys("❌ Name must be under 100 characters.", "error"); return { handled: true }; }
  try {
    await apiPatch("/api/v1/profiles/me", { fullName: name });
    ctx.addSys("✅ Name updated.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to update name."), "error"); }
  return { handled: true };
}

export async function handleLocation(ctx: HandlerContext): Promise<HandlerResult> {
  const loc = ctx.args.join(" ") || "";
  if (loc.length > 100) { ctx.addSys("❌ Location must be under 100 characters.", "error"); return { handled: true }; }
  try {
    await apiPatch("/api/v1/profiles/me", { locationName: loc });
    ctx.addSys(`✅ Location updated to "${loc}".`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to update location."), "error"); }
  return { handled: true };
}

export async function handleAddSkill(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args.join(" ");
  if (!name) { ctx.addSys("Usage: /addskill <skill name>", "error"); return { handled: true }; }
  try {
    await apiPost("/api/v1/profiles/me/skills", { name });
    ctx.addSys(`✅ Skill "${name}" added.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to add skill."), "error"); }
  return { handled: true };
}

export async function handleRemoveSkill(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args.join(" ");
  if (!name) { ctx.addSys("Usage: /removeskill <skill name>", "error"); return { handled: true }; }
  try {
    await apiDelete(`/api/v1/profiles/me/skills?name=${encodeURIComponent(name)}`);
    ctx.addSys(`✅ Skill "${name}" removed.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to remove skill."), "error"); }
  return { handled: true };
}

export async function handlePhone(ctx: HandlerContext): Promise<HandlerResult> {
  const phone = ctx.args.join(" ") || "";
  if (phone.length > 50) { ctx.addSys("❌ Phone number must be under 50 characters.", "error"); return { handled: true }; }
  try {
    await apiPatch("/api/v1/profiles/me", { phoneNumber: phone });
    ctx.addSys(`✅ Phone updated to "${phone}".`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to update phone."), "error"); }
  return { handled: true };
}

export async function handleDirectory(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  if (!p?.isPro) { ctx.addSys("Pro members only.", "error"); return { handled: true }; }
  const arg = ctx.args[0]?.toLowerCase();
  if (arg === "on" || arg === "off") {
    const showInDirectory = arg === "on";
    try {
      await apiPatch("/api/v1/profiles/me", { showInDirectory });
      ctx.addSys(`✅ Directory listing ${showInDirectory ? "enabled" : "disabled"}.`, "success");
    } catch (err) { ctx.addSys(friendlyError(err, "Failed to update directory setting."), "error"); }
  } else {
    ctx.addSys(`Directory listing: ${p.showInDirectory ? "✅ Visible" : "❌ Hidden"}\n\nUsage: /directory on|off`, "info");
  }
  return { handled: true };
}

export async function handleLink(ctx: HandlerContext): Promise<HandlerResult> {
  const platform = ctx.args[0];
  const url = ctx.args[1];
  if (!platform || !url) { ctx.addSys("Usage: /link <platform> <url>", "error"); return { handled: true }; }
  if (!isSafeUrl(url)) { ctx.addSys("❌ URL must start with http:// or https://.", "error"); return { handled: true }; }
  try {
    const profile = await apiGet("/api/v1/profiles/me");
    const existing = profile.socialLinks || [];
    const updated = [...existing.filter((l: any) => l.platform !== platform), { platform, url, isPublic: true }];
    await apiPatch("/api/v1/profiles/me", { socialLinks: updated });
    ctx.addSys(`✅ Linked ${platform}.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to link."), "error"); }
  return { handled: true };
}

export async function handleUnlink(ctx: HandlerContext): Promise<HandlerResult> {
  const provider = ctx.args[0];
  if (!provider) { ctx.addSys("Usage: /unlink <provider>", "error"); return { handled: true }; }
  try {
    const profile = await apiGet("/api/v1/profiles/me");
    const existing = profile.socialLinks || [];
    const updated = existing.filter((l: any) => l.platform !== provider);
    await apiPatch("/api/v1/profiles/me", { socialLinks: updated });
    ctx.addSys(`✅ Unlinked ${provider}.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to unlink."), "error"); }
  return { handled: true };
}

// ─── Needs Handlers ──────────────────────────────────────────

export async function handleNeeds(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/needs");
    const needs = data.needs || [];
    if (!needs.length) {
      ctx.addSys("No needs posted yet. Be the first! Use /post to create one.", "info");
      return { handled: true };
    }
    ctx.addSys(
      `📋 Needs (${needs.length})\n` +
      fmtTable(["ID", "Title", "Type", "Status"], needs.slice(0, 15).map((n: any) => [
        shortId(n.id),
        truncate(n.title, 36),
        fmtExchangeMode(n.exchangeMode),
        fmtStatus(n.status),
      ])) +
      `\n\n💡 /need <id> for details  |  /accept <id> to express interest`,
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load needs."), "error"); }
  return { handled: true };
}

export async function handleNeed(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /need <id>", "error"); return { handled: true }; }
  ctx.router.push(`/needs/${id}`);
  ctx.addSys(`Opening need ${id}...`, "info");
  return { handled: true };
}

export async function handleRecommended(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/needs/recommended");
    const needs = data.needs || [];
    if (!needs.length) { ctx.addSys("No recommended needs right now. Check back later!", "info"); return { handled: true }; }
    ctx.addSys(
      `📋 Recommended For You (${needs.length})\n` +
      fmtTable(["ID", "Title", "Type"], needs.slice(0, 10).map((n: any) => [shortId(n.id), truncate(n.title, 36), fmtExchangeMode(n.exchangeMode)])) +
      `\n\n💡 /accept <id> to express interest`,
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load recommendations."), "error"); }
  return { handled: true };
}

export async function handleNearby(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const loc = ctx.myProfile?.locationName;
    const url = loc ? `/api/v1/needs?location=${encodeURIComponent(loc)}&limit=10` : "/api/v1/needs?limit=10";
    const data = await apiGet(url);
    const needs = data.needs || [];
    if (!needs.length) { ctx.addSys("No nearby needs. Widen your search or post your own!", "info"); return { handled: true }; }
    ctx.addSys(
      `📍 Nearby Needs (${needs.length})\n` +
      fmtTable(["ID", "Title", "Location"], needs.slice(0, 10).map((n: any) => [shortId(n.id), truncate(n.title, 36), n.locationName || "—"])) +
      `\n\n💡 /accept <id> to express interest`,
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load nearby needs."), "error"); }
  return { handled: true };
}

export async function handleAcceptNeed(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const message = ctx.args.slice(1).join(" ");
  if (!id) { ctx.addSys("Usage: /accept <need-id> [message]", "error"); return { handled: true }; }
  if (message.length > 2000) { ctx.addSys("❌ Message must be under 2000 characters.", "error"); return { handled: true }; }
  try {
    await apiPost("/api/v1/acceptances", { needId: id, message: message || undefined });
    ctx.addSys("✅ Interest expressed! The poster will be notified.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to accept need."), "error"); }
  return { handled: true };
}

export async function handleInterests(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/needs/mine");
    const needs = Array.isArray(data) ? data : data.needs || [];
    const needsWithInterests = needs.filter((n: any) => (n._count?.acceptances || 0) > 0 || (n.acceptances?.length || 0) > 0);
    if (!needsWithInterests.length) { ctx.addSys("No interests on your needs yet.", "info"); return { handled: true }; }
    let out = "📋 Interests on Your Needs\n";
    for (const need of needsWithInterests.slice(0, 10)) {
      const acceptances = need.acceptances || [];
      out += `\n  #${shortId(need.id)} ${truncate(need.title, 30)}\n`;
      for (const a of acceptances.slice(0, 5)) {
        out += `    • ${a.user?.fullName || "Someone"} — /select ${shortId(a.id)}\n`;
      }
    }
    ctx.addSys(out, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load interests."), "error"); }
  return { handled: true };
}

export async function handleSelectInterest(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /select <acceptance-id>", "error"); return { handled: true }; }
  try {
    const res = await fetch(`/api/v1/acceptances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "selected" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.contract) {
        ctx.addSys(`✅ Contract formed! ID: ${shortId(data.contract.id)}`, "success");
      } else {
        ctx.addSys("✅ Interest selected.", "success");
      }
      return { handled: true };
    }
    const errData = await res.json().catch(() => ({}));
    if (errData.error?.includes("does not require a formal contract")) {
      const acceptRes = await fetch(`/api/v1/acceptances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (acceptRes.ok) {
        ctx.addSys("✅ Interest accepted. Deal is now active!", "success");
      } else {
        const acceptErr = await acceptRes.json().catch(() => ({}));
        ctx.addSys(acceptErr.error || "Failed to select interest.", "error");
      }
      return { handled: true };
    }
    ctx.addSys(errData.error || "Failed to select interest.", "error");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to select interest."), "error"); }
  return { handled: true };
}

export async function handleDeclineInterest(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /decline interest <acceptance-id>", "error"); return { handled: true }; }
  try {
    await apiPatch(`/api/v1/acceptances/${id}`, { status: "declined" });
    ctx.addSys("✅ Interest declined.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to decline interest."), "error"); }
  return { handled: true };
}

export async function handleMarkComplete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /mark-complete <contract-id>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/complete`);
    ctx.addSys(getCelebrationBanner("Contract marked complete! +25 XP"), "success");
    const newXp = ctx.session.xp + 25;
    ctx.setSession({ ...ctx.session, xp: newXp, badges: [...ctx.session.badges] });
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to mark complete."), "error"); }
  return { handled: true };
}

export async function handleRepost(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /repost <need-id>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/needs/${id}/repost`);
    ctx.addSys("✅ Need reposted! It will appear at the top of the feed.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to repost."), "error"); }
  return { handled: true };
}

export async function handleNeedClose(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /need-close <need-id>", "error"); return { handled: true }; }
  if (!confirm("Are you sure you want to close this need? It will be archived.")) return { handled: true };
  try {
    await apiPatch(`/api/v1/needs/${id}`, { status: "archived" });
    ctx.addSys(`✅ Need ${id} archived.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to archive need."), "error"); }
  return { handled: true };
}

export async function handleNeedDelete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /need-delete <need-id>", "error"); return { handled: true }; }
  if (!confirm("Are you sure you want to delete this need?")) return { handled: true };
  try {
    await apiDelete(`/api/v1/needs/${id}`);
    ctx.addSys(`✅ Need ${id} deleted.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to delete need."), "error"); }
  return { handled: true };
}


// ─── Contracts Handlers ──────────────────────────────────────

export async function handleContracts(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/contracts/mine");
    const contracts = Array.isArray(data) ? data : data.contracts || [];
    if (!contracts.length) {
      ctx.addSys("No contracts yet. Accept a need to start one!", "info");
      return { handled: true };
    }
    const rows = contracts.slice(0, 15).map((c: any) => [
      shortId(c.id),
      truncate(c.need?.title || "—", 30),
      fmtStatus(c.status),
      c.partyA?.fullName || "—",
      c.partyB?.fullName || "—",
    ]);
    ctx.addSys(
      `📜 Your Contracts (${contracts.length})\n` +
      fmtTable(["ID", "Need", "Status", "Party A", "Party B"], rows) +
      `\n\n💡 /contract <id> for details  |  /sign <id>  |  /complete <id>`,
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load contracts."), "error"); }
  return { handled: true };
}

export async function handleContract(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /contract <id>", "error"); return { handled: true }; }
  ctx.router.push(`/contracts/${id}`);
  ctx.addSys(`Opening contract ${id}...`, "info");
  return { handled: true };
}

export async function handleSign(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const signature = ctx.args.slice(1).join(" ") || undefined;
  if (!id) { ctx.addSys("Usage: /sign <contract-id> [signature]", "error"); return { handled: true }; }
  if (signature && signature.length > 500) { ctx.addSys("❌ Signature must be under 500 characters.", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/sign`, signature ? { signature } : undefined);
    const contract = await apiGet(`/api/v1/contracts/${id}`);
    const c = contract.contract || contract;
    const isPartyA = c.partyAId === ctx.user.id;
    ctx.addSys(
      getCelebrationBanner("Contract Signed! ✅") + "\n\n" +
      contractPipeline(
        c.status,
        isPartyA,
        c.partyASigned,
        c.partyBSigned,
        c.aMarkedComplete,
        c.bMarkedComplete
      ),
      "success"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to sign contract."), "error"); }
  return { handled: true };
}

export async function handleComplete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /complete <contract-id>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/complete`);
    const contract = await apiGet(`/api/v1/contracts/${id}`);
    const c = contract.contract || contract;
    const isPartyA = c.partyAId === ctx.user.id;
    ctx.addSys(
      getTrophyArt() + "\n\n" +
      getCelebrationBanner("Deal Complete! +50 XP") + "\n\n" +
      contractPipeline(
        c.status,
        isPartyA,
        c.partyASigned,
        c.partyBSigned,
        c.aMarkedComplete,
        c.bMarkedComplete
      ),
      "success"
    );
    const newXp = ctx.session.xp + 50;
    ctx.setSession({ ...ctx.session, xp: newXp });
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to complete contract."), "error"); }
  return { handled: true };
}

export async function handleCancel(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const reason = ctx.args.slice(1).join(" ") || "Cancelled via terminal";
  if (!id) { ctx.addSys("Usage: /cancel <contract-id> [reason]", "error"); return { handled: true }; }
  if (reason.length > 2000) { ctx.addSys("❌ Reason must be under 2000 characters.", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/cancel`, { reason });
    ctx.addSys("✅ Contract cancelled.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to cancel contract."), "error"); }
  return { handled: true };
}

export async function handleRequestCancel(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const reason = ctx.args.slice(1).join(" ") || "Cancel request via terminal";
  if (!id) { ctx.addSys("Usage: /request-cancel <contract-id> [reason]", "error"); return { handled: true }; }
  if (reason.length > 2000) { ctx.addSys("❌ Reason must be under 2000 characters.", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/request-cancel`, { reason });
    ctx.addSys("✅ Cancellation requested. The other party will be notified.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to request cancel."), "error"); }
  return { handled: true };
}

export async function handleRespondCancel(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const action = ctx.args[1]?.toLowerCase();
  if (!id || !action || (action !== "approve" && action !== "reject")) {
    ctx.addSys("Usage: /respond-cancel <contract-id> approve|reject", "error");
    return { handled: true };
  }
  try {
    await apiPost(`/api/v1/contracts/${id}/respond-cancel`, { action });
    ctx.addSys(`✅ Cancellation ${action}d.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to respond."), "error"); }
  return { handled: true };
}

export async function handleRemind(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /remind <contract-id>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/remind-sign`);
    ctx.addSys("✅ Reminder sent.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to send reminder."), "error"); }
  return { handled: true };
}

export async function handleTerms(ctx: HandlerContext): Promise<HandlerResult> {
  const action = ctx.args[0]?.toLowerCase();
  if (action === "submit") {
    const id = ctx.args[1];
    if (!id) { ctx.addSys("Usage: /terms submit <contract-id>", "error"); return { handled: true }; }
    try {
      await apiPatch(`/api/v1/contracts/${id}`, { submitTerms: true });
      ctx.addSys("✅ Terms submitted.", "success");
    } catch (err) { ctx.addSys(friendlyError(err, "Failed to submit terms."), "error"); }
    return { handled: true };
  }
  if (action === "agree") {
    const id = ctx.args[1];
    if (!id) { ctx.addSys("Usage: /terms agree <contract-id>", "error"); return { handled: true }; }
    try {
      await apiPatch(`/api/v1/contracts/${id}`, { agree: true });
      ctx.addSys("✅ Terms agreed.", "success");
    } catch (err) { ctx.addSys(friendlyError(err, "Failed to agree to terms."), "error"); }
    return { handled: true };
  }
  const id = ctx.args[0];
  const text = ctx.args.slice(1).join(" ");
  if (!id || !text) { ctx.addSys("Usage: /terms <contract-id> <terms text> OR /terms submit|agree <id>", "error"); return { handled: true }; }
  if (text.length > 5000) { ctx.addSys("❌ Terms text must be under 5000 characters.", "error"); return { handled: true }; }
  try {
    await apiPatch(`/api/v1/contracts/${id}`, { terms: text });
    ctx.addSys("✅ Terms proposed.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to propose terms."), "error"); }
  return { handled: true };
}

export async function handleEscalate(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /escalate <contract-id>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/contracts/${id}/escalate-cancel`);
    ctx.addSys("🛡️ Contract escalated to dispute resolution. An admin will review.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to escalate."), "error"); }
  return { handled: true };
}

// ─── Reviews Handlers ────────────────────────────────────────

export async function handleReviews(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  ctx.addSys(
    `⭐ Your Reputation\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `   Rating:    ${fmtRating(p?.ratingAvg, p?.ratingCount)}\n` +
    `   Jobs Done: ${p?.jobsCompleted ?? 0}\n\n` +
    `💡 /review <contract-id> <rating 1-10> [comment] to leave a review`,
    "info"
  );
  return { handled: true };
}

export async function handleReview(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  const rating = parseInt(ctx.args[1] || "0", 10);
  const comment = ctx.args.slice(2).join(" ");
  if (!id || !rating || rating < 1 || rating > 10) {
    // Start review wizard if no args provided
    const [contractsData, acceptancesData] = await Promise.all([
      apiGet("/api/v1/contracts/mine").then((d: any) => Array.isArray(d) ? d : d.contracts || []),
      apiGet("/api/v1/acceptances/mine").then((d: any) => Array.isArray(d) ? d : d.acceptances || []),
    ]);
    const completedContracts = contractsData.filter((c: any) => c.status === "completed");
    const completedAcceptances = acceptancesData.filter((a: any) => a.status === "completed" || a.status === "accepted");
    const choices = [
      ...completedContracts.map((c: any) => ({ value: c.id, label: `Contract: ${c.need?.title || c.id.slice(0, 8)}` })),
      ...completedAcceptances.map((a: any) => ({ value: a.id, label: `Acceptance: ${a.need?.title || a.id.slice(0, 8)}` })),
    ];
    if (choices.length === 0) {
      ctx.addSys("No completed deals to review yet. Complete a deal first!", "info");
      return { handled: true };
    }
    const wizard = createReviewWizard(choices);
    ctx.setWizard(wizard);
    ctx.addSys(wizard.prompt, "info");
    return { handled: true };
  }
  try {
    const [contracts, acceptances] = await Promise.all([
      apiGet("/api/v1/contracts/mine").then((d: any) => Array.isArray(d) ? d : d.contracts || []),
      apiGet("/api/v1/acceptances/mine").then((d: any) => Array.isArray(d) ? d : d.acceptances || []),
    ]);
    const contract = contracts.find((c: any) => c.id === id || c.id.startsWith(id));
    if (contract) {
      const isPartyA = contract.partyAId === ctx.myProfile?.id;
      const receiverId = isPartyA ? contract.partyBId : contract.partyAId;
      await apiPost("/api/v1/reviews", { contractId: contract.id, receiverId, rating, comment });
      ctx.addSys("✅ Review submitted! +10 XP", "success");
      ctx.setSession({ ...ctx.session, xp: ctx.session.xp + 10 });
      return { handled: true };
    }
    const acceptance = acceptances.find((a: any) => a.id === id || a.id.startsWith(id));
    if (acceptance) {
      const needData = await apiGet(`/api/v1/needs/${acceptance.need?.id || id}`);
      const need = needData.need || needData;
      const receiverId = acceptance.userId === ctx.myProfile?.id ? need.posterId : acceptance.userId;
      await apiPost("/api/v1/reviews", { acceptanceId: acceptance.id, receiverId, rating, comment });
      ctx.addSys("✅ Review submitted! +10 XP", "success");
      ctx.setSession({ ...ctx.session, xp: ctx.session.xp + 10 });
      return { handled: true };
    }
    ctx.addSys("No completed contract or deal found with that ID.", "error");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to submit review."), "error"); }
  return { handled: true };
}

// ─── Notifications Handlers ──────────────────────────────────

export async function handleNotifications(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/notifications");
    const notifs = data.notifications || [];
    const unread = notifs.filter((n: any) => !n.readAt);
    if (!notifs.length) { ctx.addSys("📭 No notifications.", "info"); return { handled: true }; }
    ctx.addSys(
      `🔔 Notifications (${unread.length} unread, ${notifs.length} total)\n` +
      notifs.slice(0, 10).map((n: any) => `  ${n.readAt ? " " : "●"} ${truncate(n.title, 50)} — ${formatTime(n.createdAt)}`).join("\n") +
      `\n\n💡 /read <id> to mark read  |  /readall to clear all`,
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load notifications."), "error"); }
  return { handled: true };
}

export async function handleRead(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /read <notification-id>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/notifications/${id}/read`);
    ctx.addSys("✅ Marked as read.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed."), "error"); }
  return { handled: true };
}

export async function handleReadAll(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    await apiPost("/api/v1/notifications/read-all");
    ctx.addSys("✅ All notifications marked as read.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed."), "error"); }
  return { handled: true };
}

export async function handleActivity(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/terminal/activity");
    const activities = data.items || [];
    if (!activities.length) { ctx.addSys("No recent activity.", "info"); return { handled: true }; }
    ctx.addSys(
      `📈 Recent Activity\n` +
      activities.slice(0, 10).map((a: any) => `  • ${a.type}: ${truncate(a.description, 50)} — ${formatTime(a.createdAt)}`).join("\n"),
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load activity."), "error"); }
  return { handled: true };
}

// ─── Discovery Handlers ──────────────────────────────────────

export async function handleSearch(ctx: HandlerContext): Promise<HandlerResult> {
  const query = ctx.args.join(" ").trim();
  if (!query) { ctx.addSys("Usage: /search <query>", "error"); return { handled: true }; }
  try {
    const data = await apiGet(`/api/v1/search?q=${encodeURIComponent(query)}`);
    const needs = data.needs || [];
    const users = data.users || [];
    const pros = data.pros || [];
    let text = `🔍 Results for "${query}"\n`;
    if (needs.length) text += `\n📋 Needs (${needs.length}):\n${needs.slice(0, 5).map((n: any) => `  • ${truncate(n.title, 40)} — /need ${shortId(n.id)}`).join("\n")}`;
    if (users.length) text += `\n\n👤 Users (${users.length}):\n${users.slice(0, 5).map((u: any) => `  • ${u.fullName || "Anonymous"} — /profile ${shortId(u.id)}`).join("\n")}`;
    if (pros.length) text += `\n\n⭐ Pros (${pros.length}):\n${pros.slice(0, 5).map((p: any) => `  • ${p.fullName || "Anonymous"} ${fmtRating(p.ratingAvg, p.ratingCount)}`).join("\n")}`;
    if (!needs.length && !users.length && !pros.length) text += "\n  No results found.";
    ctx.addSys(text, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Search failed."), "error"); }
  return { handled: true };
}

export async function handleSkillDiscovery(ctx: HandlerContext): Promise<HandlerResult> {
  const skill = ctx.args.join(" ").trim();
  if (!skill) { ctx.addSys("Usage: /skill <name>", "error"); return { handled: true }; }
  try {
    const [needsData, prosData] = await Promise.all([
      apiGet(`/api/v1/needs?skill=${encodeURIComponent(skill)}&limit=10`),
      apiGet("/api/v1/pros"),
    ]);
    const needs = needsData.needs || [];
    const matchingPros = (Array.isArray(prosData) ? prosData : prosData.pros || []).filter((p: any) => p.skills?.some((s: any) => (s.name || s).toLowerCase().includes(skill.toLowerCase())));
    let text = `🔍 Skill: "${skill}"\n`;
    if (needs.length) text += `\n📋 Matching Needs (${needs.length}):\n${needs.slice(0, 8).map((n: any) => `  • ${truncate(n.title, 36)} — /need ${shortId(n.id)}`).join("\n")}`;
    else text += "\n📋 No matching needs.";
    if (matchingPros.length) text += `\n\n⭐ Matching Pros (${matchingPros.length}):\n${matchingPros.slice(0, 8).map((p: any) => `  • ${p.fullName || "Anonymous"} ${fmtRating(p.ratingAvg, p.ratingCount)}`).join("\n")}`;
    ctx.addSys(text, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't search."), "error"); }
  return { handled: true };
}

export async function handlePros(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiGet("/api/v1/pros");
    const pros = Array.isArray(data) ? data : data.pros || [];
    if (!pros.length) { ctx.addSys("No verified pros yet.", "info"); return { handled: true }; }
    const rows = pros.slice(0, 15).map((p: any) => [shortId(p.id), p.fullName || "Anonymous", fmtRating(p.ratingAvg, p.ratingCount), p.locationName || "—"]);
    ctx.addSys(`⭐ Verified Pros (${pros.length})\n\n${fmtTable(["ID", "Name", "Rating", "Location"], rows)}\n\n💡 /profile <name> to view`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load pros."), "error"); }
  return { handled: true };
}

// ─── Social Handlers ─────────────────────────────────────────

export async function handleUsers(ctx: HandlerContext): Promise<HandlerResult> {
  const query = ctx.args.join(" ");
  if (!query) { ctx.addSys("Usage: /users <name>", "error"); return { handled: true }; }
  try {
    const data = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(query)}`);
    if (!data.users?.length) { ctx.addSys(`No one found matching "${query}".`, "error"); return { handled: true }; }
    ctx.addSys(`Found ${data.users.length} member(s):\n${data.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}${u.locationName ? ` — ${u.locationName}` : ""}  →  ${u.id}`).join("\n")}`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Search failed."), "error"); }
  return { handled: true };
}

export async function handleProfileView(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.args[0]) { ctx.addSys("Usage: /profile <name-or-id>", "error"); return { handled: true }; }
  const target = ctx.args[0];
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(target)) {
    ctx.router.push(`/profile/${target}`);
    return { handled: true };
  }
  try {
    const data = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(target)}`);
    if (!data.users?.length) { ctx.addSys(`No one found matching "${target}".`, "error"); return { handled: true }; }
    if (data.users.length === 1) { ctx.router.push(`/profile/${data.users[0].id}`); return { handled: true }; }
    ctx.addSys(`Multiple matches:\n${data.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}`).join("\n")}`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Search failed."), "error"); }
  return { handled: true };
}

export async function handleWho(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.onlineUsers.length) { ctx.addSys("No one else is online right now. 🎉", "info"); return { handled: true }; }
  ctx.addSys(`${ctx.onlineUsers.length} user(s) online:\n${ctx.onlineUsers.map((u) => `  • ${u.fullName || "Anonymous"}`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleFriend(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) { ctx.addSys("Usage: /friend <username>", "error"); return { handled: true }; }
  try {
    const search = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(target)}`);
    if (!search.users?.length) { ctx.addSys(`No one found matching "${target}".`, "error"); return { handled: true }; }
    if (search.users.length > 1) { ctx.addSys(`Multiple matches:\n${search.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}`).join("\n")}`, "info"); return { handled: true }; }
    await apiPost("/api/v1/terminal/friends", { userId: search.users[0].id });
    ctx.addSys(`✅ ${search.users[0].fullName || "User"} is now your friend!`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't add friend."), "error"); }
  return { handled: true };
}

export async function handleUnfriend(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) { ctx.addSys("Usage: /unfriend <username>", "error"); return { handled: true }; }
  try {
    const list = await apiGet("/api/v1/terminal/friends");
    const match = list.friends?.find((f: any) => (f.user.fullName || "").toLowerCase().includes(target.toLowerCase()));
    if (!match) { ctx.addSys(`No friend matches "${target}".`, "error"); return { handled: true }; }
    await apiDelete(`/api/v1/terminal/friends/${match.id}`);
    ctx.addSys(`✅ ${match.user.fullName || "User"} removed from friends.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't remove friend."), "error"); }
  return { handled: true };
}

export async function handleFriends(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const list = await apiGet("/api/v1/terminal/friends");
    if (!list.friends?.length) { ctx.addSys("No friends yet. Use /friend <username> to add someone.", "info"); return { handled: true }; }
    ctx.addSys(`Your friends:\n${list.friends.map((f: any, i: number) => `  ${i + 1}. ${f.user.fullName || "Anonymous"}`).join("\n")}`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load friends."), "error"); }
  return { handled: true };
}

export async function handleBlock(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) { ctx.addSys("Usage: /block <username>", "error"); return { handled: true }; }
  try {
    const search = await apiGet(`/api/v1/terminal/users/search?q=${encodeURIComponent(target)}`);
    if (!search.users?.length) { ctx.addSys(`No one found matching "${target}".`, "error"); return { handled: true }; }
    if (search.users.length > 1) { ctx.addSys(`Multiple matches:\n${search.users.map((u: any, i: number) => `  ${i + 1}. ${u.fullName || "Anonymous"}`).join("\n")}`, "info"); return { handled: true }; }
    await apiPost("/api/v1/terminal/blocks", { blockedId: search.users[0].id });
    ctx.addSys(`✅ ${search.users[0].fullName || "User"} blocked.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't block user."), "error"); }
  return { handled: true };
}

export async function handleUnblock(ctx: HandlerContext): Promise<HandlerResult> {
  const target = ctx.args.join(" ").trim();
  if (!target) { ctx.addSys("Usage: /unblock <username>", "error"); return { handled: true }; }
  try {
    const list = await apiGet("/api/v1/terminal/blocks");
    const match = list.blocks?.find((b: any) => (b.user.fullName || "").toLowerCase().includes(target.toLowerCase()));
    if (!match) { ctx.addSys(`No blocked user matches "${target}".`, "error"); return { handled: true }; }
    await apiDelete(`/api/v1/terminal/blocks/${match.id}`);
    ctx.addSys(`✅ ${match.user.fullName || "User"} unblocked.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't unblock user."), "error"); }
  return { handled: true };
}

export async function handleBlocks(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const list = await apiGet("/api/v1/terminal/blocks");
    if (!list.blocks?.length) { ctx.addSys("You haven't blocked anyone.", "info"); return { handled: true }; }
    ctx.addSys(`Blocked users:\n${list.blocks.map((b: any, i: number) => `  ${i + 1}. ${b.user.fullName || "Anonymous"}`).join("\n")}`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load block list."), "error"); }
  return { handled: true };
}


// ─── Credential Handlers ─────────────────────────────────────

export async function handleCredentialAdd(ctx: HandlerContext): Promise<HandlerResult> {
  const wizard = createWizard("credential");
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}

export async function handleCredentialList(ctx: HandlerContext): Promise<HandlerResult> {
  return handleCredentials(ctx);
}

export async function handleCredentialShare(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /credential share <credentialId>", "error"); return { handled: true }; }
  try {
    const data = await apiPost(`/api/v1/credentials/${id}/share`);
    ctx.addSys(`📋 ${data.shareText || "Share link generated."}`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't share credential."), "error"); }
  return { handled: true };
}

export async function handleCredentialDelete(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /credential delete <credentialId>", "error"); return { handled: true }; }
  try {
    await apiDelete(`/api/v1/credentials/${id}`);
    ctx.addSys("✅ Credential deleted.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't delete credential."), "error"); }
  return { handled: true };
}

// ─── Pro & Billing Handlers ──────────────────────────────────

export async function handleProClaim(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    await apiPost("/api/v1/pro/claim");
    ctx.addSys(`✅ Pro status claimed!\n\n🎉 +100 XP`, "success");
    ctx.setSession({ ...ctx.session, xp: ctx.session.xp + 100 });
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("verified") || msg.includes("mobile")) {
      ctx.addSys(`❌ You need to be verified with a verified mobile number.\n\n💡 /credential add to verify identity`, "error");
    } else {
      ctx.addSys(friendlyError(err, "Couldn't claim Pro status."), "error");
    }
  }
  return { handled: true };
}

export async function handleProStatus(ctx: HandlerContext): Promise<HandlerResult> {
  const p = ctx.myProfile;
  if (!p?.isPro) {
    ctx.addSys(
      `⭐ Pro Status\n\n  You are not a Pro member yet.\n\n  Benefits:\n    • Enhanced visibility\n    • Directory listing\n    • Trust badge\n    • Emergency support\n\n  → /pro claim to check eligibility`,
      "info"
    );
    return { handled: true };
  }
  ctx.addSys(
    `⭐ Pro Status\n\n  ✅ Active Pro Member\n  Plan: ${p.proSource || "Free Trial"}\n  Directory: ${p.showInDirectory ? "✅ Listed" : "❌ Hidden"}`,
    "info"
  );
  return { handled: true };
}

export async function handleSubscribe(ctx: HandlerContext): Promise<HandlerResult> {
  try {
    const data = await apiPost("/api/v1/billing/checkout");
    if (data.url) {
      if (!isSafeUrl(data.url)) {
        ctx.addSys("❌ Checkout URL is invalid. Please use the web interface.", "error");
        return { handled: true };
      }
      window.open(data.url, "_blank");
      ctx.addSys("💳 Opening checkout...", "success");
    } else {
      ctx.addSys("Couldn't start checkout.", "error");
    }
  } catch (err) { ctx.addSys(friendlyError(err, "Billing service unavailable."), "error"); }
  return { handled: true };
}

// ─── Admin Handlers ──────────────────────────────────────────

export async function handleAdminStats(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  try {
    const data = await apiGet("/api/v1/admin/stats");
    const s = data;
    ctx.addSys(
      `🛡️ Admin Dashboard\n\n` +
      fmtCard({
        "Users:": s.totalUsers?.toString() || "—",
        "Pros:": s.totalPros?.toString() || "—",
        "Needs:": s.totalNeeds?.toString() || "—",
        "Contracts:": s.totalContracts?.toString() || "—",
        "Pending Verifications:": s.pendingVerifications?.toString() || "—",
        "Escalated Cancellations:": s.pendingContractCancellations?.toString() || "—",
      }) +
      `\n\n💡 /admin users  |  /admin verifications  |  /admin contracts`,
      "info"
    );
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load admin stats."), "error"); }
  return { handled: true };
}

export async function handleAdminVerifications(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  try {
    const data = await apiGet("/api/v1/admin/pending-credentials");
    const creds = data.credentials || [];
    if (!creds.length) { ctx.addSys("🛡️ No pending verifications.", "info"); return { handled: true }; }
    const rows = creds.map((c: any) => [shortId(c.id), c.user?.fullName || "—", c.type, c.title]);
    ctx.addSys(`🛡️ Pending Verifications (${creds.length})\n\n${fmtTable(["ID", "User", "Type", "Title"], rows)}\n\n💡 /admin verify <id>  |  /admin reject <id> <reason>`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load verifications."), "error"); }
  return { handled: true };
}

export async function handleAdminVerify(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /admin verify <credentialId>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/admin/credentials/${id}/verify`);
    ctx.addSys("✅ Credential verified.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't verify credential."), "error"); }
  return { handled: true };
}

export async function handleAdminReject(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const id = ctx.args[0];
  const reason = ctx.args.slice(1).join(" ").trim();
  if (!id) { ctx.addSys("Usage: /admin reject <credentialId> <reason>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/admin/credentials/${id}/reject`, { reason: reason || "Rejected by admin" });
    ctx.addSys(`✅ Credential rejected. Reason: ${reason || "Rejected by admin"}`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't reject credential."), "error"); }
  return { handled: true };
}

export async function handleAdminForceCancel(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /admin force-cancel <contractId>", "error"); return { handled: true }; }
  try {
    await apiPost(`/api/v1/admin/contracts/${id}/force-cancel`);
    ctx.addSys("✅ Contract force-cancelled.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't force-cancel."), "error"); }
  return { handled: true };
}

export async function handleAdminContracts(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  try {
    const data = await apiGet("/api/v1/admin/pending-cancellations");
    const contracts = data.contracts || [];
    if (!contracts.length) { ctx.addSys("🛡️ No escalated cancellation requests.", "info"); return { handled: true }; }
    const rows = contracts.map((c: any) => [shortId(c.id), c.need?.title || "—", c.partyA?.fullName || "—", c.partyB?.fullName || "—"]);
    ctx.addSys(`🛡️ Escalated Cancellations (${contracts.length})\n\n${fmtTable(["ID", "Need", "Party A", "Party B"], rows)}\n\n💡 /admin force-cancel <id>`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't load escalated cancellations."), "error"); }
  return { handled: true };
}

export async function handleAdminMsg(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const userId = ctx.args[0];
  const message = ctx.args.slice(1).join(" ").trim();
  if (!userId || !message) { ctx.addSys("Usage: /admin msg <userId> <message>", "error"); return { handled: true }; }
  try {
    await apiPost("/api/v1/terminal/dm/messages", { userId, content: `[Admin] ${message}` });
    ctx.addSys("✅ Message sent.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't send message."), "error"); }
  return { handled: true };
}

export async function handleAdminAnnounce(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const channel = ctx.args[0];
  const message = ctx.args.slice(1).join(" ").trim();
  if (!channel || !message) { ctx.addSys("Usage: /admin announce <channel-slug> <message>", "error"); return { handled: true }; }
  try {
    const chData = await apiGet("/api/v1/terminal/channels");
    const ch = chData.channels?.find((c: any) => c.slug === channel || c.id === channel);
    if (!ch) { ctx.addSys(`Channel "${channel}" not found.`, "error"); return { handled: true }; }
    await apiPost("/api/v1/terminal/messages", { channelId: ch.id, content: `[📢 Admin] ${message}` });
    ctx.addSys(`✅ Announcement sent to #${ch.slug}.`, "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Couldn't send announcement."), "error"); }
  return { handled: true };
}

export async function handleAdminUsers(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  try {
    const data = await apiGet("/api/v1/admin/users");
    const users = data.users || [];
    ctx.addSys(`Users (${users.length}):\n${users.slice(0, 20).map((u: any) => `  ${shortId(u.id)}: ${u.fullName || "Anonymous"}`).join("\n")}`, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to fetch users."), "error"); }
  return { handled: true };
}

// ─── Lab Handlers ────────────────────────────────────────────

export async function handleLab(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(
    `🧪 Personal Lab\n\n` +
    `  /lab draft <title>     → save a need draft\n` +
    `  /lab drafts            → list drafts\n` +
    `  /lab note <text>       → save a note\n` +
    `  /lab notes             → list notes\n` +
    `  /lab want <skill>      → add to want-list\n` +
    `  /lab wants             → show want-list\n` +
    `  /lab script <name>     → save a command script\n` +
    `  /lab scripts           → list scripts\n` +
    `  /lab run <name>        → execute a script\n` +
    `  /lab clear             → clear all lab data`,
    "info"
  );
  return { handled: true };
}

export async function handleLabDraft(ctx: HandlerContext): Promise<HandlerResult> {
  const title = ctx.args.join(" ").trim();
  if (!title) { ctx.addSys("Usage: /lab draft <title>", "error"); return { handled: true }; }
  const draft = { title, createdAt: new Date().toISOString() };
  const newSession = { ...ctx.session, lab: { ...ctx.session.lab, drafts: [...ctx.session.lab.drafts, draft] } };
  ctx.setSession(newSession);
  ctx.addSys(`📝 Draft saved: "${title}" (#${newSession.lab.drafts.length})`, "success");
  return { handled: true };
}

export async function handleLabDrafts(ctx: HandlerContext): Promise<HandlerResult> {
  const drafts = ctx.session.lab.drafts;
  if (!drafts.length) { ctx.addSys("No drafts yet. Use /lab draft <title> to create one.", "info"); return { handled: true }; }
  ctx.addSys(`📝 Drafts:\n${drafts.map((d: any, i: number) => `  ${i + 1}. ${d.title} (${new Date(d.createdAt).toLocaleDateString("en-AU")})`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleLabPost(ctx: HandlerContext): Promise<HandlerResult> {
  const idx = parseInt(ctx.args[0], 10) - 1;
  const drafts = ctx.session.lab.drafts;
  if (isNaN(idx) || idx < 0 || idx >= drafts.length) {
    ctx.addSys(`No draft #${ctx.args[0] || "?"}. You have ${drafts.length} draft(s).`, "error");
    return { handled: true };
  }
  const wizard = createWizard("post", { title: drafts[idx].title });
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}

export async function handleLabNote(ctx: HandlerContext): Promise<HandlerResult> {
  const text = ctx.args.join(" ").trim();
  if (!text) { ctx.addSys("Usage: /lab note <text>", "error"); return { handled: true }; }
  const newSession = { ...ctx.session, lab: { ...ctx.session.lab, notes: [...ctx.session.lab.notes, { text, createdAt: new Date().toISOString() }] } };
  ctx.setSession(newSession);
  ctx.addSys(`📝 Note saved (#${newSession.lab.notes.length}).`, "success");
  return { handled: true };
}

export async function handleLabNotes(ctx: HandlerContext): Promise<HandlerResult> {
  const notes = ctx.session.lab.notes;
  if (!notes.length) { ctx.addSys("No notes yet.", "info"); return { handled: true }; }
  ctx.addSys(`📝 Notes:\n${notes.map((n: any, i: number) => `  ${i + 1}. ${truncate(n.text, 60)}`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleLabWant(ctx: HandlerContext): Promise<HandlerResult> {
  const skill = ctx.args.join(" ").trim();
  if (!skill) { ctx.addSys("Usage: /lab want <skill>", "error"); return { handled: true }; }
  if (ctx.session.lab.wants.includes(skill)) { ctx.addSys(`"${skill}" is already on your want-list.`, "info"); return { handled: true }; }
  const newSession = { ...ctx.session, lab: { ...ctx.session.lab, wants: [...ctx.session.lab.wants, skill] } };
  ctx.setSession(newSession);
  ctx.addSys(`✅ "${skill}" added to want-list.`, "success");
  return { handled: true };
}

export async function handleLabWants(ctx: HandlerContext): Promise<HandlerResult> {
  const wants = ctx.session.lab.wants;
  if (!wants.length) { ctx.addSys("No wants saved yet.", "info"); return { handled: true }; }
  ctx.addSys(`📝 Skills to Learn:\n${fmtList(wants)}`, "info");
  return { handled: true };
}

export async function handleLabScript(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  const commands = ctx.args.slice(1).join(" ").trim().replace(/^"|"$/g, "");
  if (!name || !commands) { ctx.addSys(`Usage: /lab script <name> "<cmds>"`, "error"); return { handled: true }; }
  const cmds = commands.split(";").map((c) => c.trim()).filter(Boolean);
  const newSession = { ...ctx.session, lab: { ...ctx.session.lab, scripts: { ...ctx.session.lab.scripts, [name]: cmds } } };
  ctx.setSession(newSession);
  ctx.addSys(`✅ Script "${name}" saved (${cmds.length} commands).`, "success");
  return { handled: true };
}

export async function handleLabScripts(ctx: HandlerContext): Promise<HandlerResult> {
  const scripts = Object.entries(ctx.session.lab.scripts);
  if (!scripts.length) { ctx.addSys("No scripts saved yet.", "info"); return { handled: true }; }
  ctx.addSys(`📝 Scripts:\n${scripts.map(([name, cmds]) => `  • ${name}: ${(cmds as string[]).join("; ")}`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleLabRun(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  if (!name) { ctx.addSys("Usage: /lab run <scriptName>", "error"); return { handled: true }; }
  const cmds = ctx.session.lab.scripts[name];
  if (!cmds) { ctx.addSys(`Script "${name}" not found.`, "error"); return { handled: true }; }
  ctx.addSys(`🧪 Running "${name}":\n${cmds.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}\n\n(Type each command to execute)`, "info");
  return { handled: true };
}

export async function handleLabClear(ctx: HandlerContext): Promise<HandlerResult> {
  const newSession = { ...ctx.session, lab: { drafts: [], notes: [], wants: [], scripts: {}, folders: [] } };
  ctx.setSession(newSession);
  ctx.addSys("🧪 Lab cleared.", "success");
  return { handled: true };
}

// ─── Shell / Filesystem Handlers ─────────────────────────────

export async function handleLs(ctx: HandlerContext): Promise<HandlerResult> {
  const path = ctx.args[0] || ctx.session.cwd || "/";
  const tree: Record<string, string[]> = {
    "/": ["home/", "community/", "discovery/"],
    "/home": ["needs/", "contracts/", "contacts/", "credentials/", "lab/"],
    "/home/needs": ["active/", "archived/"],
    "/home/contracts": ["pending/", "active/", "completed/", "cancelled/"],
    "/community": ["channels/", "messages/"],
    "/discovery": ["pros/", "nearby/"],
  };
  const items = tree[path] || tree[path.replace(/\/$/, "")] || tree[`${path}/`] || [];
  if (!items.length) {
    if (path.includes("needs/active")) return handleNeeds({ ...ctx, args: ["mine"] });
    if (path.includes("contracts/pending")) return handleContracts({ ...ctx, args: ["pending"] });
    if (path.includes("contracts/active")) return handleContracts({ ...ctx, args: ["active"] });
    ctx.addSys(`📁 ${path}\n  (empty)\n\n💡 /cd <path> to navigate`, "info");
    return { handled: true };
  }
  ctx.addSys(`📁 ${path}\n${items.map((i) => `  ${i}`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleCd(ctx: HandlerContext): Promise<HandlerResult> {
  const path = ctx.args[0] || "/";
  if (path === ".." || path === "../") {
    const parts = ctx.session.cwd.split("/").filter(Boolean);
    parts.pop();
    const newPath = "/" + parts.join("/");
    const newSession = { ...ctx.session, cwd: newPath || "/" };
    ctx.setSession(newSession);
    ctx.addSys(`📁 ${newSession.cwd}`, "info");
    return { handled: true };
  }
  const newPath = path.startsWith("/") ? path : `${ctx.session.cwd}/${path}`.replace(/\/+/g, "/");
  const newSession = { ...ctx.session, cwd: newPath };
  ctx.setSession(newSession);
  ctx.addSys(`📁 ${newPath}`, "info");
  return { handled: true };
}

export async function handlePwd(ctx: HandlerContext): Promise<HandlerResult> {
  ctx.addSys(`📁 ${ctx.session.cwd}`, "info");
  return { handled: true };
}

export async function handleCat(ctx: HandlerContext): Promise<HandlerResult> {
  const path = ctx.args[0];
  if (!path) { ctx.addSys("Usage: /cat <path-or-id>", "error"); return { handled: true }; }
  if (/^[a-f0-9]{8}$/i.test(path)) {
    try { return await handleNeed({ ...ctx, args: [path] }); } catch {
      try { return await handleContract({ ...ctx, args: [path] }); } catch {
        ctx.addSys(`No item found with ID "${path}".`, "error");
        return { handled: true };
      }
    }
  }
  ctx.addSys(`📄 ${path}\n  (use /need <id> or /contract <id> for details)`, "info");
  return { handled: true };
}

export async function handleSetEnv(ctx: HandlerContext): Promise<HandlerResult> {
  const key = ctx.args[0];
  const value = ctx.args.slice(1).join(" ").trim();
  if (!key) { ctx.addSys("Usage: /set <key> <value>", "error"); return { handled: true }; }
  const newSession = { ...ctx.session, env: { ...ctx.session.env, [key]: value } };
  ctx.setSession(newSession);
  ctx.addSys(`✅ $${key} = "${value}"`, "success");
  return { handled: true };
}

export async function handleUnsetEnv(ctx: HandlerContext): Promise<HandlerResult> {
  const key = ctx.args[0];
  if (!key) { ctx.addSys("Usage: /unset <key>", "error"); return { handled: true }; }
  const env = { ...ctx.session.env };
  delete env[key];
  ctx.setSession({ ...ctx.session, env });
  ctx.addSys(`✅ $${key} removed.`, "success");
  return { handled: true };
}

export async function handleEnv(ctx: HandlerContext): Promise<HandlerResult> {
  const entries = Object.entries(ctx.session.env);
  if (!entries.length) { ctx.addSys("No environment variables set.", "info"); return { handled: true }; }
  ctx.addSys(`Environment:\n${entries.map(([k, v]) => `  $${k} = "${v}"`).join("\n")}`, "info");
  return { handled: true };
}

export async function handleAlias(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  const command = ctx.args.slice(1).join(" ").trim().replace(/^"|"$/g, "");
  if (!name || !command) {
    const aliases = Object.entries(ctx.session.aliases);
    if (!aliases.length) { ctx.addSys("No aliases set.", "info"); return { handled: true }; }
    ctx.addSys(`Aliases:\n${aliases.map(([k, v]) => `  /${k} → ${v}`).join("\n")}`, "info");
    return { handled: true };
  }
  ctx.setSession({ ...ctx.session, aliases: { ...ctx.session.aliases, [name]: command } });
  ctx.addSys(`✅ Alias: /${name} → ${command}`, "success");
  return { handled: true };
}

export async function handleUnalias(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  if (!name) { ctx.addSys("Usage: /unalias <name>", "error"); return { handled: true }; }
  const aliases = { ...ctx.session.aliases };
  delete aliases[name];
  ctx.setSession({ ...ctx.session, aliases });
  ctx.addSys(`✅ Alias /${name} removed.`, "success");
  return { handled: true };
}

export async function handleMacro(ctx: HandlerContext): Promise<HandlerResult> {
  const name = ctx.args[0];
  const commands = ctx.args.slice(1).join(" ").trim().replace(/^"|"$/g, "");
  if (!name || !commands) {
    const macros = Object.entries(ctx.session.macros);
    if (!macros.length) { ctx.addSys("No macros set.", "info"); return { handled: true }; }
    ctx.addSys(`Macros:\n${macros.map(([k, v]) => `  /${k} → ${(v as string[]).join("; ")}`).join("\n")}`, "info");
    return { handled: true };
  }
  const cmds = commands.split(";").map((c) => c.trim()).filter(Boolean);
  ctx.setSession({ ...ctx.session, macros: { ...ctx.session.macros, [name]: cmds } });
  ctx.addSys(`✅ Macro: /${name} → ${cmds.join("; ")}`, "success");
  return { handled: true };
}

// ─── Intelligence Handlers ───────────────────────────────────

export async function handleAsk(ctx: HandlerContext): Promise<HandlerResult> {
  const question = ctx.args.join(" ").trim();
  if (!question) { ctx.addSys("Usage: /ask <question>", "error"); return { handled: true }; }
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
    const pendingSignatures = contracts.filter((c: any) => (c.status === "pending_terms" || c.status === "draft") && !((c.partyAId === ctx.myProfile?.id ? c.partyASigned : c.partyBSigned)));
    const pendingCompletions = contracts.filter((c: any) => c.status === "active" && !((c.partyAId === ctx.myProfile?.id ? c.aMarkedComplete : c.bMarkedComplete)));
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
  } catch (err) { ctx.addSys(friendlyError(err, "Agent failed."), "error"); }
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
    ctx.addSys(`Usage: /theme <name>\nAvailable: ${valid.join(", ")}\nCurrent: ${ctx.session.settings.theme}`, "error");
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
  const s = { ...ctx.session, settings: { ...ctx.session.settings, voiceEnabled: !ctx.session.settings.voiceEnabled } };
  ctx.setSession(s);
  ctx.addSys(`🎤 Voice input ${s.settings.voiceEnabled ? "enabled" : "disabled"}.`, "success");
  return { handled: true };
}


export async function handleNeedEdit(ctx: HandlerContext): Promise<HandlerResult> {
  const id = ctx.args[0];
  if (!id) { ctx.addSys("Usage: /need-edit <need-id>", "error"); return { handled: true }; }
  try {
    const data = await apiGet(`/api/v1/needs/${id}`);
    const need = data.need || data;
    if (!need) { ctx.addSys("Need not found.", "error"); return { handled: true }; }
    const wizard = createEditNeedWizard(need);
    ctx.setWizard(wizard);
    ctx.addSys(wizard.prompt, "info");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to load need for editing."), "error"); }
  return { handled: true };
}

export async function handleStaff(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const message = ctx.args.join(" ");
  if (!message) { ctx.addSys("Usage: /staff <message>", "error"); return { handled: true }; }
  try {
    const chData = await apiGet("/api/v1/terminal/channels");
    const staffCh = chData.channels?.find((c: any) => c.type === "staff");
    if (!staffCh) { ctx.addSys("No staff channel found.", "error"); return { handled: true }; }
    await apiPost("/api/v1/terminal/messages", { channelId: staffCh.id, content: message });
    ctx.addSys("✅ Message sent to staff channel.", "success");
  } catch (err) { ctx.addSys(friendlyError(err, "Failed to send staff message."), "error"); }
  return { handled: true };
}

export async function handleBan(ctx: HandlerContext): Promise<HandlerResult> {
  if (!ctx.isAdmin) { ctx.addSys("Admin only.", "error"); return { handled: true }; }
  const userId = ctx.args[0];
  if (!userId) { ctx.addSys("Usage: /ban <userId>", "error"); return { handled: true }; }
  ctx.addSys("Banning users via terminal is not yet implemented. Use the web admin panel.", "error");
  return { handled: true };
}

// ─── Command Dispatcher ──────────────────────────────────────

export async function dispatchCommand(
  cmd: string,
  args: string[],
  ctx: HandlerContext
): Promise<HandlerResult> {
  // Central adminOnly enforcement
  const registry = COMMANDS.find((c) => c.name === cmd);
  if (registry?.adminOnly && !ctx.isAdmin) {
    ctx.addSys("Admin only.", "error");
    return { handled: true };
  }

  // Inject args into context so handlers can access them
  const fullCtx = { ...ctx, args };

  switch (cmd) {
    // Chat / Navigation
    case "chat": case "channel": return handleChat(fullCtx);
    case "dm": case "msg": case "message": return handleDm(fullCtx);

    // System
    case "help": case "h": return handleHelp(fullCtx);
    case "commands": case "cmds": case "cmdlist": return handleCommands(fullCtx);
    case "whatis": case "explain": case "man": case "info": return handleWhatis(fullCtx);
    case "goto": case "nav": case "open": case "go": return handleGoto(fullCtx);
    case "history": case "past": return handleHistory(fullCtx);
    case "replay": case "rerun": return handleReplay(fullCtx);
    case "tips": case "hint": case "idea": return handleTips(fullCtx);
    case "clear": case "cls": case "reset": case "claer": return handleClear(fullCtx);
    case "id": case "myid": case "userid": case "ident": return handleId(fullCtx);
    case "exit": case "quit": case "leave": return handleExit(fullCtx);
    case "me": case "action": case "emote": return handleMe(fullCtx);

    // Profile
    case "whoami": case "iam": case "aboutme": return handleWhoami(fullCtx);
    case "stats": case "dashboard": case "dash": return handleStats(fullCtx);
    case "reputation": case "rating": case "myrating": return handleReputation(fullCtx);
    case "skills": case "myskills": return handleSkills(fullCtx);
    case "credentials": case "creds": case "badges": case "mycreds": return handleCredentials(fullCtx);

    // Profile Editing
    case "setbio": case "bio": return handleSetBio(fullCtx);
    case "setname": case "name": return handleSetName(fullCtx);
    case "location": case "loc": case "setlocation": return handleLocation(fullCtx);
    case "addskill": case "skilladd": return handleAddSkill(fullCtx);
    case "removeskill": case "skillremove": case "delskill": return handleRemoveSkill(fullCtx);
    case "phone": case "mobile": case "setphone": return handlePhone(fullCtx);
    case "directory": case "dir": return handleDirectory(fullCtx);
    case "link": case "sociallink": return handleLink(fullCtx);
    case "unlink": case "rmsociallink": return handleUnlink(fullCtx);

    // Needs
    case "needs": case "wall": case "browse": case "list": return handleNeeds(fullCtx);
    case "need": case "viewneed": case "showneed": return handleNeed(fullCtx);
    case "post": case "newneed": case "create": case "new": return handlePost(fullCtx);
    case "recommended": case "matches": case "foryou": return handleRecommended(fullCtx);
    case "nearby": case "local": case "aroundme": return handleNearby(fullCtx);
    case "accept": case "interest": case "apply": return handleAcceptNeed(fullCtx);
    case "interests": case "myinterests": return handleInterests(fullCtx);
    case "select": case "choose": case "pick": return handleSelectInterest(fullCtx);
    case "decline": case "reject": return handleDeclineInterest(fullCtx);
    case "mark-complete": case "markcomplete": case "ack": return handleMarkComplete(fullCtx);
    case "repost": case "renew": case "bump": return handleRepost(fullCtx);
    case "need-edit": case "editneed": return handleNeedEdit(fullCtx);
    case "need-close": case "closeneed": return handleNeedClose(fullCtx);
    case "need-delete": case "deleteneed": return handleNeedDelete(fullCtx);

    // Contracts
    case "contracts": case "deals": case "agreements": return handleContracts(fullCtx);
    case "contract": case "showcontract": case "deal": return handleContract(fullCtx);
    case "sign": case "agree": return handleSign(fullCtx);
    case "complete": case "finish": case "done": return handleComplete(fullCtx);
    case "cancel": case "abort": return handleCancel(fullCtx);
    case "request-cancel": case "reqcancel": return handleRequestCancel(fullCtx);
    case "respond-cancel": case "respcancel": return handleRespondCancel(fullCtx);
    case "remind": case "nudge": case "poke": return handleRemind(fullCtx);
    case "terms": case "propose": case "offerterms": return handleTerms(fullCtx);
    case "escalate": case "escal": return handleEscalate(fullCtx);

    // Reviews
    case "reviews": case "feedback": case "myreviews": return handleReviews(fullCtx);
    case "review": case "rate": case "rateuser": return handleReview(fullCtx);

    // Notifications
    case "notifications": case "notifs": case "inbox": case "notify": return handleNotifications(fullCtx);
    case "read": case "markread": return handleRead(fullCtx);
    case "readall": case "clearinbox": return handleReadAll(fullCtx);
    case "activity": case "feed": case "whatsup": return handleActivity(fullCtx);

    // Discovery
    case "search": case "find": case "lookup": return handleSearch(fullCtx);
    case "skill": case "tag": case "byskill": return handleSkillDiscovery(fullCtx);
    case "pros": case "experts": case "verified": return handlePros(fullCtx);

    // Social
    case "users": case "serch": return handleUsers(fullCtx);
    case "profile": case "prof": case "view": case "page": case "pofile": case "profle": case "userprofile": return handleProfileView(fullCtx);
    case "who": case "w": case "whos": case "woh": case "ho": return handleWho(fullCtx);
    case "friend": case "freind": case "freinds": case "addfriend": return handleFriend(fullCtx);
    case "unfriend": case "unfreind": case "removefriend": return handleUnfriend(fullCtx);
    case "friends": return handleFriends(fullCtx);
    case "block": case "blcok": case "blc": case "blk": return handleBlock(fullCtx);
    case "unblock": case "unblcok": case "unblk": return handleUnblock(fullCtx);
    case "blocks": return handleBlocks(fullCtx);

    // Credentials
    case "credential-add": case "addcredential": case "credadd": return handleCredentialAdd(fullCtx);
    case "credential-list": case "credlist": return handleCredentialList(fullCtx);
    case "credential-share": case "credshare": return handleCredentialShare(fullCtx);
    case "credential-delete": case "creddel": return handleCredentialDelete(fullCtx);

    // Pro
    case "pro-claim": case "claimpro": return handleProClaim(fullCtx);
    case "pro-status": case "proinfo": return handleProStatus(fullCtx);
    case "subscribe": case "renew": case "pro-renew": return handleSubscribe(fullCtx);

    // Admin
    case "admin-stats": case "adminstats": return handleAdminStats(fullCtx);
    case "admin-users": case "adminusers": return handleAdminUsers(fullCtx);
    case "admin-verifications": case "adminverifications": return handleAdminVerifications(fullCtx);
    case "admin-verify": case "adminverify": return handleAdminVerify(fullCtx);
    case "admin-reject": case "adminreject": return handleAdminReject(fullCtx);
    case "admin-force-cancel": case "adminforcecancel": return handleAdminForceCancel(fullCtx);
    case "admin-contracts": case "admincontracts": return handleAdminContracts(fullCtx);
    case "admin-msg": case "adminmessage": return handleAdminMsg(fullCtx);
    case "admin-announce": case "adminannounce": return handleAdminAnnounce(fullCtx);

    case "staff": return handleStaff(fullCtx);
    case "ban": return handleBan(fullCtx);

    // Lab
    case "lab": case "sandbox": case "playground": return handleLab(fullCtx);
    case "lab-draft": case "draft": return handleLabDraft(fullCtx);
    case "lab-drafts": case "drafts": return handleLabDrafts(fullCtx);
    case "lab-post": case "postdraft": return handleLabPost(fullCtx);
    case "lab-note": case "note": return handleLabNote(fullCtx);
    case "lab-notes": case "notes": return handleLabNotes(fullCtx);
    case "lab-want": case "want": return handleLabWant(fullCtx);
    case "lab-wants": case "wants": return handleLabWants(fullCtx);
    case "lab-script": case "script": return handleLabScript(fullCtx);
    case "lab-scripts": case "scripts": return handleLabScripts(fullCtx);
    case "lab-run": case "runscript": return handleLabRun(fullCtx);
    case "lab-clear": case "clearlab": return handleLabClear(fullCtx);

    // Shell
    case "ls": case "list": case "dir": return handleLs(fullCtx);
    case "cd": case "chdir": return handleCd(fullCtx);
    case "cat": case "show": case "view": return handleCat(fullCtx);
    case "pwd": case "cwd": return handlePwd(fullCtx);
    case "set": case "setenv": return handleSetEnv(fullCtx);
    case "unset": case "unsetenv": return handleUnsetEnv(fullCtx);
    case "env": case "environment": return handleEnv(fullCtx);
    case "alias": case "mkalias": return handleAlias(fullCtx);
    case "unalias": case "rmalias": return handleUnalias(fullCtx);
    case "macro": case "mkmacro": return handleMacro(fullCtx);

    // Intelligence
    case "ask": case "agent": case "question": return handleAsk(fullCtx);
    case "status": case "xp": case "level": return handleStatus(fullCtx);
    case "tutorial": case "start": case "beginner": case "guide": return handleTutorial(fullCtx);
    case "theme": case "colortheme": return handleTheme(fullCtx);
    case "voice": case "speech": case "mic": return handleVoice(fullCtx);
    case "settings": return handleSettings(fullCtx);

    default:
      return { handled: false };
  }
}

// ─── Chat / Navigation Handlers ──────────────────────────────

export async function handleChat(ctx: HandlerContext): Promise<HandlerResult> {
  const channelName = ctx.args.join(" ") || "general";
  const channel = ctx.channels.find((c: any) => c.name?.toLowerCase() === channelName.toLowerCase());
  if (channel) {
    ctx.setActiveContext({ type: "channel", id: channel.id, name: channel.name });
    ctx.addSys(`Switched to #${channel.name}`, "success");
  } else {
    ctx.addSys(`Channel "${channelName}" not found.`, "error");
  }
  return { handled: true };
}

export async function handleDm(ctx: HandlerContext): Promise<HandlerResult> {
  const recipient = ctx.args[0];
  const message = ctx.args.slice(1).join(" ");
  if (!recipient) { ctx.addSys("Usage: /dm <name-or-id> [message]", "info"); return { handled: true }; }
  if (message.length > 2000) { ctx.addSys("❌ Message must be under 2000 characters.", "error"); return { handled: true }; }
  const q = recipient.replace(/^@/, "").toLowerCase();
  try {
    const res = await fetch(`/api/v1/profiles/search?q=${encodeURIComponent(q)}&limit=10`);
    const data = await res.json();
    if (!res.ok || !data.profiles?.length) {
      ctx.addSys(`No users found matching "${recipient}".`, "error");
      return { handled: true };
    }
    if (data.profiles.length === 1) {
      const p = data.profiles[0];
      const r = await fetch("/api/v1/terminal/dm/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: p.id }),
      });
      const d = await r.json();
      if (r.ok && d.threadId) {
        ctx.setActiveContext({ type: "dm", threadId: d.threadId, otherUserId: p.id, otherUserName: p.fullName || "User" });
        if (message) {
          const msgRes = await fetch("/api/v1/terminal/dm/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: p.id, content: message }),
          });
          if (msgRes.ok) {
            ctx.addSys(`Sent DM to ${p.fullName || p.id}: ${message}`, "success");
          } else {
            ctx.addSys(`Started DM with ${p.fullName || p.id}. (Message failed to send)`, "success");
          }
        } else {
          ctx.addSys(`Started DM with ${p.fullName || p.id}.`, "success");
        }
      } else {
        ctx.addSys(d.error || "Failed to start DM", "error");
      }
    } else {
      ctx.setPendingChoices({ type: "dm", options: data.profiles.slice(0, 8) });
      ctx.addSys(
        `Multiple users found:\n` +
          data.profiles.slice(0, 8).map((p: any, i: number) => `${i + 1}. ${p.fullName || "Unknown"} (${p.locationName || "No location"})`).join("\n") +
          `\n\nReply with a number to choose.`,
        "info"
      );
    }
  } catch {
    ctx.addSys("Failed to search for user", "error");
  }
  return { handled: true };
}

export async function handlePost(ctx: HandlerContext): Promise<HandlerResult> {
  const wizard = createWizard("post");
  ctx.setWizard(wizard);
  ctx.addSys(wizard.prompt, "info");
  return { handled: true };
}

