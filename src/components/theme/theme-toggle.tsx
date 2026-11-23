"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";

import { isSiteThemeId } from "@/lib/themes";

type Brightness = "dark" | "light";

/**
 * Quick brightness toggle. Named themes (chrome, ember, …) count as dark —
 * toggling switches to Daybreak, and back to Obsidian (the default dark).
 * Pick specific themes in Dashboard → Settings → Appearance.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [brightness, setBrightness] = useState<Brightness>("dark");

  useEffect(() => {
    const value = document.documentElement.dataset.theme;
    setBrightness(value === "light" ? "light" : "dark");

    function sync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setBrightness(detail === "light" ? "light" : "dark");
    }
    window.addEventListener("antidosis-theme", sync);
    return () => window.removeEventListener("antidosis-theme", sync);
  }, []);

  function toggle() {
    const next: Brightness = brightness === "dark" ? "light" : "dark";
    setBrightness(next);
    const theme = isSiteThemeId(next) ? next : "dark";
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
