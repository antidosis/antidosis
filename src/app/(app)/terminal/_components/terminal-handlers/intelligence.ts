"use client";

import { parseIntent, type Intent } from "../terminal-agent";
import { fmtCard, xpBar } from "../terminal-render";
import { getLevel } from "../terminal-session";
import { createWizard } from "../terminal-wizard";
import type { HandlerContext, HandlerResult } from "./types";
import { friendlyError } from "./utils";

interface AgentContext {
  myProfile: any;
  notifications: any[];
  contracts: any[];
  needs: any[];
  acceptances: any[];
  unreadDmCount: number;
  pendingSignatures: any[];
  pendingCompletions: any[];
  pendingReviews: any[];
}

export async function handleAsk(ctx: HandlerContext): Promise<HandlerResult> {
  const question = ctx.args.join(" ").trim();
  if (!question) {
    ctx.addSys("Usage: /ask <question>", "error");
    return { handled: true };
  }
  try {
    const [cData, nData, aData, notifData, reviewsData] = await Promise.all([
      fetch("/api/v1/contracts/mine").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/needs/mine").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/acceptances/mine").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/notifications").then((r) => (r.ok ? r.json() : { notifications: [] })),
      fetch("/api/v1/reviews").then((r) => (r.ok ? r.json() : [])),
    ]);
    const contracts = Array.isArray(cData) ? cData : cData.contracts || [];
    const needs = Array.isArray(nData) ? nData : nData.needs || [];
    const acceptances = Array.isArray(aData) ? aData : aData.acceptances || [];
    const notifications = notifData.notifications || [];
    const reviews = Array.isArray(reviewsData) ? reviewsData : reviewsData.reviews || [];

    const myReviewContractIds = new Set(
      reviews.filter((r: any) => r.reviewerId === ctx.myProfile?.id).map((r: any) => r.contractId)
    );

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
    const pendingReviews = contracts.filter(
      (c: any) => c.status === "completed" && !myReviewContractIds.has(c.id)
    );

    const agentContext: AgentContext = {
      myProfile: ctx.myProfile,
      notifications,
      contracts,
      needs,
      acceptances,
      unreadDmCount: ctx.dmThreads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0),
      pendingSignatures,
      pendingCompletions,
      pendingReviews,
    };

    // Route through intent parser for high-confidence explicit intents
    const parsed = parseIntent(question);
    if (parsed.confidence >= 0.5 && parsed.intent !== "UNKNOWN" && parsed.intent !== "ASK_AGENT") {
      const response = generateIntentResponse(parsed.intent, agentContext);
      ctx.addSys(`🤖 Agent\n\n${response}`, "info");
      return { handled: true };
    }

    // Fallback to the full response engine for open-ended questions
    const response = await generateAgentResponse(question, agentContext);
    ctx.addSys(`🤖 Agent\n\n${response}`, "info");
  } catch (err) {
    ctx.addSys(friendlyError(err, "Agent failed."), "error");
  }
  return { handled: true };
}

