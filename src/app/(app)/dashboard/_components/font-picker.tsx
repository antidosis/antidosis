"use client";

import { useEffect, useState } from "react";

import { Check, Type } from "lucide-react";

import { syncAppearancePreference } from "@/lib/appearance-sync";
import { applyFontPack, currentFontPack, FONT_PACKS, type FontPackId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function FontPicker() {
  const [active, setActive] = useState<FontPackId>("terminal");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe init from persisted DOM state before first paint
    setActive(currentFontPack());
    setReady(true);
    function sync(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (FONT_PACKS.some((f) => f.id === detail)) {
        setActive(detail as FontPackId);
      }
    }
    window.addEventListener("antidosis-font", sync);
    return () => window.removeEventListener("antidosis-font", sync);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {FONT_PACKS.map((pack) => {
        const isActive = ready && active === pack.id;
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => {
              applyFontPack(pack.id);
              setActive(pack.id);
              syncAppearancePreference({ font: pack.id });
            }}
            aria-pressed={isActive}
            className={cn(
              "group rounded border p-3 text-left transition-all",
              isActive
                ? "border-sun/60 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                : "border-line hover:border-linehi"
            )}
          >
            <span
              aria-hidden
              className="mb-2 flex h-12 w-full items-center justify-center rounded-sm border border-line bg-inset/60"
            >
              <Type className="h-4 w-4 text-ash" style={{ fontFamily: pack.preview }} />
              <span className="ml-1.5 text-lg text-gold" style={{ fontFamily: pack.preview }}>
                Aa
              </span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span>
                <span className="block text-sm text-gold">{pack.label}</span>
                <span className="block text-[11px] text-ash">{pack.description}</span>
              </span>
              {isActive && <Check className="h-4 w-4 shrink-0 text-sun" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
