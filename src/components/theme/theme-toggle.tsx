"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";

import {
  applySiteTheme,
  getThemePair,
  isLightThemeId,
  type SiteThemeId,
  type ThemeBrightness,
} from "@/lib/themes";

/**
 * Intelligent brightness toggle. Each member has a chosen dark theme and a
 * chosen light theme (Dashboard → Settings → Appearance); this flips between
 * THEIRS — light pick ↔ dark pick — rather than hardcoding Daybreak/Obsidian.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [brightness, setBrightness] = useState<ThemeBrightness>("dark");

  useEffect(() => {
    const value = document.documentElement.dataset.theme;
    setBrightness(isLightThemeId(value) ? "light" : "dark");

    function sync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setBrightness(isLightThemeId(detail) ? "light" : "dark");
    }
    window.addEventListener("antidosis-theme", sync);
    return () => window.removeEventListener("antidosis-theme", sync);
  }, []);

  function toggle() {
    const pair = getThemePair();
    const next: SiteThemeId = brightness === "dark" ? pair.light : pair.dark;
    setBrightness(isLightThemeId(next) ? "light" : "dark");
    applySiteTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        brightness === "dark" ? "Switch to your light theme" : "Switch to your dark theme"
      }
      title={brightness === "dark" ? "Switch to your light theme" : "Switch to your dark theme"}
      className={`text-ash hover:text-gold transition-colors ${className}`}
    >
      {brightness === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
