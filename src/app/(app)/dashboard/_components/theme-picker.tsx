"use client";

import { useEffect, useState } from "react";

import { Check, Moon, Pin, Sun } from "lucide-react";

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

export function ThemePicker() {
  const [active, setActive] = useState<SiteThemeId>("dark");
  const [pair, setPair] = useState(() => getThemePair());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<ThemeBrightness>("dark");

  useEffect(() => {
    const current = currentSiteTheme();
    setActive(current);
    setPair(getThemePair());
    setTab(isLightThemeId(current) ? "light" : "dark");
    setReady(true);
    function sync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (SITE_THEMES.some((t) => t.id === detail)) {
        setActive(detail as SiteThemeId);
        setTab(isLightThemeId(detail) ? "light" : "dark");
        setPair(getThemePair()); // applySiteTheme claims the brightness slot
      }
    }
    window.addEventListener("antidosis-theme", sync);
    return () => window.removeEventListener("antidosis-theme", sync);
  }, []);

  const themes = SITE_THEMES.filter((t) => t.brightness === tab);

  return (
    <div>
      <p className="mb-3 text-xs text-ash">
        Pick one theme per side — the navbar sun/moon flips between{" "}
        <span className="text-parchment">your light pick</span> and{" "}
        <span className="text-parchment">your dark pick</span>.
      </p>

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
          const isSavedPick = pair[tab] === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                applySiteTheme(theme.id); // claims this brightness slot + persists
                setActive(theme.id);
                setPair(getThemePair());
                syncAppearancePreference({ theme: theme.id, ...currentPairForSync() });
              }}
              aria-pressed={isActive}
              className={cn(
                "group relative overflow-hidden rounded border p-3 text-left transition-all",
                isActive
                  ? "border-sun/60 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                  : isSavedPick
                    ? "border-mercury/50"
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
                  <span className="flex flex-wrap items-center gap-1 text-[11px] text-ash">
                    {theme.description}
                    {isSavedPick && (
                      <span className="inline-flex items-center gap-0.5 text-mercury">
                        <Pin className="h-2.5 w-2.5" />
                        your {tab} pick
                      </span>
                    )}
                  </span>
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
