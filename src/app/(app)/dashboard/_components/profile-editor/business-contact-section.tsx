import { Building2, Mail, Phone, Store } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

interface BusinessContactSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

const INPUT_CLASS = "text-base";

export function BusinessContactSection({ register, errors }: BusinessContactSectionProps) {
  return (
    <SectionCard
      tone="directory"
      title="Business contact"
      description="How customers reach the business — shown on your directory listing only, separate from your personal public profile."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2 sm:max-w-md">
          <Label htmlFor="profile-businessName">
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
              <Store className="h-3.5 w-3.5 text-aero" /> Business name
            </span>
          </Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <Input
              id="profile-businessName"
              {...register("businessName")}
              placeholder="e.g. Khoury Plumbing Co"
              maxLength={100}
              autoComplete="organization"
              className={`pl-9 ${INPUT_CLASS}`}
            />
          </div>
          <p className="text-xs text-ash">
            Your trading name — the directory shows this instead of your personal name.
          </p>
          {errors.businessName && <p className="text-xs text-bad">{errors.businessName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-businessPhone">
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
              <Phone className="h-3.5 w-3.5 text-aero" /> Business phone
            </span>
          </Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <Input
              id="profile-businessPhone"
              {...register("businessPhone")}
              placeholder="02 XXXX XXXX"
              type="tel"
              autoComplete="tel"
              className={`pl-9 ${INPUT_CLASS}`}
            />
          </div>
          {errors.businessPhone && (
            <p className="text-xs text-bad">{errors.businessPhone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-businessEmail">
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
              <Mail className="h-3.5 w-3.5 text-aero" /> Business email
            </span>
          </Label>
          <Input
            id="profile-businessEmail"
            {...register("businessEmail")}
            placeholder="bookings@yourbusiness.com.au"
            type="email"
            autoComplete="email"
            className={INPUT_CLASS}
          />
          {errors.businessEmail && (
            <p className="text-xs text-bad">{errors.businessEmail.message}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
