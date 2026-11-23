"use client";

import { useEffect, useState } from "react";

import { Check, Moon, Sun } from "lucide-react";

import {
  applySiteTheme,
  currentSiteTheme,
  isLightThemeId,
  SITE_THEMES,
  type SiteThemeId,
  type ThemeBrightness,
} from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const [active, setActive] = useState<SiteThemeId>("dark");
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<ThemeBrightness>("dark");

  useEffect(() => {
    const current = currentSiteTheme();
    setActive(current);
    setTab(isLightThemeId(current) ? "light" : "dark");
    setReady(true);
    function sync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (SITE_THEMES.some((t) => t.id === detail)) {
        setActive(detail as SiteThemeId);
        setTab(isLightThemeId(detail) ? "light" : "dark");
      }
    }
    window.addEventListener("antidosis-theme", sync);
    return () => window.removeEventListener("antidosis-theme", sync);
  }, []);

  const themes = SITE_THEMES.filter((t) => t.brightness === tab);

  return (
    <div>
      {/* Light / Dark tabs */}
      <div
        role="tablist"
        aria-label="Theme brightness"
        className="mb-4 inline-flex rounded border border-line bg-inset/60 p-0.5"
      >
        {(
          [
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm transition-colors",
              tab === t.id ? "bg-raise text-gold shadow-sm" : "text-ash hover:text-parchment"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            <span className="font-mono text-[10px] opacity-60">
              {SITE_THEMES.filter((s) => s.brightness === t.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {themes.map((theme) => {
          const isActive = ready && active === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                applySiteTheme(theme.id);
                setActive(theme.id);
              }}
              aria-pressed={isActive}
              className={cn(
                "group relative overflow-hidden rounded border p-3 text-left transition-all",
                isActive
                  ? "border-sun/60 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                  : "border-line hover:border-linehi"
              )}
            >
              {/* Swatch preview */}
              <span
                aria-hidden
                className="mb-2.5 block h-14 w-full rounded-sm border border-black/20"
                style={{
                  background: `linear-gradient(135deg, ${theme.swatch[0]} 0%, ${theme.swatch[0]} 55%, ${theme.swatch[1]}22 100%), ${theme.swatch[0]}`,
                  boxShadow: `inset 0 0 0 1px ${theme.swatch[1]}44`,
                }}
              >
                <span
                  aria-hidden
                  className="mt-2 ml-2 inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: theme.swatch[1], boxShadow: `0 0 8px ${theme.swatch[1]}` }}
                />
              </span>
              <span className="flex items-center justify-between gap-2">
                <span>
                  <span className="block text-sm text-gold">{theme.label}</span>
                  <span className="block text-[11px] text-ash">{theme.description}</span>
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0 text-sun" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
