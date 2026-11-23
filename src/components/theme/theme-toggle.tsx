"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";

import { isLightThemeId, type SiteThemeId, type ThemeBrightness } from "@/lib/themes";

/**
 * Quick brightness toggle — treats every named theme by its actual
 * brightness: any light palette (Daybreak, Porcelain, …) flips to Obsidian,
 * any dark palette flips to Daybreak. Pick specific themes in Dashboard →
 * Settings → Appearance.
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
    const theme: SiteThemeId = brightness === "dark" ? "light" : "dark";
    setBrightness(theme === "light" ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("antidosis-theme", theme);
    } catch {
      // private mode — theme still applies for this session
    }
    window.dispatchEvent(new CustomEvent("antidosis-theme", { detail: theme }));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={brightness === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={brightness === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`text-ash hover:text-gold transition-colors ${className}`}
    >
      {brightness === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
