import { Globe, Lock, Phone, Smartphone } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

interface ContactSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

const INPUT_CLASS = "text-base";

export function ContactSection({ register, errors }: ContactSectionProps) {
  return (
    <SectionCard
      title="Contact"
      description="Control exactly who sees each number — nothing is public unless you make it."
    >
      <div className="space-y-2">
        <Label htmlFor="profile-mobile">Mobile</Label>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
          <Input
            id="profile-mobile"
            {...register("mobile")}
            placeholder="+61 412 345 678"
            type="tel"
            autoComplete="tel"
            className={`pl-9 ${INPUT_CLASS}`}
          />
        </div>
        {errors.mobile && <p className="text-xs text-bad">{errors.mobile.message}</p>}
        <p className="text-xs text-ash">Used for account security and verification. Never shown.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              className={`pl-9 ${INPUT_CLASS}`}
            />
          </div>
          {errors.publicPhone && <p className="text-xs text-bad">{errors.publicPhone.message}</p>}
          <p className="text-xs text-ash">Shown on your public profile and in the directory.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-privatePhone">
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
              <Lock className="h-3.5 w-3.5 text-ash" /> Private phone
            </span>
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <Input
              id="profile-privatePhone"
              {...register("privatePhone")}
              placeholder="04XX XXX XXX"
              type="tel"
              className={`pl-9 ${INPUT_CLASS}`}
            />
          </div>
          {errors.privatePhone && <p className="text-xs text-bad">{errors.privatePhone.message}</p>}
          <p className="text-xs text-ash">Shared only when you message someone about a need.</p>
        </div>
      </div>
    </SectionCard>
  );
}
