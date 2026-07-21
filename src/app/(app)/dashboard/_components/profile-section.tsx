"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Pencil,
  CheckCircle2,
  Globe,
  Lock,
  Phone,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  Info,
  MapPin,
  ExternalLink,
  Award,
  Shield,
  Crown,
  FileText,
} from "lucide-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import type { z } from "zod";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileSchema } from "@/lib/schemas";

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "website", "github", "other"];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e4405f",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
  twitter: "#1da1f2",
  website: "#f5a623",
  github: "#b8a078",
  other: "#7a6b5a",
};

type FormData = z.input<typeof updateProfileSchema>;

type CredentialData = {
  id: string;
  title: string;
  isPublic: boolean;
  isVerified: boolean;
};

type SocialLink = { platform: string; url: string; isPublic: boolean };

interface ProfileSectionProps {
  initialProfile: {
    id: string;
    fullName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    locationName: string | null;
    publicPhone: string | null;
    privatePhone: string | null;
    mobile: string | null;
    abn: string | null;
    mobileVerified: boolean;
    isVerified: boolean;
    isPro: boolean;
    socialLinks: SocialLink[];
  };
  credentials: CredentialData[];
  onUpdate: (updated: unknown) => void;
}

export function ProfileSection({ initialProfile, credentials, onUpdate }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publicPanelOpen, setPublicPanelOpen] = useState(false);
  const [privatePanelOpen, setPrivatePanelOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: initialProfile.fullName || undefined,
      bio: initialProfile.bio || undefined,
      avatarUrl: initialProfile.avatarUrl || undefined,
      locationName: initialProfile.locationName || undefined,
      publicPhone: initialProfile.publicPhone || undefined,
      privatePhone: initialProfile.privatePhone || undefined,
      mobile: initialProfile.mobile || undefined,
      abn: initialProfile.abn || undefined,
      socialLinks: initialProfile.socialLinks || [],
    },
  });

  const socialLinksField = useFieldArray({ control, name: "socialLinks" });

  const avatarUrl = watch("avatarUrl");
  const fullName = watch("fullName");
  const bio = watch("bio");
  const locationName = watch("locationName");
  const mobile = watch("mobile");
  const publicPhone = watch("publicPhone");
  const privatePhone = watch("privatePhone");
  const allSocialLinks = watch("socialLinks") || [];

  const publicSocialLinks = allSocialLinks.filter((l) => l.isPublic);
  const privateSocialLinks = allSocialLinks.filter((l) => !l.isPublic);

  const hasPublicContact = !!(publicPhone || publicSocialLinks.length > 0);
  const hasPrivateContact = !!(privatePhone || privateSocialLinks.length > 0);
  const publicCreds = credentials.filter((c) => c.isPublic).length;

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        const msg =
          typeof err.error === "string"
            ? err.error
            : Array.isArray(err.error)
              ? err.error.map((e: { message?: string }) => e.message).join(", ")
              : JSON.stringify(err.error);
        setError("root", { message: "Save failed: " + msg });
      }
    } catch {
      setError("root", { message: "Network error. Please try again." });
    }
  }

  const [newPublicLinkPlatform, setNewPublicLinkPlatform] = useState("instagram");
  const [newPublicLinkUrl, setNewPublicLinkUrl] = useState("");
  const [newPrivateLinkPlatform, setNewPrivateLinkPlatform] = useState("instagram");
  const [newPrivateLinkUrl, setNewPrivateLinkUrl] = useState("");

  function addPublicLink() {
    if (newPublicLinkUrl.trim()) {
      socialLinksField.append({
        platform: newPublicLinkPlatform,
        url: newPublicLinkUrl.trim(),
        isPublic: true,
      });
      setNewPublicLinkUrl("");
    }
  }

  function removePublicLink(filteredIndex: number) {
    const originalIndex = allSocialLinks.findIndex(
      (l) =>
        l.isPublic &&
        publicSocialLinks[filteredIndex]?.url === l.url &&
        publicSocialLinks[filteredIndex]?.platform === l.platform
    );
    if (originalIndex >= 0) socialLinksField.remove(originalIndex);
  }

  function addPrivateLink() {
    if (newPrivateLinkUrl.trim()) {
      socialLinksField.append({
        platform: newPrivateLinkPlatform,
        url: newPrivateLinkUrl.trim(),
        isPublic: false,
      });
      setNewPrivateLinkUrl("");
    }
  }

  function removePrivateLink(filteredIndex: number) {
    const originalIndex = allSocialLinks.findIndex(
      (l) =>
        !l.isPublic &&
        privateSocialLinks[filteredIndex]?.url === l.url &&
        privateSocialLinks[filteredIndex]?.platform === l.platform
    );
    if (originalIndex >= 0) socialLinksField.remove(originalIndex);
  }

  const rootError = errors.root?.message;

  return (
    <section className="vessel p-5 sm:p-6">
      {saveSuccess && (
        <div className="flex items-center gap-2 text-[#00e676] text-sm mb-5">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated successfully
        </div>
      )}

      {!isEditing ? (
        <div>
          {/* ─── Header ─── */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar
                src={avatarUrl || null}
                name={fullName || null}
                size="lg"
                className="h-14 w-14 sm:h-16 sm:w-16 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="heading-display text-xl sm:text-2xl text-[#e8d5a3]">
                  {fullName || "Your Name"}
                </h2>
                {locationName && (
                  <p className="flex items-center gap-1.5 text-sm text-[#7a6b5a] mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {locationName}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {initialProfile.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#00e676]/30 text-[#00e676] bg-[#00e676]/5">
                      <Shield className="h-3 w-3" /> verified
                    </span>
                  )}
                  {initialProfile.isPro && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#f0cc33]/30 text-[#f0cc33] bg-[#f0cc33]/5">
                      <Crown className="h-3 w-3" /> pro
                    </span>
                  )}
                  {initialProfile.mobileVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#35c2f0]/30 text-[#35c2f0] bg-[#35c2f0]/5">
                      <Smartphone className="h-3 w-3" /> mobile ok
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reset({
                  fullName: initialProfile.fullName || undefined,
                  bio: initialProfile.bio || undefined,
                  avatarUrl: initialProfile.avatarUrl || undefined,
                  locationName: initialProfile.locationName || undefined,
                  publicPhone: initialProfile.publicPhone || undefined,
                  privatePhone: initialProfile.privatePhone || undefined,
                  mobile: initialProfile.mobile || undefined,
                  abn: initialProfile.abn || undefined,
                  socialLinks: initialProfile.socialLinks || [],
                });
                setIsEditing(true);
              }}
              className="shrink-0 text-[#7a6b5a] hover:text-[#e8d5a3]"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          </div>

          {/* ─── Bio ─── */}
          {bio && (
            <div className="mt-5 pt-5 border-t border-[#2a2420]/40">
              <p className="text-sm text-[#b8a078] leading-relaxed">{bio}</p>
            </div>
          )}

          {/* ─── Mobile ─── */}
          {mobile && (
            <div className="mt-5 pt-5 border-t border-[#2a2420]/40">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-[#7a6b5a]" />
                <span className="text-[#b8a078] font-mono text-xs">{mobile}</span>
                {initialProfile.mobileVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#00e676]">
                    <CheckCircle2 className="h-3 w-3" /> verified
                  </span>
                ) : (
                  <Link
                    href="/verify-mobile"
                    className="inline-flex items-center gap-1 text-xs text-[#f5a623] hover:underline underline-offset-4"
                  >
                    <ShieldAlert className="h-3 w-3" /> verify
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ─── Contact cards ─── */}
          {(hasPublicContact || hasPrivateContact) && (
            <div className="mt-5 pt-5 border-t border-[#2a2420]/40">
              <p className="text-[10px] uppercase tracking-wider text-[#7a6b5a] mb-3">Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hasPublicContact && (
                  <div className="rounded border border-[#2a2420] bg-[#12100e]/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-3.5 w-3.5 text-[#f5a623]" />
                      <span className="text-xs font-medium text-[#e8d5a3] uppercase tracking-wider">
                        Public
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {publicPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-[#7a6b5a]" />
                          <span className="text-[#b8a078]">{publicPhone}</span>
                        </div>
                      )}
                      {publicSocialLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {publicSocialLinks.map((l, i) => (
                            <a
                              key={`${l.platform}-${i}`}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-colors hover:bg-[#1a1714]"
                              style={{
                                borderColor: `${PLATFORM_COLORS[l.platform] || "#7a6b5a"}30`,
                                color: PLATFORM_COLORS[l.platform] || "#7a6b5a",
                              }}
                            >
                              {l.platform}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasPrivateContact && (
                  <div className="rounded border border-[#2a2420] bg-[#12100e]/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-3.5 w-3.5 text-[#7a6b5a]" />
                      <span className="text-xs font-medium text-[#e8d5a3] uppercase tracking-wider">
                        Private
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {privatePhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-[#7a6b5a]" />
                          <span className="text-[#b8a078]">{privatePhone}</span>
                        </div>
                      )}
                      {privateSocialLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {privateSocialLinks.map((l, i) => (
                            <a
                              key={`${l.platform}-${i}`}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-colors hover:bg-[#1a1714]"
                              style={{
                                borderColor: `${PLATFORM_COLORS[l.platform] || "#7a6b5a"}30`,
                                color: PLATFORM_COLORS[l.platform] || "#7a6b5a",
                              }}
                            >
                              {l.platform}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Credentials summary ─── */}
          {credentials.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#2a2420]/40">
              <div className="flex items-center gap-2 text-sm text-[#b8a078]">
                <Award className="h-4 w-4 text-[#f5a623]" />
                <span>
                  {credentials.length} credential{credentials.length !== 1 ? "s" : ""}
                  {publicCreds > 0 && ` (${publicCreds} public)`}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarUrl || null}
              name={fullName || null}
              size="lg"
              className="h-14 w-14"
            />
            <FileUpload
              folder="avatars"
              onUpload={(url) => setValue("avatarUrl", url, { shouldDirty: true })}
            >
              Change Avatar
            </FileUpload>
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-[#ff5252]">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Controller
              name="locationName"
              control={control}
              render={({ field }) => (
                <LocationAutocomplete
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Search suburb..."
                />
              )}
            />
            <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-3 mt-2">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-[#00e5ff] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#7a6b5a]">
                  Central Coast NSW is the trial region. Only Central Coast suburbs are available
                  during the pilot.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea {...register("bio")} placeholder="Tell us about yourself..." rows={4} />
            {errors.bio && <p className="text-xs text-[#ff5252]">{errors.bio.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-[#7a6b5a]" />
              <Input {...register("mobile")} placeholder="+61 412 345 678" />
            </div>
            {errors.mobile && <p className="text-xs text-[#ff5252]">{errors.mobile.message}</p>}
            <p className="text-xs text-[#7a6b5a]">
              Used for account security. Australian format only.
            </p>
          </div>
          <div className="space-y-2">
            <Label>ABN (optional)</Label>
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-[#7a6b5a]" />
              <Input {...register("abn")} placeholder="12 345 678 901" />
            </div>
            {errors.abn && <p className="text-xs text-[#ff5252]">{errors.abn.message}</p>}
            <p className="text-xs text-[#7a6b5a]">
              11 digits. Only needed if you earn through exchanges — it appears on ATO
              sharing-economy (SERR) reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public panel */}
            <div className="vessel">
              <button
                type="button"
                onClick={() => setPublicPanelOpen(!publicPanelOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1714] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#f5a623]" />
                  <span className="text-sm font-medium text-[#e8d5a3]">Public Profile</span>
                </div>
                {publicPanelOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#7a6b5a]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#7a6b5a]" />
                )}
              </button>
              {publicPanelOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#2a2420]">
                  <p className="text-xs text-[#7a6b5a] pt-3">
                    Shown in the pros directory. Anyone can find and contact you.
                  </p>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#7a6b5a]" />
                      <Input {...register("publicPhone")} placeholder="Public contact number" />
                    </div>
                    {errors.publicPhone && (
                      <p className="text-xs text-[#ff5252]">{errors.publicPhone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="space-y-2">
                      {publicSocialLinks.map((link, i) => (
                        <div key={`${link.platform}-${i}`} className="flex items-center gap-2">
                          <span className="text-xs text-[#f5a623] w-16 uppercase">
                            {link.platform}
                          </span>
                          <span className="text-xs text-[#b8a078] flex-1 truncate">{link.url}</span>
                          <button
                            type="button"
                            onClick={() => removePublicLink(i)}
                            className="text-[#7a6b5a] hover:text-[#ff5252]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={newPublicLinkPlatform}
                        onChange={(e) => setNewPublicLinkPlatform(e.target.value)}
                        className="bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-xs px-2 py-1.5 outline-none focus:border-[#f5a623] rounded"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="https://..."
                        value={newPublicLinkUrl}
                        onChange={(e) => setNewPublicLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addPublicLink();
                          }
                        }}
                        className="flex-1 text-xs py-1.5"
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={addPublicLink}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Private panel */}
            <div className="vessel">
              <button
                type="button"
                onClick={() => setPrivatePanelOpen(!privatePanelOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1714] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#7a6b5a]" />
                  <span className="text-sm font-medium text-[#e8d5a3]">Private Profile</span>
                </div>
                {privatePanelOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#7a6b5a]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#7a6b5a]" />
                )}
              </button>
              {privatePanelOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#2a2420]">
                  <p className="text-xs text-[#7a6b5a] pt-3">
                    Shared when messaging about needs. More detail builds trust.
                  </p>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#7a6b5a]" />
                      <Input {...register("privatePhone")} placeholder="Private contact number" />
                    </div>
                    {errors.privatePhone && (
                      <p className="text-xs text-[#ff5252]">{errors.privatePhone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="space-y-2">
                      {privateSocialLinks.map((link, i) => (
                        <div key={`${link.platform}-${i}`} className="flex items-center gap-2">
                          <span className="text-xs text-[#f5a623] w-16 uppercase">
                            {link.platform}
                          </span>
                          <span className="text-xs text-[#b8a078] flex-1 truncate">{link.url}</span>
                          <button
                            type="button"
                            onClick={() => removePrivateLink(i)}
                            className="text-[#7a6b5a] hover:text-[#ff5252]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={newPrivateLinkPlatform}
                        onChange={(e) => setNewPrivateLinkPlatform(e.target.value)}
                        className="bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-xs px-2 py-1.5 outline-none focus:border-[#f5a623] rounded"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="https://..."
                        value={newPrivateLinkUrl}
                        onChange={(e) => setNewPrivateLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addPrivateLink();
                          }
                        }}
                        className="flex-1 text-xs py-1.5"
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={addPrivateLink}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {rootError && <p className="text-sm text-[#ff5252]">{rootError}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
