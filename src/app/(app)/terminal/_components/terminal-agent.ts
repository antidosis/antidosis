/**
 * Terminal Agent & NLP Layer
 * ==========================
 * Natural language intent parsing + contextual response engine.
 * No LLM — fast, deterministic, offline-capable rule-based system.
 */

// ─── Intent Classification ───────────────────────────────────

export type Intent =
  | "CREATE_NEED"
  | "SEARCH"
  | "BROWSE"
  | "DM"
  | "SIGN_CONTRACT"
  | "COMPLETE_DEAL"
  | "REMIND"
  | "CANCEL"
  | "HELP"
  | "STATS"
  | "ACTIVITY"
  | "WHOAMI"
  | "NOTIFICATIONS"
  | "PROFILE"
  | "PROS"
  | "REVIEW"
  | "ASK_AGENT"
  | "POST_REVIEW"
  | "VIEW_CONTRACT"
  | "ACCEPT_NEED"
  | "UNKNOWN";

interface ParsedIntent {
  intent: Intent;
  args: Record<string, string>;
  confidence: number;
}

const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[]; weight: number }[] = [
  {
    intent: "CREATE_NEED",
    patterns: [
      /^i need\b/i,
      /^i want\b/i,
      /^looking for\b/i,
      /^post a need/i,
      /^create a need/i,
      /^new need/i,
      /^help me find/i,
      /^can someone/i,
    ],
    weight: 1.0,
  },
  {
    intent: "SEARCH",
    patterns: [
      /^search\b/i,
      /^find\b/i,
      /^look for\b/i,
      /^show me\b/i,
      /^where (is|are)\b/i,
      /^do you have\b/i,
    ],
    weight: 0.9,
  },
  {
    intent: "BROWSE",
    patterns: [
      /^browse\b/i,
      /^what'?s available/i,
      /^what can i find/i,
      /^open needs/i,
      /^show needs/i,
      /^list needs/i,
    ],
    weight: 0.9,
  },
  {
    intent: "DM",
    patterns: [
      /^message\b/i,
      /^text\b/i,
      /^dm\b/i,
      /^send (a )?message/i,
      /^tell\s+\w+/i,
      /^ask\s+\w+/i,
      /^contact\b/i,
      /^reach out/i,
    ],
    weight: 0.9,
  },
  {
    intent: "SIGN_CONTRACT",
    patterns: [/^sign\b/i, /^agree to\b/i, /^approve\b/i, /^confirm (the )?contract/i, /^i agree/i],
    weight: 0.85,
  },
  {
    intent: "COMPLETE_DEAL",
    patterns: [
      /^complete\b/i,
      /^finish\b/i,
      /^done\b/i,
      /^mark (as )?complete/i,
      /^mark (it )?done/i,
      /^we'?re done/i,
      /^finished\b/i,
    ],
    weight: 0.85,
  },
  {
    intent: "REMIND",
    patterns: [/^remind\b/i, /^nudge\b/i, /^poke\b/i, /^send a reminder/i, /^follow up/i],
    weight: 0.8,
  },
  {
    intent: "CANCEL",
    patterns: [/^cancel\b/i, /^abort\b/i, /^stop\b/i, /^withdraw\b/i, /^call off/i],
    weight: 0.8,
  },
  {
    intent: "HELP",
    patterns: [
      /^help\b/i,
      /^how do( |')i\b/i,
      /^how (to|does)\b/i,
      /^what (is|are|does)\b/i,
      /^guide\b/i,
      /^tutorial\b/i,
      /^explain\b/i,
      /^i don'?t understand/i,
      /^confused/i,
    ],
    weight: 0.9,
  },
  {
    intent: "STATS",
    patterns: [
      /^stats\b/i,
      /^my stats/i,
      /^dashboard\b/i,
      /^how am i doing/i,
      /^my activity/i,
      /^my progress/i,
      /^overview\b/i,
    ],
    weight: 0.85,
  },
  {
    intent: "ACTIVITY",
    patterns: [
      /^activity\b/i,
      /^what'?s new/i,
      /^what'?s happening/i,
      /^recent/i,
      /^feed\b/i,
      /^updates\b/i,
      /^news\b/i,
    ],
    weight: 0.8,
  },
  {
    intent: "WHOAMI",
    patterns: [/^who am i/i, /^my profile/i, /^about me/i, /^my info/i, /^my details/i],
    weight: 0.9,
  },
  {
    intent: "NOTIFICATIONS",
    patterns: [
      /^notifications?\b/i,
      /^inbox\b/i,
      /^messages?\b/i,
      /^alerts?\b/i,
      /^what did i miss/i,
      /^anything new for me/i,
    ],
    weight: 0.85,
  },
  {
    intent: "PROFILE",
    patterns: [/^profile\b/i, /^who is\b/i, /^view\b/i, /^show me\s+\w+/i, /^look up\b/i],
    weight: 0.8,
  },
  {
    intent: "PROS",
    patterns: [
      /^pros\b/i,
      /^experts\b/i,
      /^verified\b/i,
      /^who can help/i,
      /^who is good at/i,
      /^find a pro/i,
    ],
    weight: 0.8,
  },
  {
    intent: "REVIEW",
    patterns: [/^review\b/i, /^rate\b/i, /^leave (a )?review/i, /^feedback\b/i, /^how was/i],
    weight: 0.8,
  },
  {
    intent: "VIEW_CONTRACT",
    patterns: [
      /^view (the )?contract/i,
      /^show (the )?contract/i,
      /^contract\b/i,
      /^my contracts/i,
      /^deal\b/i,
      /^agreement\b/i,
    ],
    weight: 0.8,
  },
  {
    intent: "ACCEPT_NEED",
    patterns: [
      /^accept\b/i,
      /^i('m| am) interested/i,
      /^i can help/i,
      /^i can do/i,
      /^apply\b/i,
      /^express interest/i,
    ],
    weight: 0.8,
  },
  {
    intent: "ASK_AGENT",
    patterns: [
      /^ask\b/i,
      /^what should/i,
      /^what do you think/i,
      /^advice\b/i,
      /^suggest\b/i,
      /^recommend\b/i,
      /^tip\b/i,
    ],
    weight: 0.75,
  },
];

export function parseIntent(input: string): ParsedIntent {
  const text = input.trim();

  // Check for explicit command prefix
  if (text.startsWith("/")) {
    const cmd = text.slice(1).split(" ")[0].toLowerCase();
    const intentMap: Record<string, Intent> = {
      post: "CREATE_NEED",
      needs: "BROWSE",
      need: "BROWSE",
      dm: "DM",
      msg: "DM",
      message: "DM",
      sign: "SIGN_CONTRACT",
      complete: "COMPLETE_DEAL",
      remind: "REMIND",
      cancel: "CANCEL",
      help: "HELP",
      stats: "STATS",
      dashboard: "STATS",
      activity: "ACTIVITY",
      whoami: "WHOAMI",
      notifications: "NOTIFICATIONS",
      profile: "PROFILE",
      pros: "PROS",
      review: "REVIEW",
      contract: "VIEW_CONTRACT",
      contracts: "VIEW_CONTRACT",
      accept: "ACCEPT_NEED",
      ask: "ASK_AGENT",
      search: "SEARCH",
      find: "SEARCH",
    };
    const intent = intentMap[cmd] || "UNKNOWN";
    const args = extractArgs(text);
    return { intent, args, confidence: 1.0 };
  }

  // NLP pattern matching
  let bestIntent: Intent = "UNKNOWN";
  let bestConfidence = 0;

  for (const { intent, patterns, weight } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const confidence = weight * (match[0].length / text.length);
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestIntent = intent;
        }
      }
    }
  }

  const args = extractArgs(text);
  return { intent: bestIntent, args, confidence: bestConfidence };
}

