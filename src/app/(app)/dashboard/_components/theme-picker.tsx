"use client";

import { useEffect, useState } from "react";

import { Check, Moon, Pin, Sun, Type } from "lucide-react";

import { currentPairForSync, syncAppearancePreference } from "@/lib/appearance-sync";
import {
  applySiteTheme,
  currentSiteTheme,
  getThemePair,
  isLightThemeId,
  SITE_THEMES,
  type SiteThemeId,
  type ThemeBrightness,
} from "@/lib/themes";
import { cn } from "@/lib/utils";

import { FontPicker } from "./font-picker";

export function ThemePicker() {
  const [active, setActive] = useState<SiteThemeId>("dark");
  const [pair, setPair] = useState(() => getThemePair());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<ThemeBrightness | "fonts">("dark");

  useEffect(() => {
    const current = currentSiteTheme();
    setActive(current);
    setPair(getThemePair());
    setTab(isLightThemeId(current) ? "light" : "dark");
    setReady(true);
    function sync(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (SITE_THEMES.some((theme) => theme.id === detail)) {
        setActive(detail as SiteThemeId);
        setTab(isLightThemeId(detail) ? "light" : "dark");
        setPair(getThemePair());
      }
    }
    window.addEventListener("antidosis-theme", sync);
    return () => window.removeEventListener("antidosis-theme", sync);
  }, []);

  const brightness = tab === "fonts" ? (isLightThemeId(active) ? "light" : "dark") : tab;
  const themes = SITE_THEMES.filter((theme) => theme.brightness === brightness);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Appearance options"
        className="mb-4 inline-flex max-w-full rounded-lg border border-line bg-inset/60 p-1"
      >
        {(
          [
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
            { id: "fonts", label: "Fonts", icon: Type },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
            className={cn(
              "flex min-h-10 items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors sm:px-4",
              tab === option.id ? "bg-raise text-gold shadow-sm" : "text-ash hover:text-parchment"
            )}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
            {option.id !== "fonts" && (
              <span className="hidden font-mono text-[10px] opacity-60 sm:inline">
                {SITE_THEMES.filter((theme) => theme.brightness === option.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "fonts" ? (
        <div role="tabpanel">
          <p className="mb-4 text-sm text-ash">
            Choose how body text reads across the site. Headings keep the antidosis display style.
          </p>
          <FontPicker />
        </div>
      ) : (
        <div role="tabpanel">
          <p className="mb-4 text-sm leading-relaxed text-ash">
            Save one light and one dark theme. The navbar sun/moon switches between your pair on
            this device and in the installed app.
          </p>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
            {themes.map((theme) => {
              const isActive = ready && active === theme.id;
              const isSavedPick = pair[brightness] === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    applySiteTheme(theme.id);
                    setActive(theme.id);
                    setPair(getThemePair());
                    syncAppearancePreference({ theme: theme.id, ...currentPairForSync() });
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border bg-surface/35 p-3 text-left transition-all",
                    isActive
                      ? "border-sun/60 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                      : isSavedPick
                        ? "border-mercury/50"
                        : "border-line hover:border-linehi"
                  )}
                >
                  <span
                    aria-hidden
                    className="mb-2.5 block h-12 w-full rounded border border-black/20"
                    style={{
                      background: `linear-gradient(135deg, ${theme.swatch[0]} 0%, ${theme.swatch[0]} 55%, ${theme.swatch[1]}22 100%), ${theme.swatch[0]}`,
                      boxShadow: `inset 0 0 0 1px ${theme.swatch[1]}44`,
                    }}
                  >
                    <span
                      className="ml-2 mt-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        background: theme.swatch[1],
                        boxShadow: `0 0 8px ${theme.swatch[1]}`,
                      }}
                    />
                  </span>
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block text-sm text-gold">{theme.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-ash">
                        {theme.description}
                      </span>
                      {isSavedPick && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-mercury">
                          <Pin className="h-2.5 w-2.5" /> Your {brightness} pick
                        </span>
                      )}
                    </span>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-sun" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
