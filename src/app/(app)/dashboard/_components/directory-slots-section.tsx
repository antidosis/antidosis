"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  MAX_SPECIALTY_SLOTS,
  PROFESSIONS,
  attributeHighlights,
  getProfession,
  parseAttributes,
  type SpecialtyAttributes,
} from "@/lib/professions";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

interface SpecialtyRecord {
  id: string;
  profession: string;
  headline: string | null;
  attributes: string | null;
  slot: number;
}

interface DirectorySlotsSectionProps {
  /** Fired whenever slot-1 occupancy changes (claim or release). */
  onSlotChange?: (hasSlot: boolean) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  trades: "Trades & hands-on",
  creative: "Creative",
  care: "Care & wellbeing",
  food: "Food",
  professional: "Professional services",
  influence: "Influence & content",
};

const SLOT_NAMES = ["Primary specialty", "Second specialty", "Third specialty"];

export function DirectorySlotsSection({ onSlotChange }: DirectorySlotsSectionProps) {
  const { toast } = useToast();
  const { data, isLoading } = useApi<{ specialties: SpecialtyRecord[] }>(
    "/api/v1/profiles/me/specialties"
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lockedInfo, setLockedInfo] = useState<number | null>(null);

  const specialties = useMemo(() => data?.specialties ?? [], [data]);
  const slotOne = specialties.find((specialty) => specialty.slot === 1) ?? null;

  useEffect(() => {
    onSlotChange?.(Boolean(slotOne));
  }, [slotOne, onSlotChange]);

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const taken = new Set(specialties.map((specialty) => specialty.profession));
    const pool = PROFESSIONS.filter((profession) => !taken.has(profession.key));
    if (!needle) return pool.slice(0, 7);
    const matches = pool.filter(
      (profession) =>
        profession.label.toLowerCase().includes(needle) ||
        profession.category.includes(needle) ||
        profession.pitch.toLowerCase().includes(needle)
    );
    return matches.slice(0, 7);
  }, [query, specialties]);

  async function claim(professionKey: string) {
    const profession = getProfession(professionKey);
    if (!profession) return;
    try {
      const response = await fetch("/api/v1/profiles/me/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession: professionKey }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast(typeof result.error === "string" ? result.error : "Couldn't claim the slot", "error");
        return;
      }
      setPickerOpen(false);
      setQuery("");
      setEditingId(result.specialty.id);
      await mutate("/api/v1/profiles/me/specialties");
      toast(`${profession.label} added to your directory listing`, "success");
    } catch {
      toast("Couldn't claim the slot — try again", "error");
    }
  }

  return (
    <section className="vessel overflow-hidden rounded-xl border-aero/25">
      <div className="border-b border-line/60 bg-aero/[0.03] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-aero">
              Directory slots
            </p>
            <h3 className="heading-display mt-1 text-xl text-gold">
              What do you want to be found for?
            </h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ash">
              Each slot is a profession you can be discovered and filtered by in the directory. Your
              first slot is free, forever.
            </p>
          </div>
          <Badge variant="quintessence" className="text-xs">
            {specialties.length}/{MAX_SPECIALTY_SLOTS} slots
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
        {/* Slot 1 — the free live slot */}
        {slotOne ? (
          <SpecialtyEditor
            key={slotOne.id}
            specialty={slotOne}
            editing={editingId === slotOne.id}
            onToggleEdit={() => setEditingId(editingId === slotOne.id ? null : slotOne.id)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={isLoading}
            className={cn(
              "group flex min-h-44 flex-col items-start justify-between rounded-lg border-2 border-dashed border-aero/30 bg-aero/[0.03] p-4 text-left transition-colors",
              "hover:border-aero/60 hover:bg-aero/[0.06] disabled:opacity-50"
            )}
          >
            <span className="flex w-full items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-aero">
                Slot 01 · Free
              </span>
              <Sparkles className="h-4 w-4 text-aero/60 transition-colors group-hover:text-aero" />
            </span>
            <span>
              <span className="block text-base font-medium text-gold">Claim your specialty</span>
              <span className="mt-1 block text-sm text-ash">
                Plumber, tutor, influencer — pick the profession people should find you for.
              </span>
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-aero">
              <Plus className="h-4 w-4" /> Choose a profession
            </span>
          </button>
        )}

        {/* Slots 2–3 — locked until paid unlocks land */}
        {[2, 3].map((slot) => (
          <div
            key={slot}
            className="relative flex min-h-44 flex-col justify-between rounded-lg border border-line/60 bg-surface/25 p-4"
          >
            <span className="flex w-full items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                Slot 0{slot}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash">
                <Lock className="h-3 w-3" /> Locked
              </span>
            </span>
            <div>
              <p className="text-base font-medium text-ash">{SLOT_NAMES[slot - 1]}</p>
              <p className="mt-1 text-sm text-ash/80">
                Advertise another specialty — for example a plumber who also does lawn care.
              </p>
            </div>
            {lockedInfo === slot ? (
              <p className="mt-3 rounded-md border border-sun/25 bg-sun/[0.06] p-2.5 text-xs leading-relaxed text-sun">
                Paid slot unlocks are coming soon — a small one-off fee opens an extra specialty
                slot. Your first slot stays free, forever.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setLockedInfo(lockedInfo === slot ? null : slot)}
                className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-medium text-ash transition-colors hover:text-sun"
              >
                Notify me <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Profession picker — type-to-search autocomplete, same pattern as the
          skills box in the public profile */}
      {pickerOpen && (
        <div
          className="border-t border-line/60 bg-inset/30 p-4 sm:p-5"
          role="dialog"
          aria-label="Choose a profession"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a profession — plumber, influencer, tutor…"
                autoComplete="off"
                className="text-base"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setQuery("");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line text-ash transition-colors hover:border-linehi hover:text-gold"
              aria-label="Close profession picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {suggestions.length === 0 ? (
            <p className="py-6 text-center text-sm text-ash">
              No professions match &ldquo;{query}&rdquo; — the taxonomy grows with the network.
            </p>
          ) : (
            <ul className="max-w-md divide-y divide-line/50 rounded-md border border-line/70 bg-surface/40">
              {suggestions.map((profession) => (
                <li key={profession.key}>
                  <button
                    type="button"
                    onClick={() => claim(profession.key)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-aero/[0.06]"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gold">
                        {profession.label}
                      </span>
                      <span className="block truncate text-xs text-ash">{profession.pitch}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ash">
                      {CATEGORY_LABEL[profession.category] ?? profession.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/* ─── Active specialty editor with dynamic profession fields ───────────── */

function SpecialtyEditor({
  specialty,
  editing,
  onToggleEdit,
}: {
  specialty: SpecialtyRecord;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  const { toast } = useToast();
  const profession = getProfession(specialty.profession);
  const attributes = useMemo(() => parseAttributes(specialty.attributes), [specialty.attributes]);
  const [draft, setDraft] = useState<SpecialtyAttributes>(attributes);
  const [headline, setHeadline] = useState(specialty.headline ?? "");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!profession) return null;
  const professionLabel = profession.label;
  const highlights = attributeHighlights(profession, attributes);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/profiles/me/specialties/${specialty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: headline || null, attributes: draft }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast(typeof result.error === "string" ? result.error : "Couldn't save", "error");
        return;
      }
      await mutate("/api/v1/profiles/me/specialties");
      toast("Specialty updated", "success");
      onToggleEdit();
    } catch {
      toast("Couldn't save — try again", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      const response = await fetch(`/api/v1/profiles/me/specialties/${specialty.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast("Couldn't remove the specialty", "error");
        return;
      }
      await mutate("/api/v1/profiles/me/specialties");
      toast(`${professionLabel} removed — the slot is free again`, "success");
    } catch {
      toast("Couldn't remove the specialty", "error");
    } finally {
      setRemoving(false);
    }
  }

  function setField(key: string, value: boolean | string | string[]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <div className="flex min-h-44 flex-col rounded-lg border border-aero/40 bg-aero/[0.04] p-4">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-aero">
          <BriefcaseBusiness className="h-3.5 w-3.5" /> Slot 01 · Live
        </span>
        <button
          type="button"
          onClick={onToggleEdit}
          className="text-xs font-medium text-ash transition-colors hover:text-gold"
        >
          {editing ? "Close" : "Edit"}
        </button>
      </div>

      <p className="mt-2 text-lg font-medium text-gold">{profession.label}</p>

      {editing ? (
        <div className="mt-3 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`headline-${specialty.id}`}>Headline (optional)</Label>
            <Input
              id={`headline-${specialty.id}`}
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder={profession.pitch}
              maxLength={120}
              className="text-base"
            />
          </div>

          {profession.fields.map((field) => {
            const value = draft[field.key];
            if (field.kind === "boolean") {
              const on = value === true;
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => setField(field.key, !on)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded border p-3 text-left transition-colors",
                    on
                      ? "border-aero/50 bg-aero/[0.07]"
                      : "border-line bg-inset/50 hover:border-linehi"
                  )}
                >
                  <span className="text-sm text-parchment">{field.label}</span>
                  <span
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
                      on ? "border-aero bg-aero/25" : "border-line bg-raise"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all",
                        on ? "left-5 bg-aero" : "left-1 bg-ash"
                      )}
                    />
                  </span>
                </button>
              );
            }
            if (field.kind === "select") {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setField(field.key, option)}
                        aria-pressed={value === option}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          value === option
                            ? "border-aero/60 bg-aero/15 text-aero"
                            : "border-line bg-inset text-parchment hover:border-linehi"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            if (field.kind === "multi") {
              const selected = Array.isArray(value) ? (value as string[]) : [];
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const active = selected.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setField(
                              field.key,
                              active
                                ? selected.filter((item) => item !== option)
                                : [...selected, option]
                            )
                          }
                          aria-pressed={active}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
                            active
                              ? "border-aero/60 bg-aero/15 text-aero"
                              : "border-line bg-inset text-parchment hover:border-linehi"
                          )}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`${field.key}-${specialty.id}`}>{field.label}</Label>
                <Input
                  id={`${field.key}-${specialty.id}`}
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => setField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength ?? 200}
                  className="text-base"
                />
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save specialty
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onToggleEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={remove}
              disabled={removing}
              className="ml-auto inline-flex items-center gap-1 text-xs text-ash transition-colors hover:text-bad"
            >
              {removing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Release slot
            </button>
          </div>
        </div>
      ) : (
        <>
          {specialty.headline && (
            <p className="mt-1 text-sm text-parchment">{specialty.headline}</p>
          )}
          {highlights.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="inline-flex items-center gap-1 rounded border border-line/70 bg-inset/60 px-2 py-0.5 text-xs text-parchment"
                >
                  <Award className="h-3 w-3 text-aero" /> {highlight}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-ash">
              No details yet — press Edit to answer the questions people filter by.
            </p>
          )}
        </>
      )}
    </div>
  );
}
