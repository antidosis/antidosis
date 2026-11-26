"use client";

import { ArrowLeftRight, Check } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { EXCHANGE_MODES, type ExchangeModeKey } from "@/lib/exchange-modes";
import { cn } from "@/lib/utils";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

interface AcceptedExchangesSectionProps {
  control: Control<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  /** Marks the form dirty like any other edit, so the save strip appears. */
  onChanged: () => void;
}

/**
 * What a listing accepts in return — cash, goods, services, or creative deals.
 * Shown as chips on the directory card so the exchange stays reciprocal.
 */
export function AcceptedExchangesSection({
  control,
  setValue,
  onChanged,
}: AcceptedExchangesSectionProps) {
  const selected = useWatch({ control, name: "acceptedExchanges" }) ?? [];

  function toggle(key: ExchangeModeKey) {
    const current: string[] = Array.isArray(selected) ? selected : [];
    const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    onChanged();
    setValue("acceptedExchanges", next, { shouldDirty: true });
  }

  return (
    <SectionCard
      tone="directory"
      title="Accepted payment & exchange"
      description="What you'll take in return — pick every form that applies. Shown on your directory listing so people know trades are welcome."
    >
      <div className="flex flex-wrap gap-2">
        {EXCHANGE_MODES.map((mode) => {
          const active = Array.isArray(selected) && selected.includes(mode.key);
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => toggle(mode.key)}
              aria-pressed={active}
              title={mode.hint}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                active
                  ? "border-aero/60 bg-aero/15 text-aero"
                  : "border-line bg-inset text-parchment hover:border-linehi"
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {mode.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ash">
        <ArrowLeftRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aero" />
        Nothing selected means &ldquo;ask me&rdquo; — but listings with clear exchange options get
        noticeably more interest.
      </p>
    </SectionCard>
  );
}
