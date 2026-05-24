/**
 * Terminal Rendering Engine
 * =========================
 * Rich text formatting: sparklines, progress bars, ASCII pipelines,
 * color-coded tables, inline image grids, and visual status indicators.
 */

import { getExchangeMode } from "@/lib/categories";

// ─── Theme System ────────────────────────────────────────────

export interface ThemeColors {
  bg: string;
  sidebarBg: string;
  accent: string;
  accentHover: string;
  text: string;
  muted: string;
  border: string;
  error: string;
  success: string;
}

export const THEMES: Record<string, ThemeColors> = {
  default: {
    bg: "#0a0806",
    sidebarBg: "#0f0c0a",
    accent: "#f5a623",
    accentHover: "#ffb84d",
    text: "#e8d5a3",
    muted: "#7a6b5a",
    border: "#2a2420",
    error: "#ff5252",
    success: "#00e676",
  },
  cyberpunk: {
    bg: "#0a0014",
    sidebarBg: "#12001f",
    accent: "#ff00ff",
    accentHover: "#cc00cc",
    text: "#ffe6ff",
    muted: "#b794f6",
    border: "#4a1d6b",
    error: "#ff3860",
    success: "#00f5d4",
  },
  matrix: {
    bg: "#000000",
    sidebarBg: "#001100",
    accent: "#00ff41",
    accentHover: "#00cc33",
    text: "#ccffcc",
    muted: "#4ade80",
    border: "#003300",
    error: "#ff4444",
    success: "#00ff41",
  },
  minimal: {
    bg: "#111111",
    sidebarBg: "#1a1a1a",
    accent: "#e5e5e5",
    accentHover: "#a3a3a3",
    text: "#ffffff",
    muted: "#737373",
    border: "#262626",
    error: "#ef4444",
    success: "#22c55e",
  },
  ocean: {
    bg: "#001520",
    sidebarBg: "#001a25",
    accent: "#00d4aa",
    accentHover: "#00a884",
    text: "#e0f2fe",
    muted: "#7dd3fc",
    border: "#0c4a6e",
    error: "#f87171",
    success: "#34d399",
  },
};

export function getThemeColors(name: string): ThemeColors {
  return THEMES[name] || THEMES.default;
}

// ─── Sparklines ──────────────────────────────────────────────

export function sparkline(values: number[], width = 20): string {
  if (values.length === 0) return "(no data)";
  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v) => {
      const ratio = (v - min) / range;
      const idx = Math.min(Math.floor(ratio * blocks.length), blocks.length - 1);
      return blocks[idx];
    })
    .join("");
}

