import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile, useAddSkill, useRemoveSkill } from "@mobile/hooks/useApi";
import { useCamera } from "@mobile/hooks/useNative";
import { uploadFile } from "@mobile/lib/api";
import { hapticImpact } from "@mobile/lib/native";
import { ArrowLeft, Save, Plus, X, Globe, Award, Camera, ImagePlus } from "lucide-react";
import { Input, Textarea, Button, Badge, Vessel, Avatar } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   EDIT PROFILE SCREEN — Terminal Form (v2)
   $ nano ~/profile.json with skills & social links management.
   ═══════════════════════════════════════════════════════════════ */

export function EditProfileScreen() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { trigger: update, isMutating, error: mutateError } = useUpdateProfile();
  const { trigger: addSkill } = useAddSkill();
  const { trigger: removeSkill } = useRemoveSkill();

  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    locationName: "",
    publicPhone: "",
    avatarUrl: "",
    mobile: "",
    showInDirectory: false,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [linkPlatform, setLinkPlatform] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        bio: profile.bio ?? "",
        locationName: profile.locationName ?? "",
        publicPhone: profile.publicPhone ?? "",
        avatarUrl: profile.avatarUrl ?? "",
        mobile: profile.mobile ?? "",
        showInDirectory: profile.showInDirectory ?? false,
      });
    }
  }, [profile]);

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    setActionError(null);
    try {
      await update({
        fullName: form.fullName.trim() || null,
        bio: form.bio.trim() || null,
        locationName: form.locationName.trim() || null,
        publicPhone: form.publicPhone.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        mobile: form.mobile.trim() || null,
        showInDirectory: form.showInDirectory,
        socialLinks: profile?.socialLinks ?? [],
      });
      navigate("/profile");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save profile");
    }
  };

  const { takePhoto, pickPhotos } = useCamera();

  const handleAvatarUpload = async (source: "camera" | "gallery") => {
    hapticImpact("medium");
    const photo = source === "camera" ? await takePhoto() : await pickPhotos();
    if (!photo?.base64String) return;

    setAvatarUploading(true);
    try {
      const byteChars = atob(photo.base64String);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${photo.format}` });
      const result = await uploadFile(blob, "avatars");
      setForm((f) => ({ ...f, avatarUrl: result.url }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAddSkill = async () => {
    const name = skillInput.trim();
    if (!name) return;
    hapticImpact("light");
    setActionError(null);
    try {
      await addSkill({ name });
      setSkillInput("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add skill");
    }
  };

  const handleRemoveSkill = async (name: string) => {
    hapticImpact("light");
    setActionError(null);
    try {
      await removeSkill(name);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove skill");
    }
  };

  const handleAddLink = async () => {
    const platform = linkPlatform.trim();
    const url = linkUrl.trim();
    if (!platform || !url) return;
    hapticImpact("light");
    setActionError(null);
    try {
      const currentLinks = profile?.socialLinks ?? [];
      await update({
        socialLinks: [...currentLinks, { platform, url, isPublic: true }],
      });
      setLinkPlatform("");
      setLinkUrl("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add link");
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    hapticImpact("light");
    setActionError(null);
    try {
      const currentLinks = profile?.socialLinks ?? [];
      await update({
        socialLinks: currentLinks.filter((l) => l.id !== linkId),
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove link");
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
        <span className="font-mono text-xs text-[var(--leather)]">$ loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-6 pt-4 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            aria-label="Go back"
            onClick={() => {
              hapticImpact("light");
              if (window.history.length > 1) navigate(-1);
              else navigate("/profile");
            }}
            className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="font-mono text-[10px] text-[var(--leather)]">$ nano ~/profile.json</p>
            <h1 className="heading-display text-lg text-[var(--gold)]">Edit Profile</h1>
          </div>
        </div>
        <Button size="icon" onClick={handleSubmit} disabled={isMutating}>
          <Save size={18} />
        </Button>
      </div>

      {(mutateError || actionError) && (
        <div className="mx-4 mb-4 p-3 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30 max-w-3xl mx-auto">
          <p className="font-mono text-xs text-[var(--ruby)]">
            $ error: {actionError ?? mutateError?.message}
          </p>
        </div>
      )}

      <div className="px-4 space-y-4 max-w-3xl mx-auto">
        {/* Basic Info */}
        <Vessel variant="default" className="p-4">
          <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
            Basic Info
          </p>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={form.avatarUrl || profile?.avatarUrl}
              alt={form.fullName || "User"}
              size="xl"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAvatarUpload("camera")}
                disabled={avatarUploading}
                className="px-3 py-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--leather)] text-xs font-mono flex items-center gap-1.5 tap-highlight-none active:scale-95 transition-transform disabled:opacity-50"
              >
                <Camera size={14} />
                Camera
              </button>
              <button
                onClick={() => handleAvatarUpload("gallery")}
                disabled={avatarUploading}
                className="px-3 py-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--leather)] text-xs font-mono flex items-center gap-1.5 tap-highlight-none active:scale-95 transition-transform disabled:opacity-50"
              >
                <ImagePlus size={14} />
                Gallery
              </button>
            </div>
          </div>
          {avatarUploading && (
            <p className="font-mono text-[10px] text-[var(--sun)] mb-3">Uploading avatar...</p>
          )}

          <div className="space-y-3">
            <Input
              label="Full Name"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Your name"
            />
            <Textarea
              label="Bio"
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
            />
            <Input
              label="Location"
              value={form.locationName}
              onChange={(e) => handleChange("locationName", e.target.value)}
              placeholder="e.g. Woy Woy"
            />
            <Input
              label="Public Phone"
              type="tel"
              value={form.publicPhone}
              onChange={(e) => handleChange("publicPhone", e.target.value)}
              placeholder="04XX XXX XXX"
            />
            <Input
              label="Mobile"
              type="tel"
              value={form.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              placeholder="04XX XXX XXX"
            />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, showInDirectory: !f.showInDirectory }))}
              className="w-full flex items-center justify-between p-3 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)]/30 tap-highlight-none"
            >
              <div className="text-left">
                <p className="text-xs font-medium text-[var(--mercury)]">Show in Pro Directory</p>
                <p className="text-[10px] text-[var(--leather)]">
                  Appear in the public pros directory
                </p>
              </div>
              <div
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  form.showInDirectory ? "bg-[var(--sun)]" : "bg-[var(--bronze)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-[var(--void)] transition-transform ${
                    form.showInDirectory ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </div>
            </button>
          </div>
        </Vessel>

        {/* Skills */}
        <Vessel variant="default" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-[var(--sun)]" />
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider">
              Skills
            </p>
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add a skill..."
              className="flex-1"
            />
            <button
              aria-label="Add skill"
              onClick={handleAddSkill}
              disabled={isMutating}
              className="px-3 py-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--sun)] tap-highlight-none active:scale-95 transition-transform disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>

          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant={skill.isVerified ? "success" : "outline"}
                  className="text-xs flex items-center gap-1"
                >
                  {skill.name}
                  <button
                    aria-label={`Remove skill ${skill.name}`}
                    onClick={() => handleRemoveSkill(skill.name)}
                    className="ml-0.5 text-[var(--leather)] hover:text-[var(--ruby)]"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Vessel>

        {/* Social Links */}
        <Vessel variant="default" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-[var(--sun)]" />
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider">
              Social Links
            </p>
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              value={linkPlatform}
              onChange={(e) => setLinkPlatform(e.target.value)}
              placeholder="Platform"
              className="flex-1"
            />
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL"
              className="flex-[2]"
            />
            <button
              aria-label="Add social link"
              onClick={handleAddLink}
              disabled={isMutating}
              className="px-3 py-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--sun)] tap-highlight-none active:scale-95 transition-transform disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>

          {profile?.socialLinks && profile.socialLinks.length > 0 && (
            <div className="space-y-2">
              {profile.socialLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2 rounded bg-[var(--void)] border border-[var(--bronze)]/20"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--mercury)] capitalize">
                      {link.platform}
                    </p>
                    <p className="text-[10px] text-[var(--leather)] truncate">{link.url}</p>
                  </div>
                  <button
                    aria-label={`Remove ${link.platform} link`}
                    onClick={() => handleRemoveLink(link.id)}
                    className="p-1 text-[var(--leather)] hover:text-[var(--ruby)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Vessel>
      </div>
    </div>
  );
}
