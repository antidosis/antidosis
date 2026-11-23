"use client";

import { useEffect, useState } from "react";

import { Check } from "lucide-react";

import { applySiteTheme, currentSiteTheme, SITE_THEMES, type SiteThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const [active, setActive] = useState<SiteThemeId>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setActive(currentSiteTheme());
    setReady(true);
    function sync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (SITE_THEMES.some((t) => t.id === detail)) {
        setActive(detail as SiteThemeId);
      }
    }
    window.addEventListener("antidosis-theme", sync);
    return () => window.removeEventListener("antidosis-theme", sync);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {SITE_THEMES.map((theme) => {
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
              className="mb-2.5 block h-14 w-full rounded-sm border border-black/30"
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
  );
}
