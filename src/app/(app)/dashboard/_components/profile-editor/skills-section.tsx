"use client";

import { useMemo, useState } from "react";

import { Loader2, Plus, X } from "lucide-react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { searchSkills } from "@/lib/skills-taxonomy";

import { SectionCard } from "./section-card";

interface Skill {
  id: string;
  name: string;
  isVerified: boolean;
}

interface SkillsSectionProps {
  skills: Skill[];
  /** Render without the surrounding card — for embedding inside About. */
  embedded?: boolean;
}

export function SkillsSection({ skills, embedded = false }: SkillsSectionProps) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  // Skills the server hasn't confirmed yet — shown instantly so adding feels immediate.
  const [pending, setPending] = useState<string[]>([]);

  const visibleSkills = useMemo(() => {
    const confirmed = new Set(skills.map((skill) => skill.name.toLowerCase()));
    return [
      ...skills,
      ...pending
        .filter((name) => !confirmed.has(name.toLowerCase()))
        .map((name, index) => ({
          id: `pending-${index}-${name}`,
          name,
          isVerified: false,
        })),
    ];
  }, [skills, pending]);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    return searchSkills(value)
      .filter((name) => !skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase()))
      .slice(0, 7);
  }, [skills, value]);

  async function addSkill(name: string) {
    const clean = name.trim();
    if (!clean || busy) return;
    if (
      skills.some((skill) => skill.name.toLowerCase() === clean.toLowerCase()) ||
      pending.some((pendingName) => pendingName.toLowerCase() === clean.toLowerCase())
    ) {
      toast("That skill is already on your profile", "info");
      return;
    }

    setBusy(true);
    // Optimistic — the chip appears before the round trip completes.
    setPending((current) => [...current, clean]);
    try {
      const response = await fetch("/api/v1/profiles/me/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPending((current) => current.filter((item) => item !== clean));
        toast(data.error || "Couldn't add skill", "error");
        return;
      }
      setValue("");
      await mutate("/api/v1/profiles/me");
    } catch {
      setPending((current) => current.filter((item) => item !== clean));
      toast("Couldn't add skill — try again", "error");
    } finally {
      // The revalidated list now holds the confirmed skill; drop the placeholder.
      setPending((current) => current.filter((item) => item !== clean));
      setBusy(false);
    }
  }

  async function removeSkill(skill: Skill) {
    setRemoving(skill.id);
    try {
      const response = await fetch(
        `/api/v1/profiles/me/skills?name=${encodeURIComponent(skill.name)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast(data.error || "Couldn't remove skill", "error");
        return;
      }
      await mutate("/api/v1/profiles/me");
      toast(`${skill.name} removed`, "success");
    } catch {
      toast("Couldn't remove skill — try again", "error");
    } finally {
      setRemoving(null);
    }
  }

  const body = (
    <>
      <Label htmlFor="profile-skill">Skills and services</Label>
      <div className="mt-2 flex gap-2">
        <Input
          id="profile-skill"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill(value);
            }
          }}
          placeholder="Try ‘real estate’, ‘security’ or ‘content creation’"
          maxLength={80}
          autoComplete="off"
          className="text-base"
        />
        <Button
          type="button"
          onClick={() => addSkill(value)}
          disabled={busy || !value.trim()}
          className="shrink-0"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Skill suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              disabled={busy}
              className="rounded-full border border-line bg-inset px-3 py-1.5 text-sm text-parchment transition-colors hover:border-mercury/40 hover:text-mercury"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-line/50 pt-4">
        {skills.length === 0 ? (
          <p className="text-sm text-ash">
            No skills tagged yet. Add a suggestion above or type your own specialisation.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Your skills">
            {visibleSkills.map((skill) => (
              <li
                key={skill.id}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-raise px-3 py-1.5 text-sm text-parchment"
              >
                {skill.name}
                {skill.isVerified && <span className="text-ok">✓</span>}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  disabled={removing === skill.id}
                  aria-label={`Remove ${skill.name}`}
                  className="text-ash transition-colors hover:text-bad disabled:opacity-50"
                >
                  {removing === skill.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <SectionCard tone="identity" title="Skills and services">
      {body}
    </SectionCard>
  );
}
