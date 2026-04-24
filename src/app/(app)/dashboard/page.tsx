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
import { Briefcase, FileText, HandHelping, User, Loader2, ArrowRight, Star, Shield, Plus, X, Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  isVerified: boolean;
  isPro: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string }[];
};

const tabs = [
  { id: "overview", label: "overview", icon: User },
  { id: "needs", label: "my_needs", icon: Briefcase },
  { id: "contracts", label: "contracts", icon: FileText },
  { id: "offers", label: "my_offers", icon: HandHelping },
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    locationName: "",
    locationDisplay: "",
    avatarUrl: "",
    socialLinks: [] as { platform: string; url: string }[],
  });
  const [newLinkPlatform, setNewLinkPlatform] = useState("instagram");
  const [newLinkUrl, setNewLinkUrl] = useState("");

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
          socialLinks: p.socialLinks || [],
        });
      }
      if (needsRes.ok) setNeeds(await needsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
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
        socialLinks: editForm.socialLinks,
      }),
    });
    if (res.ok) { const updated = await res.json(); setProfile(updated); }
    setSaving(false);
  }

  function addSocialLink() {
    if (newLinkUrl.trim()) {
      setEditForm({
        ...editForm,
        socialLinks: [...editForm.socialLinks, { platform: newLinkPlatform, url: newLinkUrl.trim() }],
      });
      setNewLinkUrl("");
    }
  }

  function removeSocialLink(index: number) {
    setEditForm({
      ...editForm,
      socialLinks: editForm.socialLinks.filter((_, i) => i !== index),
    });
  }

  if (loading) return <div className="py-24 text-center text-[#7a6b4a]"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />loading...</div>;
  if (!profile) return <div className="py-24 text-center text-[#c97c7c]">error: failed to load profile</div>;

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

              <div className="space-y-4">
                <Label>social_links</Label>
                <div className="space-y-3">
                  {editForm.socialLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[12px] text-[#f5b800] w-20 uppercase">{link.platform}</span>
                      <span className="text-[13px] text-[#7a6b4a] flex-1 truncate">{link.url}</span>
                      <button type="button" onClick={() => removeSocialLink(i)} className="text-[#7a6b4a] hover:text-[#c97c7c]"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={newLinkPlatform}
                    onChange={(e) => setNewLinkPlatform(e.target.value)}
                    className="bg-[#0c0c0c] border border-[#2a2a2a] text-[#e8c97c] text-[13px] px-3 py-2 outline-none focus:border-[#f5b800]"
                  >
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <Input
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSocialLink(); } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addSocialLink}><Plus className="h-4 w-4" /></Button>
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