function extractArgs(text: string): Record<string, string> {
  const args: Record<string, string> = {};

  // Extract quoted strings
  const quotes = text.match(/"([^"]*)"/g);
  if (quotes) {
    args.quoted = quotes.map((q) => q.slice(1, -1)).join(" ");
  }

  // Extract names (capitalized words after "to", "with", "from")
  const nameMatch = text.match(/(?:to|with|from|about|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) args.name = nameMatch[1];

  // Extract IDs (UUID-like patterns)
  const idMatch = text.match(/([a-f0-9]{8})/i);
  if (idMatch) args.id = idMatch[1];

  // Extract dollar amounts
  const moneyMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  if (moneyMatch) args.value = moneyMatch[1];

  // Extract everything after first verb as description
  const descMatch = text.match(/(?:need|want|looking for|offer|have)\s+(.+)/i);
  if (descMatch) args.description = descMatch[1];

  return args;
}

// ─── Agent Response Engine ───────────────────────────────────

interface UserContext {
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

export async function generateAgentResponse(
  question: string,
  context: UserContext
): Promise<string> {
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

function buildPendingActionsResponse(context: UserContext): string {
  const parts: string[] = [];

  if (context.pendingSignatures.length > 0) {
    parts.push(
      `  📝 ${context.pendingSignatures.length} contract${context.pendingSignatures.length > 1 ? "s" : ""} waiting for your signature:` +
        context.pendingSignatures
          .map((c) => `\n     • ${c.need?.title || "Contract"} → /sign ${c.id.slice(0, 8)}`)
          .join("")
    );
  }

  if (context.pendingCompletions.length > 0) {
    parts.push(
      `  ✅ ${context.pendingCompletions.length} deal${context.pendingCompletions.length > 1 ? "s" : ""} waiting for completion:` +
        context.pendingCompletions
          .map((c) => `\n     • ${c.need?.title || "Deal"} → /complete ${c.id.slice(0, 8)}`)
          .join("")
    );
  }

  if (context.pendingReviews.length > 0) {
    parts.push(
      `  ⭐ ${context.pendingReviews.length} review${context.pendingReviews.length > 1 ? "s" : ""} pending:` +
        context.pendingReviews
          .map((r) => `\n     • ${r.title || "Deal"} → /review ${r.id.slice(0, 8)}`)
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

// ─── Contextual Suggestions ──────────────────────────────────

export function getContextualSuggestion(context: UserContext): string | null {
  if (context.pendingSignatures.length > 0) {
    const c = context.pendingSignatures[0];
    return `📝 You have a contract waiting for signature: /sign ${c.id.slice(0, 8)}`;
  }
  if (context.pendingCompletions.length > 0) {
    const c = context.pendingCompletions[0];
    return `✅ Mark a deal complete: /complete ${c.id.slice(0, 8)}`;
  }
  if (context.pendingReviews.length > 0) {
    const r = context.pendingReviews[0];
    return `⭐ Leave a review: /review ${r.id.slice(0, 8)}`;
  }
  if (context.unreadDmCount > 0) {
    return `💬 ${context.unreadDmCount} unread message${context.unreadDmCount > 1 ? "s" : ""} → /dm threads`;
  }
  const unreadNotifs = context.notifications.filter((n) => !n.read).length;
  if (unreadNotifs > 0) {
    return `🔔 ${unreadNotifs} unread notification${unreadNotifs > 1 ? "s" : ""} → /notifications`;
  }
  return null;
}
