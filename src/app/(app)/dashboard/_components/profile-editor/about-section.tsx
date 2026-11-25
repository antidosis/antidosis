import { Info } from "lucide-react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Textarea } from "@/components/ui/textarea";

import { SectionCard } from "./section-card";
import { SkillsSection } from "./skills-section";
import type { ProfileFormData } from "./types";

interface AboutSectionProps {
  register: UseFormRegister<ProfileFormData>;
  control: Control<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  skills: { id: string; name: string; isVerified: boolean }[];
}

export function AboutSection({ register, control, errors, skills }: AboutSectionProps) {
  return (
    <SectionCard
      tone="identity"
      title="About"
      description="Your story, where you're based, what you can help with, and how people reach you."
    >
      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          {...register("bio")}
          placeholder="Tell people what you're good at and what you're looking for…"
          rows={4}
          className="text-base"
        />
        {errors.bio && <p className="text-xs text-bad">{errors.bio.message}</p>}
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="profile-location">Location</Label>
        <Controller
          name="locationName"
          control={control}
          render={({ field }) => (
            <LocationAutocomplete
              id="profile-location"
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="Search suburb…"
            />
          )}
        />
        <div className="mt-2 border border-mercury/30 bg-mercury/10 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mercury" />
            <p className="text-xs text-ash">
              Central Coast NSW is the trial region. Only Central Coast suburbs are available during
              the pilot.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-line/40 pt-5">
        <SkillsSection skills={skills} embedded />
      </div>
    </SectionCard>
  );
}
