"use client";

import { AlertTriangle, Clock3 } from "lucide-react";

import { getUrgencyLabel, URGENT_CONTACT_MIN } from "@/lib/urgency";
import { cn } from "@/lib/utils";

interface UrgencyFieldProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

export function UrgencyField({ value, onChange, id = "need-urgency" }: UrgencyFieldProps) {
  const urgent = value >= URGENT_CONTACT_MIN;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        urgent ? "border-alert/40 bg-alert/[0.055]" : "border-line bg-inset/45"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {urgent ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
          ) : (
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-mercury" />
          )}
          <div>
            <label htmlFor={id} className="text-sm font-medium text-gold">
              How urgent is it?
            </label>
            <p className="mt-0.5 text-xs text-ash">0 is flexible. 9 means as soon as possible.</p>
          </div>
        </div>
        <output htmlFor={id} className="shrink-0 text-right">
          <span className={cn("block font-mono text-xl", urgent ? "text-alert" : "text-sun")}>
            {value}/9
          </span>
          <span className="block text-xs text-parchment">{getUrgencyLabel(value)}</span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={9}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-[var(--c-sun)]"
        aria-valuetext={`${value} out of 9, ${getUrgencyLabel(value)}`}
      />
      <div className="mt-2 flex justify-between text-[11px] text-ash" aria-hidden="true">
        <span>Whenever</span>
        <span>Medium · 5</span>
        <span>ASAP · 9</span>
      </div>
    </div>
  );
}
