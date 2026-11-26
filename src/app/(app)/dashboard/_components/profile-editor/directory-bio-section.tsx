"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ProfileFormData } from "./types";

const DIRECTORY_BIO_MAX = 800;

/**
 * The directory listing's own description — what a prospective customer reads
 * on the public directory. Strictly separate from the personal-profile bio;
 * neither bleeds into the other.
 */
export function DirectoryBioSection({
  register,
  control,
  error,
}: {
  register: UseFormRegister<ProfileFormData>;
  control: Control<ProfileFormData>;
  error?: string;
}) {
  const length = useWatch({ control, name: "directoryBio" })?.length ?? 0;
  return (
    <section className="vessel rounded-xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-aero">
        About this listing
      </p>
      <h3 className="heading-display mt-1 text-lg text-gold">
        What should customers know about the business?
      </h3>
      <div className="mt-4 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="profile-directoryBio">Listing description</Label>
          <span
            className={`font-mono text-[10px] ${
              length > DIRECTORY_BIO_MAX ? "text-bad" : "text-ash"
            }`}
            aria-live="polite"
          >
            {length}/{DIRECTORY_BIO_MAX}
          </span>
        </div>
        <Textarea
          id="profile-directoryBio"
          {...register("directoryBio")}
          rows={4}
          maxLength={DIRECTORY_BIO_MAX}
          placeholder="e.g. Local web studio building fast sites and apps for Central Coast businesses. Fixed quotes, plain English, ongoing support."
          className="text-base"
        />
        <p className="text-xs leading-relaxed text-ash">
          Shown on your directory listing only. Your personal bio stays on your personal profile —
          the two never mix.
        </p>
        {error && <p className="text-xs text-bad">{error}</p>}
      </div>
    </section>
  );
}
