import Link from "next/link";

import { ArrowUpRight, EyeOff, FileText, Radio, ShieldCheck } from "lucide-react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

interface PreferencesSectionProps {
  register: UseFormRegister<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  showInDirectory: boolean;
  /** True once a specialty slot is claimed — the ABN field only appears then. */
  hasSpecialty: boolean;
  abnVerified: boolean;
  errors: FieldErrors<ProfileFormData>;
  /** Public profile handle, used for the "view live listing" deep link. */
  handle: string | null;
}

export function PreferencesSection({
  register,
  setValue,
  showInDirectory,
  hasSpecialty,
  abnVerified,
  errors,
  handle,
}: PreferencesSectionProps) {
  return (
    <SectionCard
      tone="directory"
      title="Directory presence"
      description="Control whether your listing is live, and add the details people check before they hire."
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
              {handle && (
                <Link
                  href={`/profile/@${handle}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sun underline-offset-2 hover:underline"
                >
                  View live listing <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
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

      {/* ABN appears once a specialty is claimed — directory listings are
          business listings */}
      {hasSpecialty && (
        <div className="mt-5 space-y-2">
          <Label htmlFor="profile-abn">
            ABN <span className="text-bad">*</span>
          </Label>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <Input
              id="profile-abn"
              {...register("abn")}
              placeholder="12 345 678 901"
              inputMode="numeric"
              className="pl-9 text-base"
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
      )}
    </SectionCard>
  );
}
