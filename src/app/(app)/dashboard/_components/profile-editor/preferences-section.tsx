import { Building2, FileText, ShieldCheck } from "lucide-react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

interface PreferencesSectionProps {
  register: UseFormRegister<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  showInDirectory: boolean;
  accountType: "individual" | "business";
  abnVerified: boolean;
  errors: FieldErrors<ProfileFormData>;
}

export function PreferencesSection({
  register,
  setValue,
  showInDirectory,
  accountType,
  abnVerified,
  errors,
}: PreferencesSectionProps) {
  return (
    <SectionCard
      tone="directory"
      title="Directory presence"
      description="Choose whether locals and businesses can discover you, then add the details they need to evaluate your work."
    >
      <button
        type="button"
        aria-pressed={showInDirectory}
        onClick={() => setValue("showInDirectory", !showInDirectory, { shouldDirty: true })}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between gap-4 rounded border p-3 text-left transition-colors",
          showInDirectory ? "border-sun/40 bg-sun/5" : "border-line bg-inset/50 hover:border-linehi"
        )}
      >
        <span>
          <span className="block text-sm text-parchment">Show in the public directory</span>
          <span className="mt-0.5 block text-xs text-ash">
            Anyone on the platform can find and contact you.
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
            showInDirectory ? "border-sun bg-sun/20" : "border-line bg-raise"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
              showInDirectory ? "left-6 bg-sun" : "left-1 bg-ash"
            )}
          />
        </span>
      </button>

      <button
        type="button"
        aria-pressed={accountType === "business"}
        onClick={() =>
          setValue("accountType", accountType === "business" ? "individual" : "business", {
            shouldDirty: true,
          })
        }
        className={cn(
          "mt-3 flex min-h-[44px] w-full items-center justify-between gap-4 rounded border p-3 text-left transition-colors",
          accountType === "business"
            ? "border-sun/40 bg-sun/5"
            : "border-line bg-inset/50 hover:border-linehi"
        )}
      >
        <span>
          <span className="flex items-center gap-1.5 text-sm text-parchment">
            <Building2 className="h-4 w-4 text-sun" /> This is a business account
          </span>
          <span className="mt-0.5 block text-xs text-ash">
            Show your ABN and a business badge in the directory. Free — no subscription.
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
            accountType === "business" ? "border-sun bg-sun/20" : "border-line bg-raise"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
              accountType === "business" ? "left-6 bg-sun" : "left-1 bg-ash"
            )}
          />
        </span>
      </button>

      <div className="mt-5 space-y-2">
        <Label htmlFor="profile-abn">ABN (optional)</Label>
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
        {accountType === "business" && (
          <p className="text-xs text-sun">Required for business accounts — must be a valid ABN.</p>
        )}
        {abnVerified && (
          <p className="text-xs text-ok inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> ABN confirmed against the Australian Business
            Register.
          </p>
        )}
        <p className="text-xs text-ash">
          11 digits. Needed if you earn through exchanges — it appears on ATO sharing-economy (SERR)
          reports and on business contracts.
        </p>
      </div>
    </SectionCard>
  );
}
