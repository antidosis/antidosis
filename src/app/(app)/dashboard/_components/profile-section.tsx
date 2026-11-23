"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, BriefcaseBusiness, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateProfileSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import type { CredentialData } from "./credential-list";
import { CredentialsSection } from "./credentials-section";
import { AboutSection } from "./profile-editor/about-section";
import { ContactSection } from "./profile-editor/contact-section";
import { HandleSection } from "./profile-editor/handle-section";
import { IdentitySection } from "./profile-editor/identity-section";
import { PreferencesSection } from "./profile-editor/preferences-section";
import { SkillsSection } from "./profile-editor/skills-section";
import { SocialLinksSection } from "./profile-editor/social-links-section";
import type { EditorProfile, ProfileFormData } from "./profile-editor/types";
import { ShareProfileCard } from "./share-profile-card";

interface ProfileSectionProps {
  initialProfile: EditorProfile;
  credentials: CredentialData[];
  onCredentialsUpdate: (credentials: CredentialData[]) => void;
  onUpdate: (updated: unknown) => void;
}

type ProfileTab = "public" | "directory" | "private";

const PROFILE_TABS = [
  {
    id: "directory" as const,
    label: "Directory profile",
    description: "Skills, business details, qualifications and proof",
    icon: BriefcaseBusiness,
  },
  {
    id: "public" as const,
    label: "Public profile",
    description: "Your name, story, photo and public links",
    icon: UserRound,
  },
  {
    id: "private" as const,
    label: "Contact & privacy",
    description: "Private contact details and sharing controls",
    icon: LockKeyhole,
  },
];

function toFormValues(profile: EditorProfile): ProfileFormData {
  return {
    fullName: profile.fullName ?? undefined,
    bio: profile.bio ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    locationName: profile.locationName ?? undefined,
    publicPhone: profile.publicPhone ?? undefined,
    privatePhone: profile.privatePhone ?? undefined,
    mobile: profile.mobile ?? undefined,
    abn: profile.abn ?? undefined,
    accountType: profile.accountType ?? "individual",
    audienceSize: profile.audienceSize ?? undefined,
    showInDirectory: profile.showInDirectory ?? undefined,
    socialLinks: (profile.socialLinks ?? []).map((link) => ({
      id: link.id,
      platform: link.platform,
      url: link.url,
      isPublic: link.isPublic,
    })),
  };
}

