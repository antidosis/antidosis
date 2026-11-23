"use client";

import {
  applyFontPack,
  applySiteTheme,
  DEFAULT_THEME_PAIR,
  getThemePair,
  isFontPackId,
  isLightThemeId,
  isSiteThemeId,
  setThemePair,
  type ThemePair,
} from "@/lib/themes";

/**
 * Cross-device appearance sync.
 *
 * Local device choice always wins for speed (localStorage, applied pre-paint).
 * Pickers additionally PATCH the account so choices follow the member to
 * other devices: the light/dark pair plus font. A device with no local
 * choice yet adopts the account pair, using the OS preference to pick which
 * side shows.
 */

export interface AppearancePreferences {
  /** Legacy single-theme field — mapped onto the matching pair slot. */
  theme?: string | null;
  light?: string | null;
  dark?: string | null;
  font?: string | null;
}

/** Fire-and-forget: persist appearance changes to the account. */
export function syncAppearancePreference(patch: AppearancePreferences): void {
  try {
    fetch("/api/v1/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: patch }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // offline / private mode — local choice still stands
  }
}

export function parseAppearancePreferences(
  raw: string | null | undefined
): AppearancePreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppearancePreferences;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/** Resolve the account's pair, tolerating the legacy {theme} shape. */
export function pairFromPreferences(prefs: AppearancePreferences | null): ThemePair | null {
  if (!prefs) return null;
  const pair = { ...DEFAULT_THEME_PAIR };
  let found = false;

  const lightGiven = isSiteThemeId(prefs.light) && isLightThemeId(prefs.light);
  const darkGiven = isSiteThemeId(prefs.dark) && !isLightThemeId(prefs.dark);
  if (lightGiven) {
    pair.light = prefs.light as ThemePair["light"];
    found = true;
  }
  if (darkGiven) {
    pair.dark = prefs.dark as ThemePair["dark"];
    found = true;
  }
  // Legacy rows only stored one theme — map it onto its brightness slot,
  // without clobbering slots that were explicitly provided.
  if (isSiteThemeId(prefs.theme)) {
    if (isLightThemeId(prefs.theme)) {
      if (!lightGiven) pair.light = prefs.theme as ThemePair["light"];
    } else if (!darkGiven) {
      pair.dark = prefs.theme as ThemePair["dark"];
    }
    found = true;
  }
  return found ? pair : null;
}

/**
 * Adopt account-level appearance on a device that hasn't chosen locally yet.
 * Returns true when something was applied.
 */
export function applyAccountPreferences(raw: string | null | undefined): boolean {
  const prefs = parseAppearancePreferences(raw);
  if (!prefs) return false;
  let applied = false;

  try {
    // Pair: fill local slots when missing, and adopt the active theme when
    // this device has never chosen one.
    const accountPair = pairFromPreferences(prefs);
    if (accountPair && !localStorage.getItem("antidosis-pair")) {
      setThemePair(accountPair);
      if (!localStorage.getItem("antidosis-theme")) {
        const wantLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        applySiteTheme(accountPair[wantLight ? "light" : "dark"]);
        applied = true;
      }
    }

    if (prefs.font && isFontPackId(prefs.font) && !localStorage.getItem("antidosis-font")) {
      applyFontPack(prefs.font);
      applied = true;
    }
  } catch {
    // localStorage unavailable — nothing to adopt into
  }
  return applied;
}

export function currentPairForSync(): Pick<AppearancePreferences, "light" | "dark"> {
  const pair = getThemePair();
  return { light: pair.light, dark: pair.dark };
}
