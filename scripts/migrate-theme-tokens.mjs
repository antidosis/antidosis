#!/usr/bin/env node
// One-shot migration: Tailwind arbitrary hex values ([#rrggbb]) -> theme tokens.
// Only bracketed arbitrary values are touched; quoted JS/TS hex strings
// (canvas draw code, style props) are left for manual theme-aware handling.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAP = {
  "12100e": "surface",
  "14110e": "surface",
  "1a1714": "raise",
  "1e1a16": "raise",
  "0f0c0a": "inset",
  "2a2420": "line",
  "3d3530": "linehi",
  "3a342e": "linehi",
  "5a4a3a": "linestrong",
  e8d5a3: "gold",
  d4c4a8: "goldsoft",
  c4b496: "faint",
  c0b8a8: "faint",
  b8a078: "parchment",
  "8f7f6e": "ash",
  "8a7a60": "ash2",
  "7a6b5a": "leather",
  f5a623: "sun",
  ffb84d: "sunhi",
  c47a0a: "sundim",
  d97706: "sundim",
  e89e38: "sun",
  e8b830: "sunhi",
  ea580c: "ember",
  f57633: "ember",
  f08a35: "ember",
  ffb300: "alert",
  f0cc33: "alert",
  e0d62e: "alert",
  d0d040: "alert",
  "00e676": "ok",
  "35e87a": "ok",
  "2ce090": "ok",
  "00cc33": "ok",
  "4ade80": "ok",
  "34d399": "ok",
  "22c55e": "ok",
  "00a884": "ok",
  ccffcc: "ok",
  "00ff41": "termgreen",
  ff5252: "bad",
  ff3333: "bad",
  ff5555: "bad",
  ff4444: "bad",
  f87171: "bad",
  ef4444: "bad",
  ff6b6b: "bad",
  ff3860: "bad",
  "00e5ff": "mercury",
  "00b8d4": "mercdim",
  "33d4f5": "mercury",
  "7dd3fc": "mercury",
  "35c2f0": "aero",
  "3aadf0": "aero",
  "4896f0": "aero",
  b24bf5: "quint",
  "8b5cf6": "quintdim",
  b794f6: "quintdim",
  d76bf5: "orchid",
  e86ee6: "orchid",
  e06df0: "orchid",
  ffe6ff: "orchid",
  f54d99: "magenta",
  ff00ff: "magenta",
  cc00cc: "magenta",
  "1ec4b8": "aqua",
  "24d6a3": "aqua",
  "00d4aa": "aqua",
  "00f5d4": "aqua",
  "12001f": "quintbg",
  "0a0014": "quintbg",
  "4a1d6b": "quintbg",
  "001520": "mercurybg",
  "001a25": "mercurybg",
  "0c4a6e": "mercurybg",
  "001100": "okbg",
  "003300": "okbg",
  "18181b": "inset",
  262626: "line",
  "1a1a1a": "inset",
  111111: "void",
  e5e5e5: "faint",
  a3a3a3: "ash",
  737373: "leather",
  "2c1810": "paperink",
  "1a0f08": "paperhead",
  "8a7050": "paperlabel",
  e8d5b8: "papersoft",
  b89a68: "paperline",
  e0c898: "paperline",
  f5e6c8: "paperbg",
};

// Hexes whose meaning depends on the utility prefix.
const SPECIAL = {
  "0a0806": { text: "onaccent", default: "void" },
  f0dfc0: { bg: "paper", default: "goldhi" },
  d4b896: { border: "paperline", default: "goldsoft" },
};

// Brand / third-party colors that stay literal in both themes.
const KEEP = new Set(["1877f2", "1da1f2", "0a66c2", "e4405f", "e0f2fe"]);

function categoryOf(utility) {
  if (utility.startsWith("text") || utility === "caret" || utility === "decoration") return "text";
  if (utility.startsWith("bg") || utility === "from" || utility === "via" || utility === "to")
    return "bg";
  if (utility.startsWith("border") || utility === "divide" || utility === "outline")
    return "border";
  return "other";
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(entry)) yield p;
  }
}

let totalFiles = 0;
let totalReplacements = 0;
const leftovers = new Map();

for (const file of walk("src")) {
  const src = readFileSync(file, "utf8");
  let count = 0;
  const out = src.replace(/([A-Za-z-]+)-\[#([0-9a-fA-F]{6})\]/g, (m, util, hex) => {
    const key = hex.toLowerCase();
    if (KEEP.has(key)) return m;
    const special = SPECIAL[key];
    let token;
    if (special) {
      const cat = categoryOf(util);
      token = special[cat] ?? special.default;
    } else {
      token = MAP[key];
    }
    if (!token) {
      leftovers.set(key, (leftovers.get(key) ?? 0) + 1);
      return m;
    }
    count++;
    return `${util}-${token}`;
  });
  if (count > 0) {
    writeFileSync(file, out);
    totalFiles++;
    totalReplacements += count;
  }
}

console.log(`migrated ${totalReplacements} classes across ${totalFiles} files`);
if (leftovers.size > 0) {
  console.log("UNMAPPED (left as literal hex):");
  for (const [hex, n] of [...leftovers.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  #${hex} x${n}`);
  }
}