function generateIntentResponse(intent: Intent, ctx: AgentContext): string {
  switch (intent) {
    case "CREATE_NEED":
      return `📖 Posting a Need

/post launches an interactive wizard. You'll need:
• A clear title and description
• What you're offering in return
• Your location (Central Coast only)
• Optional: skills needed, deadline, contract requirement

Tips:
• Specific needs get more responses
• Adding a value estimate helps people gauge fairness
• Verified profiles get 3x more interest`;

    case "BROWSE":
      return `🔍 Browse Needs

/needs — browse all open needs
/recommended — needs matching your skills
/nearby — local needs
/pros — browse verified professionals
/search <query> — search across everything
/skill <name> — find by specific skill`;

    case "SIGN_CONTRACT": {
      const sigs = ctx.pendingSignatures;
      return `📖 Signing a Contract

When both parties agree on terms, you sign with your typed full name.

→ /sign <contractId> to sign
→ /contracts to see pending signatures

${sigs.length > 0 ? `📝 You have ${sigs.length} contract${sigs.length > 1 ? "s" : ""} waiting:\n${sigs.map((c: any) => `• ${c.need?.title || "Contract"} → /sign ${c.id.slice(0, 8)}`).join("\n")}` : "No contracts waiting for your signature."}`;
    }

    case "COMPLETE_DEAL": {
      const comps = ctx.pendingCompletions;
      return `📖 Marking a Deal Complete

Both parties must mark complete for the deal to finalize and for reviews to unlock.

→ /complete <contractId>
→ /contracts to see active deals

${comps.length > 0 ? `✅ You have ${comps.length} deal${comps.length > 1 ? "s" : ""} waiting:\n${comps.map((c: any) => `• ${c.need?.title || "Deal"} → /complete ${c.id.slice(0, 8)}`).join("\n")}` : "No deals waiting for completion."}`;
    }

    case "VIEW_CONTRACT": {
      const parts: string[] = [];
      if (ctx.pendingSignatures.length > 0)
        parts.push(`📝 ${ctx.pendingSignatures.length} pending signature(s)`);
      if (ctx.pendingCompletions.length > 0)
        parts.push(`✅ ${ctx.pendingCompletions.length} pending completion(s)`);
      if (ctx.pendingReviews.length > 0)
        parts.push(`⭐ ${ctx.pendingReviews.length} review(s) pending`);
      return `📖 Your Contracts

/contracts — list all your contracts
/contract <id> — view specific contract details

${parts.length > 0 ? parts.join("\n") : "No pending actions on your contracts."}`;
    }

    case "REVIEW": {
      const revs = ctx.pendingReviews;
      return `⭐ Leaving a Review

/review launches a wizard to leave feedback after a completed deal.

${revs.length > 0 ? `You have ${revs.length} review${revs.length > 1 ? "s" : ""} pending:\n${revs.map((c: any) => `• ${c.need?.title || "Deal"} → /review ${c.id.slice(0, 8)}`).join("\n")}` : "No pending reviews. Complete a deal first to leave a review."}`;
    }

    case "HELP":
      return `🤖 I'm here to help!

Try asking specific questions like:
• "How do I post a need?"
• "What contracts need my attention?"
• "How does signing work?"

Or browse commands:
→ /help for basics
→ /help advanced for everything
→ /commands for a quick list`;

    case "STATS": {
      const { level, title } = getLevel(ctx.myProfile?.xp || 0);
      return `📊 Your Stats

/status — XP, level, and badges
/stats — full activity dashboard
/activity — recent terminal activity

Current: Level ${level} ${title}`;
    }

    case "NOTIFICATIONS": {
      const unread = ctx.notifications.filter((n: any) => !n.read).length;
      return `🔔 Notifications

${unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "No unread notifications."}

→ /notifications to see all
→ /readall to mark everything read`;
    }

    case "DM":
      return `💬 Direct Messages

/dm <name> [message] — start or continue a conversation
/dm threads — see all your conversations

${ctx.unreadDmCount > 0 ? `You have ${ctx.unreadDmCount} unread message${ctx.unreadDmCount > 1 ? "s" : ""}.` : "No unread messages."}`;

    case "SEARCH":
      return `🔍 Search

/search <query> — search across needs, users, and skills
/users <name> — find members by name
/skill <name> — find needs/pros by skill
/pros — browse verified professionals`;

    case "PROFILE":
      return `👤 Profile

/whoami — your profile summary
/skills — list your skills
/credentials — verified credentials
/reputation — rating and reviews

→ /profile <name> to view someone else`;

    case "PROS":
      return `⭐ Pro Members

/pros — browse verified professionals
/skill <name> — find pros by specific skill

Pro members get enhanced visibility, emergency support, and directory listing.`;

    case "ACCEPT_NEED":
      return `📖 Expressing Interest

/accept <needId> — express interest in a need
The poster will see your profile and can select you.

→ /needs to browse open needs
→ /recommended for matches based on your skills`;

    case "REMIND":
      return `⏰ Reminders

/remind <contractId> — send a gentle nudge to the other party

Use this when someone hasn't signed or responded to terms.`;

    case "CANCEL":
      return `📖 Cancelling

Before terms are locked: /cancel <id> (unilateral)
After terms are locked: /request-cancel <id> <reason> (needs mutual agreement)

If the other party declines, you can /escalate to admin.`;

    case "ACTIVITY": {
      const unread = ctx.notifications.filter((n: any) => !n.read).length;
      return `📰 Recent Activity

/activity — see recent mentions, DMs, and channel messages

${unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "No new activity."}`;
    }

    case "WHOAMI":
      return `👤 Your Profile

/whoami — full profile summary
/id — your user ID
/stats — activity dashboard
/reputation — ratings and reviews`;

    default:
      return `🤖 I'm here to help!

Try asking about:
• Posting a need (/post)
• Browsing needs (/needs)
• Your contracts (/contracts)
• Messaging (/dm)
• Your status (/status)

Or type /help for all commands.`;
  }
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

async function generateAgentResponse(question: string, context: AgentContext): Promise<string> {
  const q = question.toLowerCase();

  // Pending actions awareness
  if (q.includes("what should i do") || q.includes("what do i need") || q.includes("pending")) {
    return buildPendingActionsResponse(context);
  }

  // Contract help
  if (q.includes("contract") && (q.includes("how") || q.includes("what"))) {
    if (q.includes("sign")) {
      return `📖 Signing a Contract\n\n  When both parties agree on terms, you sign with your typed full name.\n  This creates a legal record of the agreement.\n\n  → /sign <contractId> to sign\n  → /contract <id> to review terms first`;
    }
    if (q.includes("cancel")) {
      return `📖 Cancelling a Contract\n\n  Before terms are locked: /cancel <id> (unilateral)\n  After terms are locked: /request-cancel <id> <reason> (needs mutual agreement)\n\n  If the other party declines, you can /escalate to admin.`;
    }
    return `📖 Contracts bind both parties to agreed terms.\n\n  1. Express interest: /accept <needId>\n  2. Poster selects you → contract created\n  3. Both write & submit terms\n  4. Both agree → terms lock\n  5. Both sign → contract active\n  6. Both mark complete → deal done\n\n  View yours: /contracts`;
  }

  // Need help
  if (q.includes("need") && (q.includes("how") || q.includes("post") || q.includes("create"))) {
    return `📖 Posting a Need\n\n  /post launches an interactive wizard. You'll need:\n  • A clear title and description\n  • What you're offering in return\n  • Your location (Central Coast only)\n  • Optional: skills needed, deadline, contract requirement\n\n  Tips:\n  • Specific needs get more responses\n  • Adding a value estimate helps people gauge fairness\n  • Verified profiles get 3x more interest`;
  }

  // Rating/reputation help
  if (q.includes("rating") || q.includes("reputation") || q.includes("review")) {
    return `⭐ Reputation on Antidosis\n\n  Your rating is calculated from reviews after completed deals.\n  It's a 1-10 scale shown as stars.\n\n  How to improve:\n  • Complete deals and leave reviews (/review)\n  • Be responsive to messages\n  • Get verified credentials (/credential add)\n  • Claim Pro status (/pro claim) if eligible\n\n  Current: ${context.myProfile?.ratingAvg ? `${context.myProfile.ratingAvg}/10 (${context.myProfile.ratingCount} reviews)` : "No ratings yet"}`;
  }

  // Verification help
  if (q.includes("verify") || q.includes("credential") || q.includes("badge")) {
    return `🛡️ Verification\n\n  Upload credentials to prove your skills:\n  → /credential add\n\n  Supported types: license, qualification, certification,\n  WWCC, insurance, business registration, and more.\n\n  Verified credentials show a ✅ on your profile\n  and unlock Pro status.`;
  }

  // Pro help
  if (q.includes("pro") || q.includes("premium") || q.includes("subscription")) {
    return `⭐ Pro Status\n\n  Pro members get:\n  • Enhanced visibility in search\n  • Emergency support access\n  • Public directory listing\n  • Trust badge on profile\n\n  Claim free Pro for life if you're:\n  • Identity verified + mobile verified\n  • Located in the Central Coast trial region\n\n  → /pro claim to check eligibility`;
  }

  // Messaging help
  if (q.includes("message") || q.includes("dm") || q.includes("chat")) {
    return `💬 Messaging\n\n  Direct messages are private conversations:\n  → /dm <name> <message> — start a chat\n  → /dm threads — see all your conversations\n  → @mention in channels to ping someone\n\n  You can also message from any need:\n  → /need <id> → click message poster`;
  }

  // Discovery help
  if (q.includes("find") || q.includes("search") || q.includes("browse")) {
    return `🔍 Finding Opportunities\n\n  /needs — browse all open needs\n  /recommended — needs matching your skills\n  /nearby — local needs\n  /pros — browse verified professionals\n  /search <query> — search across everything\n  /skill <name> — find by specific skill`;
  }

  // Generic help fallback
  return `🤖 I'm here to help! Here are some things you can ask:\n\n  • "How do I post a need?"\n  • "What contracts need my attention?"\n  • "How does signing work?"\n  • "How do I improve my rating?"\n  • "What are Pro benefits?"\n\n  Or browse commands: /help for basics, /help advanced for everything.`;
}

function buildPendingActionsResponse(context: AgentContext): string {
  const parts: string[] = [];

  if (context.pendingSignatures.length > 0) {
    parts.push(
      `  📝 ${context.pendingSignatures.length} contract${context.pendingSignatures.length > 1 ? "s" : ""} waiting for your signature:` +
        context.pendingSignatures
          .map((c: any) => `\n     • ${c.need?.title || "Contract"} → /sign ${c.id.slice(0, 8)}`)
          .join("")
    );
  }

  if (context.pendingCompletions.length > 0) {
    parts.push(
      `  ✅ ${context.pendingCompletions.length} deal${context.pendingCompletions.length > 1 ? "s" : ""} waiting for completion:` +
        context.pendingCompletions
          .map((c: any) => `\n     • ${c.need?.title || "Deal"} → /complete ${c.id.slice(0, 8)}`)
          .join("")
    );
  }

  if (context.pendingReviews.length > 0) {
    parts.push(
      `  ⭐ ${context.pendingReviews.length} review${context.pendingReviews.length > 1 ? "s" : ""} pending:` +
        context.pendingReviews
          .map((c: any) => `\n     • ${c.need?.title || "Deal"} → /review ${c.id.slice(0, 8)}`)
          .join("")
    );
  }

  if (context.unreadDmCount > 0) {
    parts.push(
      `  💬 ${context.unreadDmCount} unread DM${context.unreadDmCount > 1 ? "s" : ""} → /dm threads`
    );
  }

  const unreadNotifs = context.notifications.filter((n) => !n.read).length;
  if (unreadNotifs > 0) {
    parts.push(
      `  🔴 ${unreadNotifs} unread notification${unreadNotifs > 1 ? "s" : ""} → /notifications`
    );
  }

  if (parts.length === 0) {
    return `🤖 You're all caught up! 🎉\n\n  No pending actions right now.\n\n  💡 Want to stay busy?\n     • /recommended — needs matching your skills\n     • /activity — see what's happening\n     • /post — create a new need`;
  }

  return `🤖 Here's what needs your attention:\n\n${parts.join("\n\n")}`;
}