export function barChart(label: string, value: number, max: number, width = 20): string {
  const filled = Math.round((value / Math.max(max, 1)) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `  ${label.padEnd(18)} ${bar}  ${value}`;
}

export function progressBar(percent: number, width = 40): string {
  const filled = Math.round((percent / 100) * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}

// ─── Contract Pipeline ───────────────────────────────────────

export function contractPipeline(
  status: string,
  isPartyA: boolean,
  partyASigned: boolean,
  partyBSigned: boolean,
  aMarkedComplete: boolean,
  bMarkedComplete: boolean
): string {
  const stages = ["DRAFT", "TERMS", "ACTIVE", "DONE"];
  const currentIndex =
    status === "draft"
      ? 0
      : status === "pending_terms"
        ? 1
        : status === "active" || status === "pending_completion"
          ? 2
          : status === "completed"
            ? 3
            : -1;

  let pipeline = "  Lifecycle:\n";
  pipeline += "  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐\n";
  pipeline +=
    "  │  " +
    stages
      .map((s, i) => {
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const marker = isCurrent ? "🔄" : isPast ? "✅" : "  ";
        return `${s.padEnd(5)} ${marker}  │`;
      })
      .join(" ──→ ") +
    "\n";
  pipeline += "  └─────────┘     └─────────┘     └─────────┘     └─────────┘\n";

  if (currentIndex >= 0) {
    const arrowPos = 10 + currentIndex * 18;
    pipeline += "  " + " ".repeat(arrowPos) + "↑\n";
    pipeline += "  " + " ".repeat(arrowPos - 6) + "You are here\n";
  }

  pipeline += "\n  Signatures:\n";
  pipeline += `    You:     ${partyASigned === isPartyA ? "✅ Signed" : "❌ Not signed"}\n`;
  pipeline += `    Them:    ${partyBSigned !== isPartyA ? "✅ Signed" : "❌ Not signed"}\n`;

  if (status === "active" || status === "pending_completion") {
    pipeline += "\n  Completion:\n";
    pipeline += `    You:     ${aMarkedComplete === isPartyA ? "✅ Marked" : "⏳ Pending"}\n`;
    pipeline += `    Them:    ${bMarkedComplete !== isPartyA ? "✅ Marked" : "⏳ Pending"}\n`;
  }

  return pipeline;
}

// ─── Rich Tables ─────────────────────────────────────────────

export function fmtTable(
  headers: string[],
  rows: (string | number | null)[][],
  options?: { colorize?: (rowIdx: number, colIdx: number, value: string) => string }
): string {
  if (rows.length === 0) return "  (no data)";
  const cols = headers.map((h, i) => {
    const widths = [h.length, ...rows.map((r) => String(r[i] ?? "").length)];
    return Math.max(...widths);
  });

  const pad = (s: string | number | null, i: number) => String(s ?? "").padEnd(cols[i] + 2);

  const sep = "+" + cols.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const head = "| " + headers.map((h, i) => h.padEnd(cols[i])).join(" | ") + " |";
  const body = rows
    .map(
      (r, ri) =>
        "| " +
        r
          .map((cell, ci) => {
            const val = pad(cell, ci).trimEnd();
            return options?.colorize ? options.colorize(ri, ci, val) : val;
          })
          .join(" | ") +
        " |"
    )
    .join("\n");

  return `${sep}\n${head}\n${sep}\n${body}\n${sep}`;
}

// ─── Status Formatting ───────────────────────────────────────

export function fmtStatus(status: string): string {
  const map: Record<string, string> = {
    open: "🟢 open",
    accepted: "🔵 accepted",
    completed: "✅ completed",
    archived: "⚪ archived",
    draft: "⚪ draft",
    pending_terms: "🟡 pending terms",
    active: "🟢 active",
    pending_completion: "🟡 pending completion",
    pending_cancellation: "🔴 pending cancellation",
    cancelled: "❌ cancelled",
    pending: "🟡 pending",
    declined: "🔴 declined",
    verified: "✅ verified",
    unverified: "⚪ unverified",
    negotiating: "🟡 negotiating",
    contracted: "🔵 contracted",
    selected: "🔵 selected",
    removed: "⚪ removed",
  };
  return map[status.toLowerCase()] || `⚪ ${status}`;
}

export function fmtExchangeMode(value: string | null): string {
  const mode = getExchangeMode(value);
  if (!mode) return "—";
  return `${mode.color} ${mode.label}`;
}

// ─── Card & List Formatting ──────────────────────────────────

export function fmtCard(data: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== "");
  const maxKey = Math.max(...entries.map(([k]) => k.length), 10);
  return entries.map(([k, v]) => `  ${k.padEnd(maxKey + 2)} ${v}`).join("\n");
}

export function fmtList(items: string[]): string {
  return items.map((item, i) => `  ${(i + 1).toString().padStart(2)}. ${item}`).join("\n");
}

export function fmtRating(
  rating: number | null | undefined,
  count: number | null | undefined
): string {
  if (rating == null) return "No ratings yet";
  const stars = "★".repeat(Math.round(rating / 2)) + "☆".repeat(5 - Math.round(rating / 2));
  return `${stars} ${rating.toFixed(1)}/10${count ? ` (${count} reviews)` : ""}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

// ─── Short ID ────────────────────────────────────────────────

export function shortId(id: string): string {
  return id.slice(0, 8);
}

// ─── Time Formatting ─────────────────────────────────────────

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-AU", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Image Grid ──────────────────────────────────────────────

export function fmtImageGrid(count: number): string {
  if (count === 0) return "";
  const cells = Array(count).fill("┌────┐\n│ 🖼️ │\n└────┘");
  return `[📎 ${count} image${count > 1 ? "s" : ""} attached]\n` + cells.join(" ");
}

// ─── XP & Progress ───────────────────────────────────────────

export function xpBar(current: number, max: number, width = 30): string {
  const pct = Math.min(current / max, 1);
  const filled = Math.round(pct * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}

export function badgeLine(icon: string, name: string, desc: string): string {
  return `    ${icon} ${name.padEnd(18)} — ${desc}`;
}

// ─── Achievement Art ─────────────────────────────────────────

export function getTrophyArt(): string {
  return (
    `       ___________      \n` +
    `      '._==_==_=_.'     \n` +
    `      .-\\:      /-.    \n` +
    `     | (|:.     |) |    \n` +
    `      '-|:.     |-'     \n` +
    `        \\::.    /      \n` +
    `         '::. .'        \n` +
    `           ) (          \n` +
    `         _.' '._        \n` +
    `        '-------'       `
  );
}

// ─── Celebration Flash ───────────────────────────────────────

export function getCelebrationBanner(text: string): string {
  const pad = Math.max(0, 40 - text.length) / 2;
  const left = "🎉".repeat(Math.ceil(pad / 2));
  const right = "🎉".repeat(Math.floor(pad / 2));
  return `${left} ${text} ${right}`;
}
