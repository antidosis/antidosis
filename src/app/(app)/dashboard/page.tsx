"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Briefcase, FileText, HandHelping, User, Loader2, ArrowRight, Star, Shield, Plus, X, Link2, Award, Eye, EyeOff, Trash2, FileCheck, Phone, ChevronDown, ChevronUp, Globe, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

type CredentialData = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
};

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  privatePhone: string | null;
  isVerified: boolean;
  isPro: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string; isPublic: boolean }[];
  credentials: CredentialData[];
};

const tabs = [
  { id: "overview", label: "overview", icon: User },
  { id: "needs", label: "my_needs", icon: Briefcase },
  { id: "contracts", label: "contracts", icon: FileText },
  { id: "offers", label: "my_offers", icon: HandHelping },
  { id: "credentials", label: "proof & credentials", icon: Award },
];

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "website", "github", "other"];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [needs, setNeeds] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credFormOpen, setCredFormOpen] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [editingCred, setEditingCred] = useState<string | null>(null);
  const [credForm, setCredForm] = useState({
    type: "qualification",
    title: "",
    description: "",
    documentNumber: "",
    issuedBy: "",
    issuedAt: "",
    expiresAt: "",
    fileUrl: "",
    isPublic: false,
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    locationName: "",
    locationDisplay: "",
    avatarUrl: "",
    publicPhone: "",
    privatePhone: "",
    publicSocialLinks: [] as { platform: string; url: string; isPublic: boolean }[],
    privateSocialLinks: [] as { platform: string; url: string; isPublic: boolean }[],
  });
  const [publicPanelOpen, setPublicPanelOpen] = useState(false);
  const [privatePanelOpen, setPrivatePanelOpen] = useState(false);
  const [newPublicLinkPlatform, setNewPublicLinkPlatform] = useState("instagram");
  const [newPublicLinkUrl, setNewPublicLinkUrl] = useState("");
  const [newPrivateLinkPlatform, setNewPrivateLinkPlatform] = useState("instagram");
  const [newPrivateLinkUrl, setNewPrivateLinkUrl] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      loadData();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [profileRes, needsRes, contractsRes, offersRes] = await Promise.all([
        fetch("/api/v1/profiles/me"),
        fetch("/api/v1/needs/mine"),
        fetch("/api/v1/contracts/mine"),
        fetch("/api/v1/acceptances/mine"),
      ]);
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
        setEditForm({
          fullName: p.fullName || "",
          bio: p.bio || "",
          locationName: p.locationName || "",
          locationDisplay: p.locationName || "",
          avatarUrl: p.avatarUrl || "",
          publicPhone: p.publicPhone || "",
          privatePhone: p.privatePhone || "",
          publicSocialLinks: (p.socialLinks || []).filter((l: any) => l.isPublic),
          privateSocialLinks: (p.socialLinks || []).filter((l: any) => !l.isPublic),
        });
      }
      if (needsRes.ok) setNeeds(await needsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
      if (profileRes.ok) {
        const p = await profileRes.json();
        setCredentials(p.credentials || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
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
        socialLinks: [
          ...editForm.publicSocialLinks.map((l) => ({ ...l, isPublic: true })),
          ...editForm.privateSocialLinks.map((l) => ({ ...l, isPublic: false })),
        ],
      }),
    });
    if (res.ok) { const updated = await res.json(); setProfile(updated); }
    setSaving(false);
  }

  function addPublicSocialLink() {
    if (newPublicLinkUrl.trim()) {
      setEditForm({
        ...editForm,
        publicSocialLinks: [...editForm.publicSocialLinks, { platform: newPublicLinkPlatform, url: newPublicLinkUrl.trim(), isPublic: true }],
      });
      setNewPublicLinkUrl("");
    }
  }

  function removePublicSocialLink(index: number) {
    setEditForm({
      ...editForm,
      publicSocialLinks: editForm.publicSocialLinks.filter((_, i) => i !== index),
    });
  }

  function addPrivateSocialLink() {
    if (newPrivateLinkUrl.trim()) {
      setEditForm({
        ...editForm,
        privateSocialLinks: [...editForm.privateSocialLinks, { platform: newPrivateLinkPlatform, url: newPrivateLinkUrl.trim(), isPublic: false }],
      });
      setNewPrivateLinkUrl("");
    }
  }

  function removePrivateSocialLink(index: number) {
    setEditForm({
      ...editForm,
      privateSocialLinks: editForm.privateSocialLinks.filter((_, i) => i !== index),
    });
  }

  async function moveCredentialTo(credId: string, isPublic: boolean) {
    const res = await fetch(`/api/v1/credentials/${credId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
    if (res.ok) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === credId ? { ...c, isPublic } : c))
      );
    }
  }

  if (loading) return <div className="py-24 text-center text-[#7a6b4a]"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />loading...</div>;
  if (!profile) return <div className="py-24 text-center text-[#c97c7c]">error: failed to load profile</div>;

  async function saveCredential(e: React.FormEvent) {
    e.preventDefault();
    setCredSaving(true);
    const payload = {
      type: credForm.type,
      title: credForm.title,
      description: credForm.description || undefined,
      documentNumber: credForm.documentNumber || undefined,
      issuedBy: credForm.issuedBy || undefined,
      issuedAt: credForm.issuedAt || undefined,
      expiresAt: credForm.expiresAt || undefined,
      fileUrl: credForm.fileUrl || undefined,
      isPublic: credForm.isPublic,
    };
    const res = await fetch(editingCred ? `/api/v1/credentials/${editingCred}` : "/api/v1/credentials", {
      method: editingCred ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setCredFormOpen(false);
      setEditingCred(null);
      setCredForm({
        type: "qualification",
        title: "",
        description: "",
        documentNumber: "",
        issuedBy: "",
        issuedAt: "",
        expiresAt: "",
        fileUrl: "",
        isPublic: false,
      });
      // Refresh credentials
      const credsRes = await fetch("/api/v1/credentials");
      if (credsRes.ok) {
        const data = await credsRes.json();
        setCredentials(data.credentials || []);
      }
    }
    setCredSaving(false);
  }

  async function deleteCredential(id: string) {
    if (!confirm("delete this credential? this cannot be undone.")) return;
    const res = await fetch(`/api/v1/credentials/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    }
  }

  async function toggleCredentialVisibility(id: string, current: boolean) {
    const res = await fetch(`/api/v1/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !current }),
    });
    if (res.ok) {
      setCredentials((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPublic: !current } : c))
      );
    }
  }

  function startEditCredential(cred: CredentialData) {
    setEditingCred(cred.id);
    setCredForm({
      type: cred.type,
      title: cred.title,
      description: cred.description || "",
      documentNumber: cred.documentNumber || "",
      issuedBy: cred.issuedBy || "",
      issuedAt: cred.issuedAt ? cred.issuedAt.split("T")[0] : "",
      expiresAt: cred.expiresAt ? cred.expiresAt.split("T")[0] : "",
      fileUrl: cred.fileUrl || "",
      isPublic: cred.isPublic,
    });
    setCredFormOpen(true);
  }

  function closeCredForm() {
    setCredFormOpen(false);
    setEditingCred(null);
    setCredForm({
      type: "qualification",
      title: "",
      description: "",
      documentNumber: "",
      issuedBy: "",
      issuedAt: "",
      expiresAt: "",
      fileUrl: "",
      isPublic: false,
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <p className="text-[12px] text-[#7a6b4a] mb-6">$ whoami</p>

      <div className="flex items-center gap-4 py-8">
        <Avatar src={profile.avatarUrl} name={profile.fullName} size="lg" className="h-14 w-14" />
        <div>
          <h1 className="text-xl font-bold">{profile.fullName || "user"}</h1>
          <div className="flex items-center gap-3 text-[12px] text-[#7a6b4a] mt-1">
            {profile.isPro && <Badge variant="default">pro</Badge>}
            {profile.isVerified && <Badge variant="success">verified</Badge>}
            {profile.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" />{profile.ratingAvg.toFixed(1)}</span>}
            <span>{profile.jobsCompleted} jobs</span>
          </div>
        </div>
      </div>

      <div className="divider mb-8" />

      <div className="flex gap-6 mb-12 text-[13px]">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-2 pb-2 border-b transition-colors",
              activeTab === tab.id ? "text-[#f5b800] border-[#f5b800]" : "text-[#7a6b4a] border-transparent hover:text-[#e8c97c]")}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-16">
          <section>
            <p className="text-[12px] text-[#7a6b4a] mb-6">$ nano ~/.profile</p>
            <form onSubmit={saveProfile} className="space-y-8 max-w-lg">
              <div className="flex items-center gap-4">
                <Avatar src={editForm.avatarUrl} name={editForm.fullName} size="lg" className="h-14 w-14" />
                <FileUpload folder="avatars" onUpload={(url) => setEditForm({ ...editForm, avatarUrl: url })}>change_avatar</FileUpload>
              </div>
              <div className="space-y-2">
                <Label>full_name</Label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>location</Label>
                <LocationAutocomplete
                  value={editForm.locationName}
                  onChange={(formatted) => setEditForm({ ...editForm, locationName: formatted })}
                  placeholder="search_suburb..."
                />
                <p className="text-[11px] text-[#7a6b4a]/50">central coast trial: all suburbs autocomplete</p>
              </div>
              <div className="space-y-2">
                <Label>bio</Label>
                <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="tell_us_about_yourself..." rows={4} />
              </div>

              {/* Public / Private Profile Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Public Profile Panel */}
                <div className="border border-[#2a2a2a]">
                  <button
                    type="button"
                    onClick={() => setPublicPanelOpen(!publicPanelOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#111111] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#c9b87c]" />
                      <span className="text-[13px] font-medium">public profile</span>
                    </div>
                    {publicPanelOpen ? <ChevronUp className="h-4 w-4 text-[#7a6b4a]" /> : <ChevronDown className="h-4 w-4 text-[#7a6b4a]" />}
                  </button>
                  {publicPanelOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-[#2a2a2a]">
                      <p className="text-[11px] text-[#7a6b4a]/60 pt-3">
                        shown in the pros directory. anyone can find and contact you.
                      </p>

                      <div className="space-y-2">
                        <Label className="text-[12px]">phone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-[#7a6b4a]" />
                          <Input
                            value={editForm.publicPhone}
                            onChange={(e) => setEditForm({ ...editForm, publicPhone: e.target.value })}
                            placeholder="public contact number"
                            className="text-[13px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px]">social links</Label>
                        <div className="space-y-2">
                          {editForm.publicSocialLinks.map((link, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[11px] text-[#f5b800] w-16 uppercase">{link.platform}</span>
                              <span className="text-[12px] text-[#7a6b4a] flex-1 truncate">{link.url}</span>
                              <button type="button" onClick={() => removePublicSocialLink(i)} className="text-[#7a6b4a] hover:text-[#c97c7c]"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={newPublicLinkPlatform}
                            onChange={(e) => setNewPublicLinkPlatform(e.target.value)}
                            className="bg-[#0c0c0c] border border-[#2a2a2a] text-[#e8c97c] text-[12px] px-2 py-1.5 outline-none focus:border-[#f5b800]"
                          >
                            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <Input
                            placeholder="https://..."
                            value={newPublicLinkUrl}
                            onChange={(e) => setNewPublicLinkUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPublicSocialLink(); } }}
                            className="flex-1 text-[12px] py-1.5"
                          />
                          <Button type="button" variant="secondary" size="sm" onClick={addPublicSocialLink}><Plus className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px]">credentials</Label>
                        {credentials.filter((c) => c.isPublic).length === 0 ? (
                          <p className="text-[11px] text-[#7a6b4a]/40">no public credentials. add some in the credentials tab.</p>
                        ) : (
                          <div className="space-y-2">
                            {credentials.filter((c) => c.isPublic).map((cred) => (
                              <div key={cred.id} className="flex items-center justify-between text-[12px]">
                                <span className="text-[#7a6b4a]">{cred.title}</span>
                                <button
                                  type="button"
                                  onClick={() => moveCredentialTo(cred.id, false)}
                                  className="text-[#7a6b4a]/50 hover:text-[#e8c97c] text-[10px] flex items-center gap-1"
                                >
                                  <Lock className="h-3 w-3" /> move to private
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Private Profile Panel */}
                <div className="border border-[#2a2a2a]">
                  <button
                    type="button"
                    onClick={() => setPrivatePanelOpen(!privatePanelOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#111111] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#7a6b4a]" />
                      <span className="text-[13px] font-medium">private profile</span>
                    </div>
                    {privatePanelOpen ? <ChevronUp className="h-4 w-4 text-[#7a6b4a]" /> : <ChevronDown className="h-4 w-4 text-[#7a6b4a]" />}
                  </button>
                  {privatePanelOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-[#2a2a2a]">
                      <p className="text-[11px] text-[#7a6b4a]/60 pt-3">
                        shared when messaging about needs. more detail builds trust.
                      </p>

                      <div className="space-y-2">
                        <Label className="text-[12px]">phone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-[#7a6b4a]" />
                          <Input
                            value={editForm.privatePhone}
                            onChange={(e) => setEditForm({ ...editForm, privatePhone: e.target.value })}
                            placeholder="private contact number"
                            className="text-[13px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px]">social links</Label>
                        <div className="space-y-2">
                          {editForm.privateSocialLinks.map((link, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[11px] text-[#f5b800] w-16 uppercase">{link.platform}</span>
                              <span className="text-[12px] text-[#7a6b4a] flex-1 truncate">{link.url}</span>
                              <button type="button" onClick={() => removePrivateSocialLink(i)} className="text-[#7a6b4a] hover:text-[#c97c7c]"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={newPrivateLinkPlatform}
                            onChange={(e) => setNewPrivateLinkPlatform(e.target.value)}
                            className="bg-[#0c0c0c] border border-[#2a2a2a] text-[#e8c97c] text-[12px] px-2 py-1.5 outline-none focus:border-[#f5b800]"
                          >
                            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <Input
                            placeholder="https://..."
                            value={newPrivateLinkUrl}
                            onChange={(e) => setNewPrivateLinkUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPrivateSocialLink(); } }}
                            className="flex-1 text-[12px] py-1.5"
                          />
                          <Button type="button" variant="secondary" size="sm" onClick={addPrivateSocialLink}><Plus className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px]">credentials</Label>
                        {credentials.filter((c) => !c.isPublic).length === 0 ? (
                          <p className="text-[11px] text-[#7a6b4a]/40">no private credentials. add some in the credentials tab.</p>
                        ) : (
                          <div className="space-y-2">
                            {credentials.filter((c) => !c.isPublic).map((cred) => (
                              <div key={cred.id} className="flex items-center justify-between text-[12px]">
                                <span className="text-[#7a6b4a]">{cred.title}</span>
                                <button
                                  type="button"
                                  onClick={() => moveCredentialTo(cred.id, true)}
                                  className="text-[#7a6b4a]/50 hover:text-[#e8c97c] text-[10px] flex items-center gap-1"
                                >
                                  <Globe className="h-3 w-3" /> move to public
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={saving}>{saving ? "saving..." : "$ save_profile"}</Button>
            </form>
          </section>

          {profile.skills.length > 0 && (
            <section>
              <div className="divider mb-8" />
              <p className="text-[12px] text-[#7a6b4a] mb-6">$ cat ~/.skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill.id} className="px-2 py-1 text-[11px] border border-[#2a2a2a] text-[#7a6b4a]">
                    {skill.name}{skill.isVerified && <Shield className="ml-1 h-3 w-3 text-[#7cb87c] inline" />}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "needs" && (
        <div>
          <p className="text-[12px] text-[#7a6b4a] mb-6">$ ls ~/needs/</p>
          {needs.length === 0 ? (
            <EmptyState title="no needs posted" description="post your first need to start exchanging." action={{ label: "$ post_need", href: "/needs/new" }} />
          ) : (
            needs.map((need, i) => (
              <div key={need.id}>
                <div className="py-5 flex items-center justify-between group">
                  <div>
                    <Link href={`/needs/${need.id}`} className="text-[14px] font-medium hover:text-[#f5b800] transition-colors">{need.title}</Link>
                    <div className="flex items-center gap-3 text-[11px] text-[#7a6b4a] mt-1">
                      <StatusBadge status={need.status} />
                      <span>{need._count?.acceptances || 0} offers</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" asChild><Link href={`/needs/${need.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                </div>
                {i < needs.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "contracts" && (
        <div>
          <p className="text-[12px] text-[#7a6b4a] mb-6">$ ls ~/contracts/</p>
          {contracts.length === 0 ? (
            <EmptyState title="no contracts yet" description="accept an offer on one of your needs to form a contract." />
          ) : (
            contracts.map((contract, i) => (
              <div key={contract.id}>
                <div className="py-5 flex items-center justify-between group">
                  <div>
                    <p className="text-[14px] font-medium">{contract.need?.title || "contract"}</p>
                    <div className="text-[11px] text-[#7a6b4a] mt-1"><StatusBadge status={contract.status} /></div>
                  </div>
                  <Button size="sm" variant="ghost" asChild><Link href={`/contracts/${contract.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                </div>
                {i < contracts.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "offers" && (
        <div>
          <p className="text-[12px] text-[#7a6b4a] mb-6">$ ls ~/offers/</p>
          {offers.length === 0 ? (
            <EmptyState title="no offers made" description="browse needs and offer your skills." action={{ label: "$ browse_needs", href: "/needs" }} />
          ) : (
            offers.map((offer, i) => (
              <div key={offer.id}>
                <div className="py-5 flex items-center justify-between group">
                  <div>
                    <Link href={`/needs/${offer.need?.id}`} className="text-[14px] font-medium hover:text-[#f5b800] transition-colors">{offer.need?.title}</Link>
                    <div className="text-[11px] text-[#7a6b4a] mt-1"><StatusBadge status={offer.status} /></div>
                    {offer.message && <p className="text-[13px] text-[#7a6b4a] mt-2">&ldquo;{offer.message}&rdquo;</p>}
                  </div>
                  <Button size="sm" variant="ghost" asChild><Link href={`/needs/${offer.need?.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                </div>
                {i < offers.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "credentials" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[12px] text-[#7a6b4a]">$ ls ~/credentials/</p>
            <Button size="sm" variant="secondary" onClick={() => setCredFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> add credential
            </Button>
          </div>

          {credFormOpen && (
            <div className="border border-[#2a2a2a] p-6 mb-8">
              <p className="text-[12px] text-[#f5b800] mb-4">{editingCred ? "$ edit credential" : "$ add credential"}</p>
              <form onSubmit={saveCredential} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>type</Label>
                  <select
                    value={credForm.type}
                    onChange={(e) => setCredForm({ ...credForm, type: e.target.value })}
                    className="w-full bg-[#0c0c0c] border border-[#2a2a2a] text-[#e8c97c] text-[13px] px-3 py-2 outline-none focus:border-[#f5b800]"
                  >
                    <option value="qualification">qualification</option>
                    <option value="license">license</option>
                    <option value="certification">certification</option>
                    <option value="ticket">ticket</option>
                    <option value="resume">resume</option>
                    <option value="identification">identification</option>
                    <option value="insurance">insurance</option>
                    <option value="business_registration">business registration</option>
                    <option value="other">other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>title</Label>
                  <Input value={credForm.title} onChange={(e) => setCredForm({ ...credForm, title: e.target.value })} placeholder="e.g. White Card, First Aid Certificate" required />
                </div>
                <div className="space-y-2">
                  <Label>description</Label>
                  <Textarea value={credForm.description} onChange={(e) => setCredForm({ ...credForm, description: e.target.value })} placeholder="additional details..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>document number</Label>
                  <Input value={credForm.documentNumber} onChange={(e) => setCredForm({ ...credForm, documentNumber: e.target.value })} placeholder="will be auto-redacted (last 4 shown)" />
                </div>
                <div className="space-y-2">
                  <Label>issued by</Label>
                  <Input value={credForm.issuedBy} onChange={(e) => setCredForm({ ...credForm, issuedBy: e.target.value })} placeholder="issuing organisation" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>issued at</Label>
                    <Input type="date" value={credForm.issuedAt} onChange={(e) => setCredForm({ ...credForm, issuedAt: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>expires at</Label>
                    <Input type="date" value={credForm.expiresAt} onChange={(e) => setCredForm({ ...credForm, expiresAt: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>document file</Label>
                  <FileUpload folder="credentials" onUpload={(url) => setCredForm({ ...credForm, fileUrl: url })}>
                    {credForm.fileUrl ? "change file" : "upload file"}
                  </FileUpload>
                  {credForm.fileUrl && <p className="text-[11px] text-[#7a6b4a]/50 truncate">{credForm.fileUrl}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={credForm.isPublic}
                    onChange={(e) => setCredForm({ ...credForm, isPublic: e.target.checked })}
                    className="accent-[#f5b800]"
                  />
                  <Label htmlFor="isPublic" className="text-[12px] text-[#7a6b4a] cursor-pointer">
                    public (visible on profile)
                  </Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={credSaving}>
                    {credSaving ? "saving..." : "$ save"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={closeCredForm}>
                    cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {credentials.length === 0 ? (
            <EmptyState
              title="no credentials yet"
              description="add qualifications, licenses, tickets, insurance, or resumes to build trust."
            />
          ) : (
            <div className="space-y-0">
              {credentials.map((cred, i) => (
                <div key={cred.id}>
                  <div className="py-5 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-medium">{cred.title}</p>
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]">{cred.type}</span>
                          {cred.isVerified && <Shield className="h-3.5 w-3.5 text-[#7cb87c]" />}
                          {!cred.isPublic && <EyeOff className="h-3.5 w-3.5 text-[#7a6b4a]" />}
                          {cred.isPublic && <Eye className="h-3.5 w-3.5 text-[#c9b87c]" />}
                        </div>
                        <div className="text-[12px] text-[#7a6b4a] mt-2 space-y-1">
                          {cred.documentNumber && (
                            <p>
                              number: {"*".repeat(Math.max(0, cred.documentNumber.length - 4))}{cred.documentNumber.slice(-4)}
                            </p>
                          )}
                          {cred.issuedBy && <p>issued by: {cred.issuedBy}</p>}
                          {cred.issuedAt && (
                            <p>
                              issued: {new Date(cred.issuedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                          {cred.expiresAt && (
                            <p>
                              expires: {new Date(cred.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                          {cred.description && <p className="text-[#7a6b4a]/70">{cred.description}</p>}
                          {cred.fileUrl && (
                            <a href={cred.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#f5b800] hover:underline inline-flex items-center gap-1">
                              <FileCheck className="h-3 w-3" /> view document
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => toggleCredentialVisibility(cred.id, cred.isPublic)} title={cred.isPublic ? "make private" : "make public"}>
                          {cred.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => startEditCredential(cred)} title="edit">
                          <span className="text-[11px]">edit</span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCredential(cred.id)} title="delete">
                          <Trash2 className="h-4 w-4 text-[#c97c7c]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {i < credentials.length - 1 && <div className="divider" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    open: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]",
    negotiating: "bg-transparent text-[#c9b87c] border border-[#c9b87c]/20",
    active: "bg-transparent text-[#7cb87c] border border-[#7cb87c]/20",
    pending_completion: "bg-transparent text-[#7c9cb8] border border-[#7c9cb8]/20",
    completed: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]",
    cancelled: "bg-transparent text-[#c97c7c] border border-[#c97c7c]/20",
    pending: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]",
    accepted: "bg-transparent text-[#7cb87c] border border-[#7cb87c]/20",
    declined: "bg-transparent text-[#c97c7c] border border-[#c97c7c]/20",
    withdrawn: "bg-transparent text-[#5a5a5a] border border-[#2a2a2a]",
    draft: "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", variants[status] || "bg-transparent text-[#7a6b4a] border border-[#2a2a2a]")}>{status.replace("_", " ")}</span>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return (
    <div className="py-24 text-center">
      <p className="text-[#7a6b4a] font-medium mb-2">{title}</p>
      <p className="text-[13px] text-[#7a6b4a]/50 mb-8">{description}</p>
      {action && <Button asChild><Link href={action.href}>{action.label}</Link></Button>}
    </div>
  );
}
