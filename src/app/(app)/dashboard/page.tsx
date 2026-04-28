"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileSection } from "./_components/profile-section";
import { CredentialsSection } from "./_components/credentials-section";
import { DashboardHeader } from "./_components/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Briefcase, FileText, HandHelping, User, Loader2, ArrowRight, Star, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  publicPhone: string | null;
  privatePhone: string | null;
  mobile: string | null;
  mobileVerified: boolean;
  isVerified: boolean;
  isPro: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string; isPublic: boolean }[];
};

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
};

const tabs = [
  { id: "overview", label: "Overview", icon: User },
  { id: "needs", label: "My Needs", icon: Briefcase },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "offers", label: "My Interests", icon: HandHelping },
  { id: "credentials", label: "Proof & Credentials", icon: Star },
];

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
    case "contracted":
    case "accepted":
    case "completed":
    case "selected":
      return "success" as const;
    case "pending":
    case "open":
    case "draft":
      return "outline" as const;
    case "declined":
    case "cancelled":
    case "withdrawn":
      return "destructive" as const;
    case "negotiating":
    case "pending_terms":
    case "pending_completion":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

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
        setCredentials(p.credentials || []);
      }
      if (needsRes.ok) setNeeds(await needsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (loading) return (
    <div className="py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-[#b8a078]" />
      <p className="text-sm text-[#7a6b5a]">loading...</p>
    </div>
  );
  if (!profile) return <div className="py-24 text-center text-[#ff5252]">error: failed to load profile</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8">
      <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">Dashboard</h1>
      <p className="text-xs text-[#7a6b5a] mb-8">$ whoami</p>

      <DashboardHeader profile={profile} />

      <div className="vessel p-1 mb-10">
        <div className="flex gap-1 text-sm overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-[#1a1714] text-[#f5a623] shadow-[0_0_20px_rgba(245,166,35,0.1)]"
                  : "text-[#7a6b5a] hover:text-[#e8d5a3]"
              )}
            >
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-10">
          <ProfileSection
            initialProfile={profile}
            credentials={credentials}
            onUpdate={(updated) => setProfile({ ...profile, ...updated })}
          />
          {profile.skills.length > 0 && (
            <section className="vessel p-5">
              <p className="text-xs text-[#7a6b5a] mb-4">$ cat ~/.skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill.id} className="bg-[#1a1714] border border-[#2a2420] text-xs text-[#b8a078] rounded px-2 py-1">
                    {skill.name}{skill.isVerified && <Shield className="ml-1 h-3 w-3 text-[#00e676] inline" />}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "needs" && (
        <div>
          <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/needs/</p>
          {needs.length === 0 ? (
            <EmptyState
              title="No Needs Posted"
              description="Post your first need to start exchanging."
              action={<Button asChild size="sm"><Link href="/needs/new">Post Need</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {needs.map((need) => (
                <div key={need.id} className="vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors">
                  <div className="flex items-center justify-between group">
                    <div>
                      <Link href={`/needs/${need.id}`} className="text-base font-medium text-[#e8d5a3] hover:text-[#f5a623] transition-colors">{need.title}</Link>
                      <div className="flex items-center gap-3 text-xs text-[#7a6b5a] mt-1">
                        <Badge variant={statusBadgeVariant(need.status)}>{need.status}</Badge>
                        <span>{need._count?.acceptances || 0} interested</span>
                        {need.acceptances && need.acceptances.length > 0 && (
                          <span className="text-[#00e676]">{need.acceptances.length} ready to contract</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild><Link href={`/needs/${need.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "contracts" && (
        <div>
          <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/contracts/</p>
          {contracts.length === 0 ? (
            <EmptyState title="No Contracts Yet" description="Accept interest from someone on one of your needs to form a contract." />
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.id} className="vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors">
                  <div className="flex items-center justify-between group">
                    <div>
                      <p className="text-base font-medium text-[#e8d5a3]">{contract.need?.title || "contract"}</p>
                      <div className="text-xs text-[#7a6b5a] mt-1"><Badge variant={statusBadgeVariant(contract.status)}>{contract.status}</Badge></div>
                    </div>
                    <Button size="sm" variant="ghost" asChild><Link href={`/contracts/${contract.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "offers" && (
        <div>
          <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/interests/</p>
          {offers.length === 0 ? (
            <EmptyState
              title="No Interests Expressed"
              description="Browse needs and express your interest."
              action={<Button asChild size="sm"><Link href="/needs">Browse Needs</Link></Button>}
            />
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors">
                  <div className="flex items-center justify-between group">
                    <div>
                      <Link href={`/needs/${offer.need?.id}`} className="text-base font-medium text-[#e8d5a3] hover:text-[#f5a623] transition-colors">{offer.need?.title}</Link>
                      <div className="text-xs text-[#7a6b5a] mt-1 flex items-center gap-2 flex-wrap">
                        <Badge variant={statusBadgeVariant(offer.status)}>{offer.status}</Badge>
                        {offer.status === "accepted" && <span className="text-[#00e676]">poster accepted — contract pending</span>}
                        {offer.status === "pending" && <span>waiting for poster review</span>}
                        {offer.status === "declined" && <span className="text-[#ff5252]">declined</span>}
                        {offer.status === "selected" && <span className="text-[#00e676]">contract formed</span>}
                      </div>
                      {offer.message && <p className="text-sm text-[#b8a078] mt-2">&ldquo;{offer.message}&rdquo;</p>}
                    </div>
                    <Button size="sm" variant="ghost" asChild><Link href={`/needs/${offer.need?.id}`}><ArrowRight className="h-4 w-4" /></Link></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "credentials" && (
        <CredentialsSection
          initialCredentials={credentials}
          onUpdate={(creds) => setCredentials(creds)}
        />
      )}
    </div>
  );
}
