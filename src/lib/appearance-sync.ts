"use client";

import { applyFontPack, applySiteTheme, isFontPackId, isSiteThemeId } from "@/lib/themes";

/**
 * Cross-device appearance sync.
 *
 * Local device choice always wins for speed (localStorage, applied pre-paint).
 * Pickers additionally PATCH the account so the choice follows the member to
 * other devices; a device with no local choice yet adopts the account value
 * when the profile loads.
 */

export interface AppearancePreferences {
  theme?: string | null;
  font?: string | null;
}

/** Fire-and-forget: persist an appearance change to the account. */
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

/**
 * Adopt account-level appearance on a device that hasn't chosen locally yet.
 * Returns true when something was applied.
 */
export function applyAccountPreferences(raw: string | null | undefined): boolean {
  const prefs = parseAppearancePreferences(raw);
  if (!prefs) return false;
  let applied = false;

  try {
    if (prefs.theme && isSiteThemeId(prefs.theme) && !localStorage.getItem("antidosis-theme")) {
      applySiteTheme(prefs.theme);
      applied = true;
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
