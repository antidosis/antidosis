import type { ComponentProps } from "react";

import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Avatar } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseSocialAvatarTarget } from "@/lib/social-avatar";

import { HandleSection } from "./handle-section";
import { PublicContactSection } from "./public-contact-section";
import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";
import { VerificationBadges } from "./verification-badges";
import { ShareProfileCard } from "../share-profile-card";

interface IdentitySectionProps {
  register: UseFormRegister<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  phoneControl: Control<ProfileFormData>;
  avatarUrl?: string;
  fullName?: string;
  nameError?: string;
  isVerified: boolean;
  mobileVerified: boolean;
  mobile: string | null;
  handle: string | null;
  memberCode: string;
  socialLinks?: { platform: string; url: string }[];
  importingFromSocial?: string | null;
  onImportFromSocial?: (url: string) => void;
  /** Profile data for the embedded connection card. */
  shareProfile: ComponentProps<typeof ShareProfileCard>["profile"];
}

export function IdentitySection({
  register,
  setValue,
  phoneControl,
  avatarUrl,
  fullName,
  nameError,
  isVerified,
  mobileVerified,
  mobile,
  handle,
  memberCode,
  socialLinks = [],
  importingFromSocial = null,
  onImportFromSocial,
  shareProfile,
}: IdentitySectionProps) {
  const linkedTargets = socialLinks.map((link) => ({
    ...link,
    target: parseSocialAvatarTarget(link.url),
  }));
  const importable = linkedTargets
    .filter(
      (link): link is typeof link & { target: NonNullable<typeof link.target> } =>
        Boolean(link.target) &&
        link.target?.host !== "facebook.com" &&
        link.target?.host !== "instagram.com"
    )
    .slice(0, 4);

  return (
    <SectionCard
      tone="identity"
      title="Identity"
      description="How you appear to other locals."
      aside={
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
            Your connection card
          </p>
          <ShareProfileCard profile={shareProfile} />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-1.5">
            <Avatar
              src={avatarUrl || null}
              name={fullName || null}
              size="lg"
              className="h-16 w-16 shrink-0"
            />
            <FileUpload
              folder="avatars"
              onUpload={(url) => setValue("avatarUrl", url, { shouldDirty: true })}
            >
              Change avatar
            </FileUpload>
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setValue("avatarUrl", null, { shouldDirty: true })}
                className="text-left text-xs text-ash underline-offset-2 transition-colors hover:text-bad hover:underline"
              >
                Remove photo
              </button>
            ) : (
              <p className="max-w-[160px] text-[11px] leading-snug text-ash">
                No photo — your initials show instead.
              </p>
            )}
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
            <HandleSection handle={handle} memberCode={memberCode} />
          </div>
        </div>

        <VerificationBadges
          isVerified={isVerified}
          mobileVerified={mobileVerified}
          mobile={mobile}
        />

        <div className="border-t border-line/40 pt-4">
          <PublicContactSection
            control={phoneControl}
            mobile={mobile}
            mobileVerified={mobileVerified}
          />
        </div>
      </div>
    </SectionCard>
  );
}
