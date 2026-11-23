import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Avatar } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseSocialAvatarTarget } from "@/lib/social-avatar";

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
  socialLinks?: { platform: string; url: string }[];
  importingFromSocial?: string | null;
  onImportFromSocial?: (url: string) => void;
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
  socialLinks = [],
  importingFromSocial = null,
  onImportFromSocial,
}: IdentitySectionProps) {
  const importable = socialLinks
    .map((link) => ({ ...link, target: parseSocialAvatarTarget(link.url) }))
    .filter((link): link is typeof link & { target: NonNullable<typeof link.target> } =>
      Boolean(link.target)
    )
    .slice(0, 4);

  return (
    <SectionCard title="Identity" description="How you appear to other locals.">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-2">
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
          {importable.length > 0 && onImportFromSocial && (
            <div className="max-w-[160px]">
              <p className="mb-1 text-[11px] text-ash">or import from</p>
              <div className="flex flex-wrap gap-1">
                {importable.map((link) => (
                  <button
                    key={link.url}
                    type="button"
                    onClick={() => onImportFromSocial(link.url)}
                    disabled={importingFromSocial !== null}
                    className="rounded border border-line px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-ash transition-colors hover:border-mercury/40 hover:text-mercury disabled:opacity-50"
                  >
                    {importingFromSocial === link.url
                      ? "…"
                      : link.platform || link.target.host.replace(".com", "")}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-ash">
                Uses the public profile picture on that link.
              </p>
            </div>
          )}
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
