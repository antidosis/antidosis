/**
 * Site-wide themes, selectable in Dashboard → Settings → Appearance.
 * Each id maps to a `[data-theme="<id>"]` block in globals.css. The value is
 * stored in localStorage under "antidosis-theme" and mirrored onto
 * `<html data-theme>` pre-paint by the init script in root layout.
 */

export type SiteThemeId =
  "dark" | "light" | "chrome" | "ember" | "phosphor" | "ultraviolet" | "glacier" | "regal" | "rose";

export interface SiteTheme {
  id: SiteThemeId;
  label: string;
  description: string;
  /** [background, accent] for the picker swatch. */
  swatch: [string, string];
}

export const SITE_THEMES: SiteTheme[] = [
  {
    id: "dark",
    label: "Obsidian",
    description: "The original dark void",
    swatch: ["#0a0806", "#f5a623"],
  },
  {
    id: "light",
    label: "Daybreak",
    description: "Warm paper, bronze ink",
    swatch: ["#f6f1e7", "#b06f08"],
  },
  {
    id: "chrome",
    label: "Chrome",
    description: "Liquid metal, icy blue",
    swatch: ["#0c0e11", "#78c8ff"],
  },
  { id: "ember", label: "Ember", description: "Molten forge heat", swatch: ["#160d0a", "#ff9628"] },
  {
    id: "phosphor",
    label: "Phosphor",
    description: "The old green screen",
    swatch: ["#040a06", "#78ff96"],
  },
  {
    id: "ultraviolet",
    label: "Ultraviolet",
    description: "Synthwave dusk",
    swatch: ["#0c0814", "#d76bf5"],
  },
  {
    id: "glacier",
    label: "Glacier",
    description: "Arctic terminal ice",
    swatch: ["#060c12", "#00e5ff"],
  },
  {
    id: "regal",
    label: "Regal",
    description: "Obsidian and brass",
    swatch: ["#090805", "#fab428"],
  },
  {
    id: "rose",
    label: "Rose Noir",
    description: "Black cherry neon",
    swatch: ["#0e070a", "#f54d99"],
  },
];

const THEME_IDS = new Set(SITE_THEMES.map((t) => t.id));

export function isSiteThemeId(value: string | null | undefined): value is SiteThemeId {
  return !!value && THEME_IDS.has(value as SiteThemeId);
}

export function applySiteTheme(theme: SiteThemeId) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("antidosis-theme", theme);
  } catch {
    // private mode — theme still applies for this session
  }
  window.dispatchEvent(new CustomEvent("antidosis-theme", { detail: theme }));
}

export function currentSiteTheme(): SiteThemeId {
  const value = document.documentElement.dataset.theme;
  return isSiteThemeId(value) ? value : "dark";
}

/* ─── Font packs ─── */

export type FontPackId = "terminal" | "system" | "editorial" | "typewriter";

export interface FontPack {
  id: FontPackId;
  label: string;
  description: string;
  /** CSS font stack applied to the body. */
  stack: string;
  /** CSS font stack used to render the picker preview. */
  preview: string;
}

export const FONT_PACKS: FontPack[] = [
  {
    id: "terminal",
    label: "Terminal",
    description: "The original monospace",
    stack: 'var(--font-mono), "SF Mono", "Fira Code", Consolas, monospace',
    preview: '"SF Mono", "Fira Code", Consolas, monospace',
  },
  {
    id: "system",
    label: "System",
    description: "Clean, modern sans-serif",
    stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    preview: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Warm serif for readers",
    stack: '"Iowan Old Style", Palatino, Georgia, "Times New Roman", serif',
    preview: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "typewriter",
    label: "Typewriter",
    description: "Hard Courier, all business",
    stack: '"Courier New", Courier, "Lucida Console", monospace',
    preview: '"Courier New", Courier, monospace',
  },
];

export function isFontPackId(value: string | null | undefined): value is FontPackId {
  return !!value && FONT_PACKS.some((f) => f.id === value);
}

export function applyFontPack(pack: FontPackId) {
  document.documentElement.dataset.font = pack;
  try {
    localStorage.setItem("antidosis-font", pack);
  } catch {
    // private mode — font still applies for this session
  }
  window.dispatchEvent(new CustomEvent("antidosis-font", { detail: pack }));
}

export function currentFontPack(): FontPackId {
  const value = document.documentElement.dataset.font;
  return isFontPackId(value) ? value : "terminal";
}
