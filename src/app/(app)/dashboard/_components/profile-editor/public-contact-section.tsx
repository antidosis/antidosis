import Link from "next/link";

import { PhoneCall, ShieldCheck } from "lucide-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";

import { cn } from "@/lib/utils";

import type { ProfileFormData } from "./types";

interface PublicContactSectionProps {
  control: Control<ProfileFormData>;
  mobile: string | null;
  mobileVerified: boolean;
}

/**
 * The only phone number that may appear on a public profile is the account's
 * own verified mobile — members opt it in or out with a single toggle, and the
 * server rejects anything else (route.ts). Unverified members see a prompt to
 * verify first.
 */
export function PublicContactSection({
  control,
  mobile,
  mobileVerified,
}: PublicContactSectionProps) {
  return (
    <div>
      <p className="text-sm font-medium text-parchment">Public phone</p>
      {mobileVerified && mobile ? (
        <Controller
          control={control}
          name="publicPhone"
          render={({ field }) => {
            const shown = Boolean(field.value);
            return (
              <button
                type="button"
                aria-pressed={shown}
                onClick={() => field.onChange(shown ? null : mobile)}
                className={cn(
                  "mt-2 flex min-h-[44px] w-full items-center justify-between gap-4 rounded border p-3 text-left transition-colors",
                  shown ? "border-ok/40 bg-ok/5" : "border-line bg-inset/50 hover:border-linehi"
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PhoneCall className="h-4 w-4 shrink-0 text-sun" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-parchment">
                      {shown ? mobile : `Verified mobile · ${mobile}`}
                    </span>
                    <span className="mt-0.5 block text-xs text-ash">
                      {shown
                        ? "Shown on your public profile"
                        : "Hidden — people message you in-app"}
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                    shown ? "border-ok bg-ok/20" : "border-line bg-raise"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
                      shown ? "left-6 bg-ok" : "left-1 bg-ash"
                    )}
                  />
                </span>
              </button>
            );
          }}
        />
      ) : (
        <div className="mt-2 flex items-start gap-2 rounded border border-line/70 bg-inset/40 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mercury" />
          <p className="text-xs leading-relaxed text-ash">
            Verify your mobile in{" "}
            <Link
              href="/dashboard?tab=settings"
              className="text-sun underline-offset-2 hover:underline"
            >
              Settings &amp; Security
            </Link>{" "}
            to display a phone number here. Only verified numbers can ever appear on a public
            profile.
          </p>
        </div>
      )}
    </div>
  );
}