export function ProfileSection({
  initialProfile,
  credentials,
  onCredentialsUpdate,
  onUpdate,
}: ProfileSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("directory");
  const [isSaving, setIsSaving] = useState(false);
  const [importingAvatarFrom, setImportingAvatarFrom] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<ReadonlySet<string>>(new Set());

  const {
    register,
    control,
    setValue,
    getValues,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: toFormValues(initialProfile),
  });

  const { fields, append } = useFieldArray({ control, name: "socialLinks" });
  const avatarUrl = watch("avatarUrl");
  const fullName = watch("fullName");
  const showInDirectory = watch("showInDirectory");
  const accountType = watch("accountType");
  const activeTabMeta = PROFILE_TABS.find((tab) => tab.id === activeTab) ?? PROFILE_TABS[0];

  function markRemoving(fieldId: string) {
    setRemovingIds((previous) => new Set(previous).add(fieldId));
  }

  async function importAvatarFromSocial(url: string) {
    setImportingAvatarFrom(url);
    try {
      const response = await fetch("/api/v1/profiles/avatar-from-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.url !== "string") {
        toast(
          typeof data.error === "string" ? data.error : "Couldn't import a profile picture",
          "error"
        );
        return;
      }
      setValue("avatarUrl", data.url, { shouldDirty: true });
      toast("Profile picture imported — press Save to keep it", "success");
    } catch {
      toast("Couldn't import a profile picture — try again", "error");
    } finally {
      setImportingAvatarFrom(null);
    }
  }

  async function onSave() {
    clearErrors();
    const values = getValues();
    const keptLinks = fields
      .filter((field) => !removingIds.has(field.id))
      .map((field) => values.socialLinks?.[fields.indexOf(field)])
      .filter(
        (link): link is NonNullable<typeof link> => !!link && String(link.url ?? "").trim() !== ""
      )
      .map((link) => ({
        platform: link.platform,
        url: String(link.url).trim(),
        isPublic: link.isPublic ?? true,
      }));

    const parsed = updateProfileSchema.safeParse({ ...values, socialLinks: keptLinks });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const [section, row, field] = first?.path ?? [];
      if (section === "socialLinks" && typeof row === "number" && field === "url") {
        setError(`socialLinks.${row}.url`, { message: first.message });
        setActiveTab("public");
      } else if (first) {
        setError("root", { message: first.message });
      }
      toast("Couldn't save changes — check the highlighted fields", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        const message =
          typeof error.error === "string"
            ? error.error
            : Array.isArray(error.error)
              ? error.error.map((item: { message?: string }) => item.message).join(", ")
              : "Save failed";
        setError("root", { message });
        toast("Couldn't save changes — try again", "error");
        return;
      }

      const updated = await response.json();
      if (Array.isArray(updated.socialLinks)) {
        setValue(
          "socialLinks",
          updated.socialLinks.map(
            (link: { id: string; platform: string; url: string; isPublic: boolean }) => ({
              id: link.id,
              platform: link.platform,
              url: link.url,
              isPublic: link.isPublic,
            })
          ),
          { shouldDirty: false }
        );
      }
      setRemovingIds(new Set());
      await mutate("/api/v1/profiles/me");
      onUpdate(updated);
      toast("Profile saved", "success");
    } catch {
      setError("root", { message: "Network error. Please try again." });
      toast("Couldn't save changes — try again", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function onCancel() {
    setRemovingIds(new Set());
    reset(toFormValues(initialProfile));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gold">{activeTabMeta.label}</h2>
          <p className="mt-1 text-sm text-ash">{activeTabMeta.description}</p>
        </div>
        <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
          <Link href={`/profile/${initialProfile.handle || initialProfile.id}`} target="_blank">
            View public profile <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="Profile sections"
        className="mb-6 grid gap-2 rounded-lg border border-line bg-surface/35 p-2 sm:grid-cols-3"
      >
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
              activeTab === tab.id
                ? "border border-sun/25 bg-sun/[0.08] text-gold"
                : "border border-transparent text-ash hover:bg-surface hover:text-parchment"
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {activeTab === "public" && (
          <div role="tabpanel" className="space-y-5">
            <IdentitySection
              register={register}
              setValue={setValue}
              avatarUrl={avatarUrl ?? undefined}
              fullName={fullName ?? undefined}
              nameError={errors.fullName?.message}
              isVerified={initialProfile.isVerified}
              mobileVerified={initialProfile.mobileVerified}
              mobile={initialProfile.mobile}
              socialLinks={(initialProfile.socialLinks ?? []).map((link) => ({
                platform: link.platform,
                url: link.url,
              }))}
              importingFromSocial={importingAvatarFrom}
              onImportFromSocial={importAvatarFromSocial}
            />
            <HandleSection handle={initialProfile.handle} />
            <ShareProfileCard profile={initialProfile} />
            <AboutSection register={register} control={control} errors={errors} />
            <SocialLinksSection
              control={control}
              register={register}
              fields={fields}
              removingIds={removingIds}
              onMarkRemoving={markRemoving}
              append={append}
              errors={errors}
            />
          </div>
        )}

        {activeTab === "directory" && (
          <div role="tabpanel" className="space-y-5">
            <PreferencesSection
              register={register}
              setValue={setValue}
              showInDirectory={!!showInDirectory}
              accountType={accountType === "business" ? "business" : "individual"}
              abnVerified={initialProfile.abnVerified}
              errors={errors}
            />
            <SkillsSection skills={initialProfile.skills} />
            <div id="credentials-section">
              <CredentialsSection initialCredentials={credentials} onUpdate={onCredentialsUpdate} />
            </div>
          </div>
        )}

        {activeTab === "private" && (
          <div role="tabpanel" className="space-y-5">
            <ContactSection register={register} errors={errors} />
            <section className="rounded-lg border border-ok/20 bg-ok/[0.035] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
                <div>
                  <h3 className="text-sm font-medium text-gold">Private means private</h3>
                  <p className="mt-2 text-sm leading-relaxed text-parchment">
                    Private phone numbers, identity documents and full document numbers are never
                    included in public profile responses. Public credential cards show only the
                    details you choose, with references masked.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ash">
                    To share a qualification without sharing the file, use its redacted summary
                    action in Directory profile → Proof &amp; ID, then paste it into your chosen
                    conversation. Nothing is sent automatically when you express interest.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {errors.root?.message && (
        <p className="mt-5 text-sm text-bad" role="alert">
          {errors.root.message}
        </p>
      )}

      <div className="vessel sticky bottom-4 z-20 mt-5 flex items-center gap-3 rounded-lg bg-surface/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" onClick={onSave} disabled={isSaving} className="flex-1 sm:flex-none">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Saving…" : "Save profile"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <p className="ml-auto hidden text-xs text-ash md:block">
          Skills and proof save separately.
        </p>
      </div>
    </div>
  );
}
