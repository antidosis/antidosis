import { FileText } from "lucide-react";
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
  errors: FieldErrors<ProfileFormData>;
}

export function PreferencesSection({
  register,
  setValue,
  showInDirectory,
  errors,
}: PreferencesSectionProps) {
  return (
    <SectionCard title="Directory & preferences">
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
          <span className="block text-sm text-parchment">Show in the pros directory</span>
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
        <p className="text-xs text-ash">
          11 digits. Only needed if you earn through exchanges — it appears on ATO sharing-economy
          (SERR) reports.
        </p>
      </div>
    </SectionCard>
  );
}
