"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Loader2,
  Lock,
  Plus,
  Search,
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
  FREE_SLOT_PROFESSIONS,
  INDUSTRIES,
  INDUSTRY_ORDER,
  attributeHighlights,
  getProfession,
  industryOfProfession,
  parseAttributes,
  professionDisplayLabel,
  professionKeyFromInput,
  professionsByIndustry,
  type Profession,
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

const SLOT_NAMES = ["Primary specialty", "Second specialty", "Third specialty"];

function industryLabel(slotOne: SpecialtyRecord[]): string {
  const industries = new Set(
    slotOne
      .map((specialty) => industryOfProfession(specialty.profession))
      .filter((key): key is keyof typeof INDUSTRIES => key !== null)
  );
  if (industries.size === 0) return "Custom professions";
  return [...industries].map((key) => INDUSTRIES[key].label).join(" · ");
}

export function DirectorySlotsSection({ onSlotChange }: DirectorySlotsSectionProps) {
  const { data, isLoading } = useApi<{ specialties: SpecialtyRecord[] }>(
    "/api/v1/profiles/me/specialties"
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lockedInfo, setLockedInfo] = useState<number | null>(null);

  const specialties = useMemo(() => data?.specialties ?? [], [data]);
  const slotOne = useMemo(
    () => specialties.filter((specialty) => specialty.slot === 1),
    [specialties]
  );
  const slotOneFull = slotOne.length >= FREE_SLOT_PROFESSIONS;
  /** The single industry slot 1 is dedicated to, once professions are claimed. */
  const slotIndustry = useMemo(() => {
    const industries = new Set(
      slotOne
        .map((specialty) => industryOfProfession(specialty.profession))
        .filter((key): key is keyof typeof INDUSTRIES => key !== null)
    );
    return industries.size === 1 ? ([...industries][0] as keyof typeof INDUSTRIES) : null;
  }, [slotOne]);

  useEffect(() => {
    onSlotChange?.(slotOne.length > 0);
  }, [slotOne.length, onSlotChange]);

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
              Your slots in the public directory. The first is free, forever — claim it below.
            </p>
          </div>
          <Badge variant="quintessence" className="text-xs">
            {slotOne.length}/{FREE_SLOT_PROFESSIONS} professions · {MAX_SPECIALTY_SLOTS} slots
          </Badge>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Slot strip — the three slots always visible up top */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Slot 1 — free, live */}
          <div
            className={cn(
              "rounded-lg border p-3.5",
              slotOne.length > 0
                ? "border-aero/40 bg-aero/[0.05]"
                : "border-dashed border-aero/30 bg-aero/[0.03]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-aero">
                <BriefcaseBusiness className="h-3.5 w-3.5" /> Slot 01 · Free
              </span>
              {slotOne.length > 0 ? (
                <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_6px_rgba(61,220,151,0.8)]" />
              ) : (
                <Badge variant="quintessence" className="text-[10px]">
                  empty
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-gold">
              {slotOne.length > 0
                ? `${slotOne.length} of ${FREE_SLOT_PROFESSIONS} professions live`
                : "Claim your specialty"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ash">
              {slotOne.length > 0
                ? industryLabel(slotOne)
                : "One industry, up to 4 professions — free forever."}
            </p>
          </div>

          {/* Slots 2–3 — locked until paid unlocks land */}
          {[2, 3].map((slot) => (
            <div
              key={slot}
              className="relative flex flex-col justify-between rounded-lg border border-line/60 bg-surface/25 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                  Slot 0{slot}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
              <div>
                <p className="mt-2 text-sm font-medium text-ash">{SLOT_NAMES[slot - 1]}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ash/80">
                  {slot === 2
                    ? "Advertise another industry — for example a plumber who also does lawn care."
                    : "Go wider again — for example a cleaner who also walks dogs."}
                </p>
              </div>
              {lockedInfo === slot ? (
                <p className="mt-2 rounded-md border border-sun/25 bg-sun/[0.06] p-2 text-xs leading-relaxed text-sun">
                  Paid slot unlocks are coming soon — a small one-off fee opens an extra industry
                  slot.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setLockedInfo(lockedInfo === slot ? null : slot)}
                  className="mt-2 inline-flex items-center gap-1 self-start text-xs font-medium text-ash transition-colors hover:text-sun"
                >
                  Notify me <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Claim CTA when slot 1 is empty */}
        {slotOne.length === 0 && !pickerOpen && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={isLoading}
            className={cn(
              "group mt-3 flex w-full items-center justify-between gap-4 rounded-lg border-2 border-dashed border-aero/30 bg-aero/[0.03] p-4 text-left transition-colors",
              "hover:border-aero/60 hover:bg-aero/[0.06] disabled:opacity-50"
            )}
          >
            <span>
              <span className="block text-sm font-medium text-gold">
                Pick an industry, then the professions you offer
              </span>
              <span className="mt-0.5 block text-xs text-ash">
                Web developer and app developer share one slot, for example.
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-aero">
              <Sparkles className="h-4 w-4" /> Browse industries
            </span>
          </button>
        )}

        {/* Claimed professions — compact rows, expand to edit */}
        {slotOne.length > 0 && (
          <div className="mt-3 divide-y divide-line/40 rounded-lg border border-line/70 bg-surface/20">
            {slotOne.map((specialty) => (
              <SpecialtyRow key={specialty.id} specialty={specialty} />
            ))}
            {!slotOneFull && !pickerOpen && (
              <div className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-aero transition-colors hover:text-gold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another profession (
                  {FREE_SLOT_PROFESSIONS - slotOne.length} left in this slot)
                </button>
              </div>
            )}
            {slotOneFull && (
              <p className="px-4 py-2.5 text-xs text-ash">
                This slot is full — extra slots unlock soon for another industry.
              </p>
            )}
          </div>
        )}
      </div>

      {pickerOpen && (
        <ProfessionPicker
          existing={slotOne.map((specialty) => specialty.profession)}
          remaining={FREE_SLOT_PROFESSIONS - slotOne.length}
          lockedIndustry={slotIndustry}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </section>
  );
}

/* ─── Industry-first profession picker ─────────────────────────────────── */

function ProfessionPicker({
  existing,
  remaining,
  lockedIndustry,
  onClose,
}: {
  existing: string[];
  remaining: number;
  /** Industry already claimed in slot 1 — the picker is confined to it. */
  lockedIndustry: keyof typeof INDUSTRIES | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string | null>(lockedIndustry);
  const [selected, setSelected] = useState<string[]>([]);
  const [claiming, setClaiming] = useState(false);

  const grouped = useMemo(() => professionsByIndustry(), []);
  const taken = useMemo(() => new Set(existing), [existing]);

  // Search mode: match against label + pitch across every industry.
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const matches: { profession: Profession; industryKey: string }[] = [];
    for (const industryKey of INDUSTRY_ORDER) {
      for (const profession of grouped[industryKey]) {
        if (taken.has(profession.key)) continue;
        if (
          profession.label.toLowerCase().includes(needle) ||
          profession.pitch.toLowerCase().includes(needle)
        ) {
          matches.push({ profession, industryKey });
        }
      }
    }
    return matches.slice(0, 12);
  }, [query, grouped, taken]);

  const activeIndustry = industry as keyof typeof INDUSTRIES | null;
  const canClaimFreeText = query.trim().length >= 2 && results.length === 0;

  /** The industry the current selection (or the locked slot) is confined to. */
  function confineIndustry(): string | null {
    if (lockedIndustry) return lockedIndustry;
    for (const key of selected) {
      const found = industryOfProfession(key);
      if (found) return found;
    }
    return null;
  }

  function toggle(key: string) {
    setSelected((previous) => {
      if (previous.includes(key)) return previous.filter((item) => item !== key);
      if (previous.length >= remaining) {
        toast(`This slot holds up to ${FREE_SLOT_PROFESSIONS} professions`, "error");
        return previous;
      }
      // One industry per slot: professions from another industry are disabled
      // in the UI, and this guard covers the race/edge case.
      const confined = confineIndustry();
      const next = industryOfProfession(key);
      if (confined && next && next !== confined) {
        toast(
          `Your slot covers ${INDUSTRIES[confined as keyof typeof INDUSTRIES].label} — ${INDUSTRIES[next].label} needs its own slot`,
          "error"
        );
        return previous;
      }
      return [...previous, key];
    });
  }

  async function claimAll() {
    if (selected.length === 0 && !canClaimFreeText) return;
    setClaiming(true);
    try {
      const keys = selected.length > 0 ? selected : [professionKeyFromInput(query)];
      let claimed = 0;
      for (const key of keys) {
        const profession = getProfession(key);
        const response = await fetch("/api/v1/profiles/me/specialties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profession: profession ? profession.label : key }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast(
            typeof result.error === "string" ? result.error : "Couldn't add the profession",
            "error"
          );
          break;
        }
        claimed += 1;
      }
      await mutate("/api/v1/profiles/me/specialties");
      if (claimed > 0) {
        toast(
          claimed === 1
            ? "Profession added to your listing"
            : `${claimed} professions added to your listing`,
          "success"
        );
        onClose();
      }
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div
      className="border-t border-line/60 bg-inset/30 p-4 sm:p-5"
      role="dialog"
      aria-label="Choose professions"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-aero">
          {activeIndustry ? INDUSTRIES[activeIndustry].label : "Pick an industry"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selected.length > 0 && (
            <span className="text-xs text-ash">
              {selected.length} of {remaining} selected
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-line text-ash transition-colors hover:border-linehi hover:text-gold"
            aria-label="Close profession picker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search — filters across every industry */}
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (industry) setIndustry(null);
          }}
          placeholder="Search professions — plumber, web developer, tutor…"
          autoComplete="off"
          className="pl-9 text-base"
          autoFocus
        />
      </div>

      {query.trim() ? (
        /* Search results — flat list with industry labels */
        <div className="max-w-2xl">
          {(() => {
            const confined = confineIndustry();
            return results.map(({ profession, industryKey }) => {
              const active = selected.includes(profession.key);
              const blocked = confined !== null && industryKey !== confined;
              return (
                <button
                  key={profession.key}
                  type="button"
                  onClick={() => toggle(profession.key)}
                  disabled={blocked}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 border-b border-line/40 px-3 py-2.5 text-left transition-colors last:border-b-0",
                    blocked
                      ? "cursor-not-allowed opacity-50"
                      : active
                        ? "bg-aero/[0.08]"
                        : "hover:bg-aero/[0.04]"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gold">
                      {active && <Check className="mr-1.5 inline h-3.5 w-3.5 text-aero" />}
                      {profession.label}
                    </span>
                    <span className="block text-xs text-ash">
                      {INDUSTRIES[industryKey as keyof typeof INDUSTRIES].label} ·{" "}
                      {blocked ? "different industry — needs its own slot" : profession.pitch}
                    </span>
                  </span>
                  {blocked ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-ash" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 shrink-0 text-ash" />
                  )}
                </button>
              );
            });
          })()}
          {results.length === 0 && (
            <p className="px-1 text-sm text-ash">
              No built-in match for &ldquo;{query.trim()}&rdquo; — claim it as a custom profession
              below.
            </p>
          )}
          {(selected.length > 0 || canClaimFreeText) && (
            <Button type="button" size="sm" onClick={claimAll} disabled={claiming} className="mt-4">
              {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selected.length > 0
                ? `Add ${selected.length} profession${selected.length > 1 ? "s" : ""} to my listing`
                : `Claim "${query.trim()}"`}
            </Button>
          )}
        </div>
      ) : activeIndustry ? (
        /* Industry selected — multi-select professions within it */
        <div>
          <button
            type="button"
            onClick={() => setIndustry(null)}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ash transition-colors hover:text-gold"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> All industries
          </button>
          <p className="mb-3 text-sm text-ash">{INDUSTRIES[activeIndustry].blurb}.</p>
          <div className="flex flex-wrap gap-2">
            {grouped[activeIndustry].map((profession) => {
              const isTaken = taken.has(profession.key);
              const active = selected.includes(profession.key);
              return (
                <button
                  key={profession.key}
                  type="button"
                  disabled={isTaken}
                  onClick={() => toggle(profession.key)}
                  aria-pressed={active}
                  title={profession.pitch}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                    isTaken
                      ? "cursor-not-allowed border-ok/30 bg-ok/[0.06] text-ok"
                      : active
                        ? "border-aero/60 bg-aero/15 text-aero"
                        : "border-line bg-inset text-parchment hover:border-linehi"
                  )}
                >
                  {isTaken ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    active && <Check className="h-3.5 w-3.5" />
                  )}
                  {profession.label}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <Button type="button" size="sm" onClick={claimAll} disabled={claiming} className="mt-4">
              {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add {selected.length} profession{selected.length > 1 ? "s" : ""} to my listing
            </Button>
          )}
        </div>
      ) : (
        /* Industry grid — the slot's industry is highlighted, others show as needing their own slot */
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRY_ORDER.map((industryKey) => {
            const professions = grouped[industryKey];
            const available = professions.filter((profession) => !taken.has(profession.key));
            const isLocked = lockedIndustry !== null && industryKey !== lockedIndustry;
            return (
              <button
                key={industryKey}
                type="button"
                disabled={isLocked}
                onClick={() => setIndustry(industryKey)}
                className={cn(
                  "group rounded-lg border p-4 text-left transition-colors",
                  isLocked
                    ? "cursor-not-allowed border-line/40 bg-surface/20 opacity-60"
                    : lockedIndustry === industryKey
                      ? "border-aero/60 bg-aero/[0.07]"
                      : "border-line/70 bg-surface/40 hover:border-aero/50 hover:bg-aero/[0.04]"
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isLocked ? "text-ash" : "text-gold group-hover:text-aero"
                    )}
                  >
                    {INDUSTRIES[industryKey].label}
                  </span>
                  {isLocked ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-ash" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ash transition-transform group-hover:translate-x-0.5 group-hover:text-aero" />
                  )}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ash">
                  {isLocked ? "Needs its own slot — unlocks soon" : INDUSTRIES[industryKey].blurb}
                </span>
                {!isLocked && (
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-wider text-ash/70">
                    {available.length} profession{available.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── One claimed profession row with expandable field editor ──────────── */

function SpecialtyRow({ specialty }: { specialty: SpecialtyRecord }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div className="px-4 py-3">
        <SpecialtyEditor specialty={specialty} editing onToggleEdit={() => setEditing(false)} />
      </div>
    );
  }
  return <CompactSpecialtyRow specialty={specialty} onEdit={() => setEditing(true)} />;
}

/** Dense single-line summary — details expand only while editing. */
function CompactSpecialtyRow({
  specialty,
  onEdit,
}: {
  specialty: SpecialtyRecord;
  onEdit: () => void;
}) {
  const profession = getProfession(specialty.profession);
  const professionLabel = professionDisplayLabel(specialty.profession);
  const attributes = useMemo(() => parseAttributes(specialty.attributes), [specialty.attributes]);
  const highlights = profession ? attributeHighlights(profession, attributes) : [];
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

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
      toast(`${professionLabel} removed — space freed in your slot`, "success");
    } catch {
      toast("Couldn't remove the specialty", "error");
    } finally {
      setRemoving(false);
    }
  }

  const complete = highlights.length > 0 || !!specialty.headline;

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="shrink-0 text-sm font-medium text-gold">{professionLabel}</span>
        {specialty.headline && (
          <span className="truncate text-xs text-parchment">{specialty.headline}</span>
        )}
        {!complete && <span className="shrink-0 text-xs italic text-ash/70">no details yet</span>}
      </div>
      {highlights.length > 0 && (
        <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex">
          {highlights.slice(0, 3).map((highlight) => (
            <span
              key={highlight}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-line/70 bg-inset/60 px-1.5 py-0.5 text-[11px] text-parchment"
            >
              <Award className="h-3 w-3 text-aero" /> {highlight}
            </span>
          ))}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-ash transition-colors hover:text-gold"
        >
          {complete ? "Edit" : "Add details"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={removing}
          className="text-ash transition-colors hover:text-bad"
          aria-label={`Remove ${professionLabel}`}
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

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
  const professionLabel = professionDisplayLabel(specialty.profession);
  const attributes = useMemo(() => parseAttributes(specialty.attributes), [specialty.attributes]);
  const [draft, setDraft] = useState<SpecialtyAttributes>(attributes);
  const [headline, setHeadline] = useState(specialty.headline ?? "");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const highlights = profession ? attributeHighlights(profession, attributes) : [];

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
      toast(`${professionLabel} removed — space freed in your slot`, "success");
    } catch {
      toast("Couldn't remove the specialty", "error");
    } finally {
      setRemoving(false);
    }
  }

  function setField(key: string, value: boolean | string | string[]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  if (!editing) {
    return (
      <div className="group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium text-gold">{professionLabel}</p>
            {specialty.headline && (
              <p className="mt-0.5 text-sm text-parchment">{specialty.headline}</p>
            )}
            {highlights.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
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
              <p className="mt-1.5 text-xs text-ash">
                No details yet — press Edit to answer the questions people filter by.
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onToggleEdit}
              className="text-xs font-medium text-ash transition-colors hover:text-gold"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={removing}
              className="text-ash transition-colors hover:text-bad"
              aria-label={`Remove ${professionLabel}`}
            >
              {removing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-medium text-gold">{professionLabel}</p>
        <button
          type="button"
          onClick={onToggleEdit}
          className="text-xs font-medium text-ash transition-colors hover:text-gold"
        >
          Close
        </button>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`headline-${specialty.id}`}>Headline (optional)</Label>
          <Input
            id={`headline-${specialty.id}`}
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder={profession?.pitch ?? "What should people know about your work?"}
            maxLength={120}
            className="text-base"
          />
        </div>

        {!profession && (
          <p className="text-xs leading-relaxed text-ash sm:col-span-2">
            Custom profession — the structured questions only exist for the built-in professions so
            far. Your headline and skills carry this listing.
          </p>
        )}

        {(profession?.fields ?? []).map((field) => {
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
              <div key={field.key} className="space-y-1.5 sm:col-span-2">
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
          <Button type="button" size="sm" variant="ghost" onClick={onToggleEdit} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
