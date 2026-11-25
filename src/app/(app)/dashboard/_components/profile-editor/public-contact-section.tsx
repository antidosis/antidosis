import { Globe, Phone } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

interface PublicContactSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

const INPUT_CLASS = "text-base";

export function PublicContactSection({ register, errors }: PublicContactSectionProps) {
  return (
    <SectionCard
      tone="identity"
      title="Public contact"
      description="Optional. Shown on your public profile and in the directory — like a Gumtree listing. Leave blank to keep contact to in-app messages."
    >
      <div className="space-y-2">
        <Label htmlFor="profile-publicPhone">
          <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
            <Globe className="h-3.5 w-3.5 text-sun" /> Public phone
          </span>
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
          <Input
            id="profile-publicPhone"
            {...register("publicPhone")}
            placeholder="04XX XXX XXX"
            type="tel"
            autoComplete="tel"
            className={`pl-9 ${INPUT_CLASS}`}
          />
        </div>
        {errors.publicPhone && <p className="text-xs text-bad">{errors.publicPhone.message}</p>}
      </div>
    </SectionCard>
  );
}
