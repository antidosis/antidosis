/**
 * Site-wide themes, selectable in Dashboard → Settings → Appearance.
 * Each id maps to a `[data-theme="<id>"]` block in globals.css. The value is
 * stored in localStorage under "antidosis-theme" and mirrored onto
 * `<html data-theme>` pre-paint by the init script in root layout.
 */

export type SiteThemeId =
  | "gaia"
  | "dark"
  | "chrome"
  | "ember"
  | "phosphor"
  | "ultraviolet"
  | "glacier"
  | "regal"
  | "rose"
  | "light"
  | "porcelain"
  | "sage"
  | "linen"
  | "skyline"
  | "rosewater"
  | "lavender"
  | "citrus";

export type ThemeBrightness = "dark" | "light";

export interface SiteTheme {
  id: SiteThemeId;
  label: string;
  description: string;
  /** [background, accent] for the picker swatch. */
  swatch: [string, string];
  brightness: ThemeBrightness;
}

export const SITE_THEMES: SiteTheme[] = [
  // ─── Dark ───
  {
    id: "gaia",
    label: "Gaia",
    description: "Mother Earth — emerald signal, aqua water",
    swatch: ["#070c09", "#1ed282"],
    brightness: "dark",
  },
  {
    id: "dark",
    label: "Obsidian",
    description: "The original dark void",
    swatch: ["#0a0806", "#f5a623"],
    brightness: "dark",
  },
  {
    id: "chrome",
    label: "Chrome",
    description: "Liquid metal, icy blue",
    swatch: ["#0c0e11", "#78c8ff"],
    brightness: "dark",
  },
  {
    id: "ember",
    label: "Ember",
    description: "Molten forge heat",
    swatch: ["#160d0a", "#ff9628"],
    brightness: "dark",
  },
  {
    id: "phosphor",
    label: "Phosphor",
    description: "The old green screen",
    swatch: ["#040a06", "#78ff96"],
    brightness: "dark",
  },
  {
    id: "ultraviolet",
    label: "Ultraviolet",
    description: "Synthwave dusk",
    swatch: ["#0c0814", "#d76bf5"],
    brightness: "dark",
  },
  {
    id: "glacier",
    label: "Glacier",
    description: "Arctic terminal ice",
    swatch: ["#060c12", "#00e5ff"],
    brightness: "dark",
  },
  {
    id: "regal",
    label: "Regal",
    description: "Obsidian and brass",
    swatch: ["#090805", "#fab428"],
    brightness: "dark",
  },
  {
    id: "rose",
    label: "Rose Noir",
    description: "Black cherry neon",
    swatch: ["#0e070a", "#f54d99"],
    brightness: "dark",
  },
  // ─── Light ───
  {
    id: "light",
    label: "Daybreak",
    description: "Warm paper, bronze ink",
    swatch: ["#f6f1e7", "#b06f08"],
    brightness: "light",
  },
  {
    id: "porcelain",
    label: "Porcelain",
    description: "Crisp white, slate ink",
    swatch: ["#f7f8fa", "#026cb4"],
    brightness: "light",
  },
  {
    id: "sage",
    label: "Sage",
    description: "Botanical whites, moss ink",
    swatch: ["#f3f6f1", "#8c6e0a"],
    brightness: "light",
  },
  {
    id: "linen",
    label: "Linen",
    description: "Warm beige, umber ink",
    swatch: ["#f5efe5", "#af5f0f"],
    brightness: "light",
  },
  {
    id: "skyline",
    label: "Skyline",
    description: "Pale ice blue, navy ink",
    swatch: ["#eef3f8", "#0569af"],
    brightness: "light",
  },
  {
    id: "rosewater",
    label: "Rosewater",
    description: "Blush whites, plum ink",
    swatch: ["#f9f1f0", "#b45f14"],
    brightness: "light",
  },
  {
    id: "lavender",
    label: "Lavender",
    description: "Pale violet, orchid ink",
    swatch: ["#f5f2f9", "#a0690f"],
    brightness: "light",
  },
  {
    id: "citrus",
    label: "Citrus",
    description: "Cream pages, lime zest",
    swatch: ["#f7f5e8", "#918105"],
    brightness: "light",
  },
];

const THEME_IDS = new Set(SITE_THEMES.map((t) => t.id));
const LIGHT_THEME_IDS = new Set(
  SITE_THEMES.filter((t) => t.brightness === "light").map((t) => t.id)
);

export function isSiteThemeId(value: string | null | undefined): value is SiteThemeId {
  return !!value && THEME_IDS.has(value as SiteThemeId);
}

/** Whether a theme id is one of the light palettes. */
export function isLightThemeId(value: string | null | undefined): boolean {
  return !!value && LIGHT_THEME_IDS.has(value as SiteThemeId);
}

/* ─── Light/dark pairing ───
 * Members pick ONE dark theme and ONE light theme. The header toggle flips
 * between the two picks; the pre-paint init script uses the pair with the OS
 * preference to choose which side shows by default. */

export interface ThemePair {
  dark: SiteThemeId;
  light: SiteThemeId;
}

export const DEFAULT_THEME_PAIR: ThemePair = { dark: "gaia", light: "light" };

export function getThemePair(): ThemePair {
  try {
    const raw = localStorage.getItem("antidosis-pair");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemePair>;
      return {
        dark: isSiteThemeId(parsed.dark) && !isLightThemeId(parsed.dark) ? parsed.dark : "gaia",
        light: isSiteThemeId(parsed.light) && isLightThemeId(parsed.light) ? parsed.light : "light",
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_THEME_PAIR };
}

export function setThemePair(pair: ThemePair) {
  try {
    localStorage.setItem("antidosis-pair", JSON.stringify(pair));
  } catch {
    // private mode — pair still applies for this session
  }
}

export function applySiteTheme(theme: SiteThemeId) {
  document.documentElement.dataset.theme = theme;
  // Keep the pair in sync: applying a theme claims its brightness slot.
  const pair = getThemePair();
  if (isLightThemeId(theme)) {
    pair.light = theme;
  } else {
    pair.dark = theme;
  }
  setThemePair(pair);
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
