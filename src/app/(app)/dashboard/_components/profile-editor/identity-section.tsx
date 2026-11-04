import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Avatar } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";
import { VerificationBadges } from "./verification-badges";

interface IdentitySectionProps {
  register: UseFormRegister<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  avatarUrl?: string;
  fullName?: string;
  nameError?: string;
  isVerified: boolean;
  mobileVerified: boolean;
  mobile: string | null;
}

export function IdentitySection({
  register,
  setValue,
  avatarUrl,
  fullName,
  nameError,
  isVerified,
  mobileVerified,
  mobile,
}: IdentitySectionProps) {
  return (
    <SectionCard title="Identity" description="How you appear to other locals.">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl || null}
            name={fullName || null}
            size="lg"
            className="h-20 w-20 shrink-0"
          />
          <FileUpload
            folder="avatars"
            onUpload={(url) => setValue("avatarUrl", url, { shouldDirty: true })}
          >
            Change avatar
          </FileUpload>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="profile-fullName">Full name</Label>
          <Input
            id="profile-fullName"
            {...register("fullName")}
            placeholder="Your name"
            autoComplete="name"
            className="text-base"
          />
          {nameError && <p className="text-xs text-bad">{nameError}</p>}
        </div>
      </div>
      <div className="mt-5 border-t border-line/40 pt-4">
        <VerificationBadges
          isVerified={isVerified}
          mobileVerified={mobileVerified}
          mobile={mobile}
        />
      </div>
    </SectionCard>
  );
}
