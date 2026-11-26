import Link from "next/link";

import {
  ArrowUpRight,
  Building2,
  EyeOff,
  FileText,
  Mail,
  Phone,
  Radio,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

const INPUT_CLASS = "text-base";

interface BusinessDetailsSectionProps {
  register: UseFormRegister<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  showInDirectory: boolean;
  /** True once a specialty slot is claimed — ABN and contact fields appear then. */
  hasSpecialty: boolean;
  abnVerified: boolean;
  errors: FieldErrors<ProfileFormData>;
  /** Own profile id, used for the "view live listing" deep link. */
  profileId: string;
}

export function BusinessDetailsSection({
  register,
  setValue,
  showInDirectory,
  hasSpecialty,
  abnVerified,
  errors,
  profileId,
}: BusinessDetailsSectionProps) {
  return (
    <SectionCard
      tone="directory"
      title="Business details"
      description="Live status, ABN and how customers reach the business — shown on your directory listing only, never on your personal profile."
    >
      {/* Live / hidden status — flips its whole face with the toggle */}
      {showInDirectory ? (
        <div className="rounded border border-ok/40 bg-ok/[0.05] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-ok" />
              </span>
              <div>
                <p className="text-sm font-medium text-parchment">Live in the directory</p>
                <p className="mt-0.5 text-xs text-ash">
                  Anyone on the platform can find and contact you.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/pros/${profileId}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-medium text-sun underline-offset-2 hover:underline"
              >
                View live listing <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setValue("showInDirectory", false, { shouldDirty: true })}
                className="text-xs text-ash underline-offset-2 transition-colors hover:text-gold hover:underline"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded border border-sun/30 bg-sun/[0.05] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <EyeOff className="h-4 w-4 text-sun" />
              <div>
                <p className="text-sm font-medium text-parchment">Hidden from the directory</p>
                <p className="mt-0.5 text-xs text-ash">
                  Your directory profile is not visible to the public right now.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setValue("showInDirectory", true, { shouldDirty: true })}
              className="inline-flex items-center gap-1.5 rounded border border-ok/40 bg-ok/10 px-3 py-1.5 text-xs font-medium text-ok transition-colors hover:bg-ok/20"
            >
              <Radio className="h-3.5 w-3.5" /> Go live
            </button>
          </div>
        </div>
      )}

      {hasSpecialty && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            {errors.businessName && (
              <p className="text-xs text-bad">{errors.businessName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-abn">
              <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                <FileText className="h-3.5 w-3.5 text-aero" /> ABN{" "}
                <span className="text-bad">*</span>
              </span>
            </Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
              <Input
                id="profile-abn"
                {...register("abn")}
                placeholder="12 345 678 901"
                inputMode="numeric"
                className={`pl-9 ${INPUT_CLASS}`}
              />
            </div>
            {errors.abn && <p className="text-xs text-bad">{errors.abn.message}</p>}
            {abnVerified && (
              <p className="text-xs text-ok inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> ABN confirmed against the Australian Business
                Register.
              </p>
            )}
            <p className="text-xs text-ash">
              11 digits, required for directory listings — it appears on ATO sharing-economy (SERR)
              reports and on business contracts.
            </p>
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
      )}
    </SectionCard>
  );
}
