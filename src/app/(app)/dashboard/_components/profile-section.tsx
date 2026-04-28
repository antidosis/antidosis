"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Pencil, CheckCircle2, Globe, Lock, Phone, ChevronDown, ChevronUp, Plus, X, Smartphone, ShieldAlert, ArrowRight, Info } from "lucide-react";

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "website", "github", "other"];

type CredentialData = { id: string; title: string; isPublic: boolean };
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
    mobileVerified: boolean;
    socialLinks: SocialLink[];
  };
  credentials: CredentialData[];
  onUpdate: (updated: any) => void;
}

export function ProfileSection({ initialProfile, credentials, onUpdate }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publicPanelOpen, setPublicPanelOpen] = useState(false);
  const [privatePanelOpen, setPrivatePanelOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: initialProfile.fullName || "",
    bio: initialProfile.bio || "",
    locationName: initialProfile.locationName || "",
    avatarUrl: initialProfile.avatarUrl || "",
    publicPhone: initialProfile.publicPhone || "",
    privatePhone: initialProfile.privatePhone || "",
    mobile: initialProfile.mobile || "",
    publicSocialLinks: initialProfile.socialLinks.filter((l) => l.isPublic),
    privateSocialLinks: initialProfile.socialLinks.filter((l) => !l.isPublic),
  });

  const [newPublicLinkPlatform, setNewPublicLinkPlatform] = useState("instagram");
  const [newPublicLinkUrl, setNewPublicLinkUrl] = useState("");
  const [newPrivateLinkPlatform, setNewPrivateLinkPlatform] = useState("instagram");
  const [newPrivateLinkUrl, setNewPrivateLinkUrl] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editForm.fullName,
          bio: editForm.bio,
          locationName: editForm.locationName,
          avatarUrl: editForm.avatarUrl,
          publicPhone: editForm.publicPhone,
          privatePhone: editForm.privatePhone,
          mobile: editForm.mobile,
          socialLinks: [
            ...editForm.publicSocialLinks.map((l) => ({ ...l, isPublic: true })),
            ...editForm.privateSocialLinks.map((l) => ({ ...l, isPublic: false })),
          ],
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        alert("save failed: " + (err.error || JSON.stringify(err)));
      }
    } catch (err) {
      alert("network error. please try again.");
    }
    setSaving(false);
  }

  function addPublicLink() {
    if (newPublicLinkUrl.trim()) {
      setEditForm({
        ...editForm,
        publicSocialLinks: [...editForm.publicSocialLinks, { platform: newPublicLinkPlatform, url: newPublicLinkUrl.trim(), isPublic: true }],
      });
      setNewPublicLinkUrl("");
    }
  }

  function removePublicLink(i: number) {
    setEditForm({ ...editForm, publicSocialLinks: editForm.publicSocialLinks.filter((_, idx) => idx !== i) });
  }

  function addPrivateLink() {
    if (newPrivateLinkUrl.trim()) {
      setEditForm({
        ...editForm,
        privateSocialLinks: [...editForm.privateSocialLinks, { platform: newPrivateLinkPlatform, url: newPrivateLinkUrl.trim(), isPublic: false }],
      });
      setNewPrivateLinkUrl("");
    }
  }

  function removePrivateLink(i: number) {
    setEditForm({ ...editForm, privateSocialLinks: editForm.privateSocialLinks.filter((_, idx) => idx !== i) });
  }

  return (
    <section className="vessel p-5">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#7a6b5a]">$ nano ~/.profile</p>
        {!isEditing && (
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Profile
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 text-[#00e676] text-sm mb-6">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated successfully
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-6 max-w-lg">
          <div className="flex items-center gap-4">
            <Avatar src={editForm.avatarUrl} name={editForm.fullName} size="lg" className="h-14 w-14" />
            <div>
              <p className="text-base font-medium text-[#e8d5a3]">{editForm.fullName || "no name set"}</p>
              {editForm.locationName && <p className="text-xs text-[#7a6b5a] mt-0.5">{editForm.locationName}</p>}
            </div>
          </div>
          {editForm.bio ? (
            <p className="text-sm text-[#b8a078] leading-relaxed">{editForm.bio}</p>
          ) : (
            <p className="text-sm text-[#7a6b5a] italic">no bio yet.</p>
          )}

          {editForm.mobile && (
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-[#7a6b5a]" />
              <span className="text-[#b8a078]">{editForm.mobile}</span>
              {initialProfile.mobileVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-[#00e676]">
                  <CheckCircle2 className="h-3 w-3" /> verified
                </span>
              ) : (
                <Link
                  href="/verify-mobile"
                  className="inline-flex items-center gap-1 text-xs text-[#f5a623] hover:underline underline-offset-4"
                >
                  <ShieldAlert className="h-3 w-3" /> unverified — verify now
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          <div className="vessel-lit p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-[#f5a623]" />
              <span className="text-sm font-medium text-[#e8d5a3]">Public Profile</span>
            </div>
            <div className="text-xs text-[#b8a078] space-y-1">
              {editForm.publicPhone ? (
                <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{editForm.publicPhone}</p>
              ) : (
                <p className="text-[#7a6b5a]">no public phone</p>
              )}
              {editForm.publicSocialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editForm.publicSocialLinks.map((l) => (
                    <span key={l.url} className="text-xs text-[#f5a623] uppercase">{l.platform}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[#7a6b5a]">no public social links</p>
              )}
              {credentials.filter((c) => c.isPublic).length > 0 && (
                <p className="mt-2">{credentials.filter((c) => c.isPublic).length} public credential(s)</p>
              )}
            </div>
          </div>

          <div className="vessel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-[#7a6b5a]" />
              <span className="text-sm font-medium text-[#e8d5a3]">Private Profile</span>
            </div>
            <div className="text-xs text-[#b8a078] space-y-1">
              {editForm.privatePhone ? (
                <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{editForm.privatePhone}</p>
              ) : (
                <p className="text-[#7a6b5a]">no private phone</p>
              )}
              {editForm.privateSocialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editForm.privateSocialLinks.map((l) => (
                    <span key={l.url} className="text-xs text-[#f5a623] uppercase">{l.platform}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[#7a6b5a]">no private social links</p>
              )}
              {credentials.filter((c) => !c.isPublic).length > 0 && (
                <p className="mt-2">{credentials.filter((c) => !c.isPublic).length} private credential(s)</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={saveProfile} className="space-y-6 max-w-lg">
          <div className="flex items-center gap-4">
            <Avatar src={editForm.avatarUrl} name={editForm.fullName} size="lg" className="h-14 w-14" />
            <FileUpload folder="avatars" onUpload={(url) => setEditForm({ ...editForm, avatarUrl: url })}>Change Avatar</FileUpload>
          </div>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <LocationAutocomplete value={editForm.locationName} onChange={(formatted) => setEditForm({ ...editForm, locationName: formatted })} placeholder="Search suburb..." />
            <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-3 mt-2">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-[#00e5ff] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#7a6b5a]">Central Coast NSW is the trial region. Only Central Coast suburbs are available during the pilot.</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell us about yourself..." rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-[#7a6b5a]" />
              <Input
                value={editForm.mobile}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                placeholder="+61 412 345 678"
              />
            </div>
            <p className="text-xs text-[#7a6b5a]">Used for account security. Australian format only.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="vessel">
              <button type="button" onClick={() => setPublicPanelOpen(!publicPanelOpen)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1714] transition-colors">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#f5a623]" />
                  <span className="text-sm font-medium text-[#e8d5a3]">Public Profile</span>
                </div>
                {publicPanelOpen ? <ChevronUp className="h-4 w-4 text-[#7a6b5a]" /> : <ChevronDown className="h-4 w-4 text-[#7a6b5a]" />}
              </button>
              {publicPanelOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#2a2420]">
                  <p className="text-xs text-[#7a6b5a] pt-3">Shown in the pros directory. Anyone can find and contact you.</p>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#7a6b5a]" />
                      <Input value={editForm.publicPhone} onChange={(e) => setEditForm({ ...editForm, publicPhone: e.target.value })} placeholder="Public contact number" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="space-y-2">
                      {editForm.publicSocialLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-[#f5a623] w-16 uppercase">{link.platform}</span>
                          <span className="text-xs text-[#b8a078] flex-1 truncate">{link.url}</span>
                          <button type="button" onClick={() => removePublicLink(i)} className="text-[#7a6b5a] hover:text-[#ff5252]"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select value={newPublicLinkPlatform} onChange={(e) => setNewPublicLinkPlatform(e.target.value)} className="bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-xs px-2 py-1.5 outline-none focus:border-[#f5a623] rounded">
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <Input placeholder="https://..." value={newPublicLinkUrl} onChange={(e) => setNewPublicLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPublicLink(); } }} className="flex-1 text-xs py-1.5" />
                      <Button type="button" variant="secondary" size="sm" onClick={addPublicLink}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="vessel">
              <button type="button" onClick={() => setPrivatePanelOpen(!privatePanelOpen)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1714] transition-colors">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#7a6b5a]" />
                  <span className="text-sm font-medium text-[#e8d5a3]">Private Profile</span>
                </div>
                {privatePanelOpen ? <ChevronUp className="h-4 w-4 text-[#7a6b5a]" /> : <ChevronDown className="h-4 w-4 text-[#7a6b5a]" />}
              </button>
              {privatePanelOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#2a2420]">
                  <p className="text-xs text-[#7a6b5a] pt-3">Shared when messaging about needs. More detail builds trust.</p>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#7a6b5a]" />
                      <Input value={editForm.privatePhone} onChange={(e) => setEditForm({ ...editForm, privatePhone: e.target.value })} placeholder="Private contact number" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="space-y-2">
                      {editForm.privateSocialLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-[#f5a623] w-16 uppercase">{link.platform}</span>
                          <span className="text-xs text-[#b8a078] flex-1 truncate">{link.url}</span>
                          <button type="button" onClick={() => removePrivateLink(i)} className="text-[#7a6b5a] hover:text-[#ff5252]"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select value={newPrivateLinkPlatform} onChange={(e) => setNewPrivateLinkPlatform(e.target.value)} className="bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-xs px-2 py-1.5 outline-none focus:border-[#f5a623] rounded">
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <Input placeholder="https://..." value={newPrivateLinkUrl} onChange={(e) => setNewPrivateLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPrivateLink(); } }} className="flex-1 text-xs py-1.5" />
                      <Button type="button" variant="secondary" size="sm" onClick={addPrivateLink}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </section>
  );
}
