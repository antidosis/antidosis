/**
 * Terminal Session Persistence
 * ============================
 * Everything survives reload. Full state restoration for wizards,
 * environment variables, aliases, filesystem paths, lab data,
 * gamification, and settings.
 */

const SESSION_KEY = "antidosis_terminal_session_v2";

export interface LabDraft {
  title: string;
  description?: string;
  offerType?: string;
  offerDescription?: string;
  offerValue?: number;
  locationName?: string;
  needCategory?: string;
  requiredSkills?: string[];
  requiresContract?: boolean;
  deadline?: string;
  timeRange?: string;
  createdAt: string;
}

export interface LabNote {
  text: string;
  createdAt: string;
}

export interface TerminalSettings {
  theme: "default" | "cyberpunk" | "matrix" | "minimal" | "ocean";
  compactMode: boolean;
  notifyDm: boolean;
  notifyMention: boolean;
  showAmbientStatus: boolean;
  showTypingIndicator: boolean;
  voiceEnabled: boolean;
  vimMode: boolean;
  commandProgression: boolean;
}

export interface TerminalSession {
  version: 2;
  userId: string;
  // Filesystem
  cwd: string;
  // Wizard
  wizard: WizardState | null;
  // Shell
  env: Record<string, string>;
  aliases: Record<string, string>;
  macros: Record<string, string[]>;
  history: string[];
  bookmarks: Record<string, string>;
  // Lab
  lab: {
    drafts: LabDraft[];
    notes: LabNote[];
    wants: string[];
    scripts: Record<string, string[]>;
    folders: string[];
  };
  // Gamification
  xp: number;
  badges: string[];
  streakDays: number;
  lastActiveDate: string;
  // Settings
  settings: TerminalSettings;
  // Context
  lastViewed: {
    needId?: string;
    contractId?: string;
    userId?: string;
    channelId?: string;
  };
  // Unread tracking
  lastReadAt: Record<string, string>;
}

export interface WizardState {
  type: "post" | "review" | "credential" | "tutorial" | "edit_need";
  step: number;
  data: Record<string, any>;
  prompt: string;
}

function defaultSettings(): TerminalSettings {
  return {
    theme: "default",
    compactMode: false,
    notifyDm: true,
    notifyMention: true,
    showAmbientStatus: true,
    showTypingIndicator: true,
    voiceEnabled: false,
    vimMode: false,
    commandProgression: false,
  };
}

function defaultSession(userId: string): TerminalSession {
  const today = new Date().toISOString().split("T")[0];
  return {
    version: 2,
    userId,
    cwd: "/",
    wizard: null,
    env: {},
    aliases: {},
    macros: {},
    history: [],
    bookmarks: {},
    lab: {
      drafts: [],
      notes: [],
      wants: [],
      scripts: {},
      folders: [],
    },
    xp: 0,
    badges: [],
    streakDays: 0,
    lastActiveDate: today,
    settings: defaultSettings(),
    lastViewed: {},
    lastReadAt: {},
  };
}

export function loadSession(userId: string): TerminalSession {
  try {
    const raw = localStorage.getItem(`${SESSION_KEY}_${userId}`);
    if (!raw) return defaultSession(userId);
    const parsed = JSON.parse(raw) as TerminalSession;
    if (parsed.version !== 2) return defaultSession(userId);
    // Merge with defaults for any missing fields (backward compat)
    const defaults = defaultSession(userId);
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...parsed.settings },
      lab: { ...defaults.lab, ...parsed.lab },
      lastViewed: { ...defaults.lastViewed, ...parsed.lastViewed },
    };
  } catch {
    return defaultSession(userId);
  }
}

export function saveSession(session: TerminalSession): void {
  try {
    localStorage.setItem(`${SESSION_KEY}_${session.userId}`, JSON.stringify(session));
  } catch {
    // Storage full or unavailable
  }
}

// ─── XP & Gamification ───────────────────────────────────────

const XP_TABLE: Record<string, number> = {
  post_need: 50,
  complete_deal: 200,
  leave_review: 30,
  send_message: 1,
  verify_credential: 100,
  daily_login: 10,
  help_dm: 25,
};

export function addXp(session: TerminalSession, action: keyof typeof XP_TABLE): TerminalSession {
  const gain = XP_TABLE[action] || 0;
  const today = new Date().toISOString().split("T")[0];
  let streak = session.streakDays;
  if (session.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split("T")[0];
    streak = session.lastActiveDate === yestStr ? streak + 1 : 1;
  }
  const streakBonus = Math.min(streak, 7) * 2;
  const totalGain = gain + (action === "daily_login" ? streakBonus : 0);

  return {
    ...session,
    xp: session.xp + totalGain,
    streakDays: streak,
    lastActiveDate: today,
  };
}

export function getLevel(xp: number): { level: number; title: string; nextThreshold: number } {
  const thresholds = [
    0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500,
    5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000,
  ];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  const titles = [
    "Newcomer", "Seedling", "Trader", "Regular", "Dealmaker",
    "Connector", "Pillar", "Veteran", "Master", "Legend",
    "Grandmaster", "Oracle", "Titan", "Immortal", "Demigod",
    "Avatar", "Cosmic", "Eternal", "Transcendent", "Omnipotent",
  ];
  const next = thresholds[level] ?? thresholds[thresholds.length - 1] * 2;
  return { level, title: titles[level - 1] ?? "Beyond", nextThreshold: next };
}

export function checkBadges(session: TerminalSession, stats: {
  needsPosted: number;
  dealsCompleted: number;
  messagesSent: number;
  reviewsGiven: number;
  ratingAvg: number | null;
  isVerified: boolean;
  isPro: boolean;
}): string[] {
  const newBadges: string[] = [];
  const has = (b: string) => session.badges.includes(b);
  const award = (b: string) => { if (!has(b)) newBadges.push(b); };

  if (stats.needsPosted >= 1) award("🌱 Seedling");
  if (stats.dealsCompleted >= 5) award("🤝 Dealmaker");
  if (stats.dealsCompleted >= 20) award("🏆 Centurion");
  if (stats.messagesSent >= 100) award("🗣️ Socialite");
  if (stats.messagesSent >= 500) award("📢 Orator");
  if (stats.reviewsGiven >= 5) award("⭐ Critic");
  if (stats.ratingAvg && stats.ratingAvg >= 9 && stats.dealsCompleted >= 5) award("🏅 Trusted");
  if (stats.isVerified) award("🛡️ Verified");
  if (stats.isPro) award("⭐ Pro");
  if (session.streakDays >= 7) award("🔥 Streak Starter");
  if (session.streakDays >= 30) award("⚡ Streak Master");

  return newBadges;
}

// ─── Alias Resolution ────────────────────────────────────────

const MAX_ALIAS_DEPTH = 10;

export function resolveAlias(session: TerminalSession, input: string, depth = 0): string {
  if (depth > MAX_ALIAS_DEPTH) return input;
  const text = input.trim();
  if (!text.startsWith("/")) return input;
  const cmd = text.slice(1).split(" ")[0];
  const alias = session.aliases[cmd];
  if (!alias) return input;
  const args = text.slice(1 + cmd.length).trim();
  const resolved = args ? `/${alias} ${args}` : `/${alias}`;
  return resolveAlias(session, resolved, depth + 1);
}

export function resolveMacro(session: TerminalSession, input: string): string[] | null {
  const text = input.trim();
  if (!text.startsWith("/")) return null;
  const cmd = text.slice(1).split(" ")[0];
  const macro = session.macros[cmd];
  if (!macro) return null;
  return macro;
}
