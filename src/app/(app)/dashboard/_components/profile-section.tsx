"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, BriefcaseBusiness, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { parseBusinessSocialLinks } from "@/lib/business-links";
import { updateProfileSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import type { CredentialData } from "./credential-list";
import { CredentialsSection } from "./credentials-section";
import { DirectorySlotsSection } from "./directory-slots-section";
import { AboutSection } from "./profile-editor/about-section";
import { AcceptedExchangesSection } from "./profile-editor/accepted-exchanges-section";
import { BusinessDetailsSection } from "./profile-editor/business-details-section";
import { DirectoryBioSection } from "./profile-editor/directory-bio-section";
import { IdentitySection } from "./profile-editor/identity-section";
import { KnowledgeBox } from "./profile-editor/knowledge-box";
import { SocialLinksSection } from "./profile-editor/social-links-section";
import type { EditorProfile, ProfileFormData, ProfileTab } from "./profile-editor/types";
import { RevealAnalytics } from "./reveal-analytics";
import { ShareBusinessCard } from "./share-business-card";

interface ProfileSectionProps {
  initialProfile: EditorProfile;
  credentials: CredentialData[];
  onCredentialsUpdate: (credentials: CredentialData[]) => void;
  onUpdate: (updated: unknown) => void;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const PROFILE_TABS = [
  {
    id: "public" as const,
    label: "Public profile",
    description: "Your name, story, photo, handle, socials and how people reach you",
    icon: UserRound,
    activeClass: "border-sun/30 bg-sun/[0.08] text-sun",
  },
  {
    id: "directory" as const,
    label: "Directory profile",
    description:
      "Your advertisement in the public directory — listing, specialties and business contact",
    icon: BriefcaseBusiness,
    activeClass: "border-aero/30 bg-aero/[0.08] text-aero",
  },
  {
    id: "trust" as const,
    label: "Trust & ID",
    description: "Private documents, verification and shareable credential summaries",
    icon: ShieldCheck,
    activeClass: "border-ok/30 bg-ok/[0.08] text-ok",
  },
];

function toFormValues(profile: EditorProfile): ProfileFormData {
  return {
    fullName: profile.fullName ?? undefined,
    bio: profile.bio ?? undefined,
    directoryBio: profile.directoryBio ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    locationName: profile.locationName ?? undefined,
    publicPhone: profile.publicPhone ?? undefined,
    businessPhone: profile.businessPhone ?? undefined,
    businessEmail: profile.businessEmail ?? undefined,
    businessName: profile.businessName ?? undefined,
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
    businessSocialLinks: businessLinksFrom(profile.businessSocialLinks).map((link) => ({
      platform: link.platform,
      url: link.url,
      isPublic: true,
    })),
    acceptedExchanges: profile.acceptedExchanges ?? [],
  };
}

/** Normalise the raw business-links value (array from the API, or the stored
 *  JSON string from any row-shaped response) into a plain link list. */
function businessLinksFrom(
  raw: EditorProfile["businessSocialLinks"]
): { platform: string; url: string }[] {
  if (Array.isArray(raw)) {
    return raw.map((link) => ({ platform: link.platform, url: link.url }));
  }
  return parseBusinessSocialLinks(typeof raw === "string" ? raw : undefined);
}

export function ProfileSection({
  initialProfile,
  credentials,
  onCredentialsUpdate,
  onUpdate,
  activeTab,
  onTabChange,
}: ProfileSectionProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasSpecialty, setHasSpecialty] = useState(initialProfile.accountType === "business");
  const [importingAvatarFrom, setImportingAvatarFrom] = useState<string | null>(null);

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

  const {
    fields,
    append,
    remove: removeSocialLink,
  } = useFieldArray({ control, name: "socialLinks" });
  const {
    fields: businessFields,
    append: appendBusinessLink,
    remove: removeBusinessLink,
  } = useFieldArray({
    control,
    name: "businessSocialLinks",
  });
  const avatarUrl = watch("avatarUrl");
  const fullName = watch("fullName");
  const showInDirectory = watch("showInDirectory");
  const accountType = watch("accountType");
  const activeTabMeta = PROFILE_TABS.find((tab) => tab.id === activeTab) ?? PROFILE_TABS[0];

  useEffect(() => {
    const subscription = watch((_values, { type }) => {
      if (type === "change") setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  function setChangedValue(...args: Parameters<typeof setValue>) {
    setHasUnsavedChanges(true);
    clearErrors("root");
    setValue(...args);
  }

  function addSocialLink(...args: Parameters<typeof append>) {
    setHasUnsavedChanges(true);
    clearErrors("root");
    append(...args);
  }

  function addBusinessLink(...args: Parameters<typeof appendBusinessLink>) {
    setHasUnsavedChanges(true);
    clearErrors("root");
    appendBusinessLink(...args);
  }

  function switchTab(tab: ProfileTab) {
    // A stale save error from one tab shouldn't follow the member to another.
    clearErrors("root");
    onTabChange(tab);
  }

  // Directory listings are business listings: claiming slot 1 upgrades the
  // form's account type, and releasing every slot downgrades it again — the
  // server applies the same rule on save (accountType is directory-driven).
  const handleSlotChange = useCallback(
    (hasSlot: boolean) => {
      setHasSpecialty(hasSlot);
      clearErrors("root");
      setValue("accountType", hasSlot ? "business" : "individual", { shouldDirty: false });
    },
    [clearErrors, setValue]
  );

  function removeLinkAt(remove: (index: number) => void, index: number) {
    // useFieldArray drops the row from the form immediately, so the link is
    // gone from sight and won't be sent on the next save — no pending state.
    setHasUnsavedChanges(true);
    clearErrors("root");
    remove(index);
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
      setChangedValue("avatarUrl", data.url, { shouldDirty: true });
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

    // Directory listings require an ABN — stop early with the member on the
    // directory tab rather than letting the server reject the whole save.
    const effectiveAbn = values.abn || initialProfile.abn || null;
    if (hasSpecialty && !effectiveAbn) {
      const message = "Directory listings require an ABN — add yours below to stay live.";
      setError("root", { message });
      onTabChange("directory");
      toast(message, "error");
      return;
    }
    const keptLinks = (values.socialLinks ?? [])
      .filter((link) => String(link?.url ?? "").trim() !== "")
      .map((link) => ({
        platform: link.platform,
        url: String(link.url).trim(),
        isPublic: link.isPublic ?? true,
      }));
    const keptBusinessLinks = (values.businessSocialLinks ?? [])
      .filter((link) => String(link?.url ?? "").trim() !== "")
      .map((link) => ({
        platform: link.platform,
        url: String(link.url).trim(),
        isPublic: true,
      }));

    const parsed = updateProfileSchema.safeParse({
      ...values,
      socialLinks: keptLinks,
      businessSocialLinks: keptBusinessLinks,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const [section, row, field] = first?.path ?? [];
      if (section === "socialLinks" && typeof row === "number" && field === "url") {
        setError(`socialLinks.${row}.url`, { message: first.message });
        onTabChange("public");
      } else if (section === "businessSocialLinks" && typeof row === "number" && field === "url") {
        setError(`businessSocialLinks.${row}.url`, { message: first.message });
        onTabChange("directory");
      } else if (first) {
        setError("root", { message: first.message });
      }
      toast(first?.message ?? "Couldn't save changes — check the highlighted fields", "error");
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
        // Business-rule rejections (e.g. missing ABN) belong to the directory
        // tab where the field lives — surface them there, not on whatever tab
        // the member happened to be on.
        if (message.toLowerCase().includes("abn")) onTabChange("directory");
        toast(message, "error");
        return;
      }

      const updated = await response.json();
      reset(toFormValues(updated as EditorProfile));
      setHasUnsavedChanges(false);
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
    reset(toFormValues(initialProfile));
    setHasUnsavedChanges(false);
  }

  return (
    <div className="mx-auto max-w-6xl">
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
        className="mb-5 grid grid-cols-1 gap-2 rounded-lg border border-line bg-surface/35 p-2 sm:grid-cols-3"
      >
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md border px-2 py-2.5 text-center text-xs leading-tight transition-colors sm:px-3 sm:text-sm",
              activeTab === tab.id
                ? tab.activeClass
                : "border-transparent text-ash hover:bg-surface hover:text-parchment"
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {activeTab === "public" && (
          <div role="tabpanel" className="space-y-4">
            <KnowledgeBox>
              This is <strong className="text-gold">you, publicly</strong> — what anyone sees when
              they open your profile. Your email and ID documents never appear here, and your mobile
              number only shows if you switch it on in the Identity panel.
            </KnowledgeBox>
            <IdentitySection
              register={register}
              setValue={setChangedValue}
              phoneControl={control}
              avatarUrl={avatarUrl ?? undefined}
              fullName={fullName ?? undefined}
              nameError={errors.fullName?.message}
              isVerified={initialProfile.isVerified}
              mobileVerified={initialProfile.mobileVerified}
              mobile={initialProfile.mobile}
              handle={initialProfile.handle}
              memberCode={initialProfile.memberCode}
              socialLinks={(initialProfile.socialLinks ?? []).map((link) => ({
                platform: link.platform,
                url: link.url,
              }))}
              importingFromSocial={importingAvatarFrom}
              onImportFromSocial={importAvatarFromSocial}
              shareProfile={initialProfile}
            />
            <AboutSection
              register={register}
              control={control}
              errors={errors}
              skills={initialProfile.skills}
            />
            <SocialLinksSection
              control={control}
              register={register}
              field="socialLinks"
              fields={fields}
              onRemove={(index) => removeLinkAt(removeSocialLink, index)}
              append={addSocialLink}
              errors={errors}
              showAudience={accountType !== "business"}
            />
            <RevealAnalytics scope="personal" />
          </div>
        )}

        {activeTab === "directory" && (
          <div role="tabpanel" className="space-y-5">
            <KnowledgeBox>
              This is <strong className="text-gold">your listing in the public directory</strong> —
              a separate, professional space from your personal profile. Claim a specialty to be
              discovered and filtered by; listings are business listings, so an ABN is required.
              Your personal phone and personal socials stay out of it. While you work in this tab
              the sidebar shows <strong className="text-gold">business node</strong> — step back
              into any other tab and you&apos;re the{" "}
              <strong className="text-gold">member node</strong> again.
            </KnowledgeBox>
            <DirectorySlotsSection
              onSlotChange={handleSlotChange}
              identity={{ register, errors, abnVerified: initialProfile.abnVerified }}
            />
            <AcceptedExchangesSection
              control={control}
              setValue={setValue}
              onChanged={() => {
                setHasUnsavedChanges(true);
                clearErrors("root");
              }}
            />
            <DirectoryBioSection
              register={register}
              control={control}
              error={errors.directoryBio?.message}
            />
            <BusinessDetailsSection
              register={register}
              setValue={setChangedValue}
              showInDirectory={!!showInDirectory}
              hasSpecialty={hasSpecialty}
              errors={errors}
              profileId={initialProfile.id}
            />
            {(accountType === "business" || hasSpecialty) && (
              <SocialLinksSection
                control={control}
                register={register}
                field="businessSocialLinks"
                fields={businessFields}
                onRemove={(index) => removeLinkAt(removeBusinessLink, index)}
                append={addBusinessLink}
                errors={errors}
                showAudience={false}
                variant="business"
              />
            )}
            {(accountType === "business" || hasSpecialty) && (
              <ShareBusinessCard profile={initialProfile} />
            )}
            {(accountType === "business" || hasSpecialty) && <RevealAnalytics scope="listing" />}
          </div>
        )}

        {activeTab === "trust" && (
          <div role="tabpanel" className="space-y-4">
            <KnowledgeBox>
              This is <strong className="text-gold">your private vault</strong> — documents here
              back your verified badge and are reviewed by our team, but they are never published on
              your public profile or directory listing. To prove a qualification in a conversation,
              use a credential&apos;s <em>Copy redacted summary</em> action and paste it into the
              message — the file itself stays here.
            </KnowledgeBox>
            <div id="credentials-section">
              <CredentialsSection initialCredentials={credentials} onUpdate={onCredentialsUpdate} />
            </div>
          </div>
        )}
      </div>

      {errors.root?.message && (
        <p className="mt-5 text-sm text-bad" role="alert">
          {errors.root.message}
        </p>
      )}

      {(hasUnsavedChanges || isSaving) && (
        <div className="vessel sticky bottom-4 z-20 mt-5 flex items-center gap-3 rounded-lg bg-surface/95 p-3 shadow-lg backdrop-blur">
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
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
      )}
    </div>
  );
}
