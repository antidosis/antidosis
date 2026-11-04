"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateProfileSchema } from "@/lib/schemas";

import { AboutSection } from "./profile-editor/about-section";
import { ContactSection } from "./profile-editor/contact-section";
import { HandleSection } from "./profile-editor/handle-section";
import { IdentitySection } from "./profile-editor/identity-section";
import { PreferencesSection } from "./profile-editor/preferences-section";
import { SocialLinksSection } from "./profile-editor/social-links-section";
import type { EditorProfile, ProfileFormData } from "./profile-editor/types";

interface ProfileSectionProps {
  initialProfile: EditorProfile;
  onUpdate: (updated: unknown) => void;
}

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
    showInDirectory: profile.showInDirectory ?? undefined,
    socialLinks: (profile.socialLinks ?? []).map((l) => ({
      id: l.id,
      platform: l.platform,
      url: l.url,
      isPublic: l.isPublic,
    })),
  };
}

/**
 * Always-editable profile editor. One form, grouped into section cards, with a
 * single save action — every mutation reports pending / success / error state
 * (toasts + inline messages), nothing fails silently.
 */
export function ProfileSection({ initialProfile, onUpdate }: ProfileSectionProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  // Rows the user has marked for removal. They stay visible (disabled, with a
  // spinner) until the save either persists the removal or fails — on failure
  // they are restored. Keyed by the field-array row id, never by URL.
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

  function markRemoving(fieldId: string) {
    setRemovingIds((prev) => new Set(prev).add(fieldId));
  }

  async function onSave() {
    clearErrors();

    const values = getValues();
    const keptLinks = fields
      .filter((f) => !removingIds.has(f.id))
      .map((f) => values.socialLinks?.[fields.indexOf(f)])
      .filter((l): l is NonNullable<typeof l> => !!l && String(l.url ?? "").trim() !== "")
      .map((l) => ({
        platform: l.platform,
        url: String(l.url).trim(),
        isPublic: l.isPublic ?? true,
      }));

    const parsed = updateProfileSchema.safeParse({ ...values, socialLinks: keptLinks });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const [section, row, field] = first?.path ?? [];
      if (section === "socialLinks" && typeof row === "number" && field === "url") {
        setError(`socialLinks.${row}.url`, { message: first.message });
      } else if (first) {
        setError("root", { message: first.message });
      }
      toast("Couldn't save changes — check the highlighted fields", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        const msg =
          typeof err.error === "string"
            ? err.error
            : Array.isArray(err.error)
              ? err.error.map((e: { message?: string }) => e.message).join(", ")
              : "Save failed";
        setError("root", { message: msg });
        toast("Couldn't save changes — try again", "error");
        return;
      }

      const updated = await res.json();
      // The server recreates link rows, so adopt the fresh ids before the next edit.
      if (Array.isArray(updated.socialLinks)) {
        setValue(
          "socialLinks",
          updated.socialLinks.map(
            (l: { id: string; platform: string; url: string; isPublic: boolean }) => ({
              id: l.id,
              platform: l.platform,
              url: l.url,
              isPublic: l.isPublic,
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
    <form noValidate onSubmit={(e) => e.preventDefault()} className="mx-auto max-w-3xl space-y-5">
      <IdentitySection
        register={register}
        setValue={setValue}
        avatarUrl={avatarUrl ?? undefined}
        fullName={fullName ?? undefined}
        nameError={errors.fullName?.message}
        isVerified={initialProfile.isVerified}
        mobileVerified={initialProfile.mobileVerified}
        mobile={initialProfile.mobile}
      />

      <HandleSection handle={initialProfile.handle} />

      <AboutSection register={register} control={control} errors={errors} />

      <ContactSection register={register} errors={errors} />

      <SocialLinksSection
        control={control}
        register={register}
        fields={fields}
        removingIds={removingIds}
        onMarkRemoving={markRemoving}
        append={append}
        errors={errors}
      />

      <PreferencesSection
        register={register}
        setValue={setValue}
        showInDirectory={!!showInDirectory}
        errors={errors}
      />

      {errors.root?.message && (
        <p className="text-sm text-bad" role="alert">
          {errors.root.message}
        </p>
      )}

      <div className="sticky bottom-4 flex items-center gap-3 vessel p-3 shadow-lg">
        <Button type="button" onClick={onSave} disabled={isSaving} className="flex-1 sm:flex-none">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving…" : "Save profile"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
