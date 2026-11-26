"use client";

import type { UseFormRegister } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ProfileFormData } from "./types";

/**
 * The directory listing's own description — what a prospective customer reads
 * on the public directory. Strictly separate from the personal-profile bio;
 * neither bleeds into the other.
 */
export function DirectoryBioSection({
  register,
  error,
}: {
  register: UseFormRegister<ProfileFormData>;
  error?: string;
}) {
  return (
    <section className="vessel rounded-xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-aero">
        About this listing
      </p>
      <h3 className="heading-display mt-1 text-lg text-gold">
        What should customers know about the business?
      </h3>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="profile-directoryBio">Listing description</Label>
        <Textarea
          id="profile-directoryBio"
          {...register("directoryBio")}
          rows={4}
          maxLength={800}
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
