"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Briefcase,
  FileText,
  HandHelping,
  User,
  Loader2,
  ArrowRight,
  Star,
  Shield,
  TrendingUp,
  RotateCcw,
  Pencil,
  X,
  Users,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import { CredentialsSection } from "./_components/credentials-section";
import { DashboardHeader } from "./_components/dashboard-header";
import { ProfileChecklist } from "./_components/profile-checklist";
import { ProfileSection } from "./_components/profile-section";
import { SocialSection } from "./_components/social-section";
import { TerminalActivityFeed } from "./_components/terminal-activity-feed";

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
  credentials?: any[];
};

type CredentialData = {
  id: string;
  type: string;
  subType: string | null;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  backFileUrl: string | null;
  isPublic: boolean;
  isVerified: boolean;
};

const tabs = [
  { id: "overview", label: "Overview", icon: User },
  { id: "needs", label: "My Needs", icon: Briefcase },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "offers", label: "My Interests", icon: HandHelping },
  { id: "credentials", label: "Proof & Credentials", icon: Star },
  { id: "community", label: "Community", icon: Users },
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
  const [emailVerified, setEmailVerified] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { data: profile, isLoading: profileLoading } = useApi<ProfileData>(
    authChecked ? "/api/v1/profiles/me" : null
  );
  const { data: needs } = useApi<any[]>(authChecked ? "/api/v1/needs/mine" : null);
  const { data: contracts } = useApi<any[]>(authChecked ? "/api/v1/contracts/mine" : null);
  const { data: offers } = useApi<any[]>(authChecked ? "/api/v1/acceptances/mine" : null);

  // Debug: log why cancel might not show
  useEffect(() => {
    if (contracts && profile) {
      contracts.forEach((c: any) => {
        const posterId = c.partyAId ?? c.partyA?.id;
        const isPoster = profile.id === posterId;
        const fulfillerSigned = !!c.partyBSignedAt;
        const cancellable = ["draft", "pending_terms", "active"].includes(c.status);
        if (!isPoster || fulfillerSigned || !cancellable) {
          console.log(
            "[dashboard] contract",
            c.id,
            "— isPoster:",
            isPoster,
            "fulfillerSigned:",
            fulfillerSigned,
            "status:",
            c.status,
            "canCancel:",
            isPoster && !fulfillerSigned && cancellable
          );
        }
      });
    }
  }, [contracts, profile]);

  const [cancellingContractId, setCancellingContractId] = useState<string | null>(null);

  async function handleCancelContract(contractId: string) {
    if (!confirm("Cancel this contract? The need will be archived for you to re-post later."))
      return;
    setCancellingContractId(contractId);
    try {
      const res = await fetch(`/api/v1/contracts/${contractId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to cancel contract");
        return;
      }
      mutate("/api/v1/contracts/mine");
      mutate("/api/v1/needs/mine");
    } catch {
      alert("Failed to cancel contract");
    } finally {
      setCancellingContractId(null);
    }
  }

  async function handleRepostNeed(needId: string) {
    if (!confirm("Re-post this need? It will become visible to everyone again.")) return;
    try {
      const res = await fetch(`/api/v1/needs/${needId}/repost`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to re-post");
        return;
      }
      mutate("/api/v1/needs/mine");
    } catch {
      alert("Failed to re-post");
    }
  }

  const [credentials, setCredentials] = useState<CredentialData[]>(profile?.credentials || []);

  useEffect(() => {
    if (profile?.credentials) {
      setCredentials(profile.credentials);
    }
  }, [profile?.credentials]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setEmailVerified(!!user.email_confirmed_at);
      setAuthChecked(true);
    });
  }, [router, supabase]);

  const isLoading = profileLoading || !authChecked;

  if (isLoading)
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-[#b8a078]" />
        <p className="text-sm text-[#7a6b5a]">loading...</p>
      </div>
    );

  if (!profile)
    return <div className="py-24 text-center text-[#ff5252]">error: failed to load profile</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8">
      <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">Dashboard</h1>
      <p className="text-xs text-[#7a6b5a] mb-8">$ whoami</p>

      <DashboardHeader
        profile={profile}
        needsCount={needs?.length ?? 0}
        contractsCount={contracts?.length ?? 0}
        offersCount={offers?.length ?? 0}
      />

      {/* Persistent quick actions — above tabs, visible on all tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/needs/new"
          className="group vessel p-4 hover:border-[#f5a623]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded flex items-center justify-center bg-[#f5a623]/10 text-[#f5a623]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">
                Post a Need
              </p>
              <p className="text-[11px] text-[#7a6b5a]">Start a new exchange</p>
            </div>
          </div>
        </Link>
        <Link
          href="/needs"
          className="group vessel p-4 hover:border-[#35c2f0]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded flex items-center justify-center bg-[#35c2f0]/10 text-[#35c2f0]">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8d5a3] group-hover:text-[#35c2f0] transition-colors">
                Browse Needs
              </p>
              <p className="text-[11px] text-[#7a6b5a]">Find opportunities</p>
            </div>
          </div>
        </Link>
        <Link href="/pro" className="group vessel p-4 hover:border-[#f0cc33]/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded flex items-center justify-center bg-[#f0cc33]/10 text-[#f0cc33]">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8d5a3] group-hover:text-[#f0cc33] transition-colors">
                Pro Status
              </p>
              <p className="text-[11px] text-[#7a6b5a]">
                {profile.isPro ? "Active for life" : "Claim free Pro"}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="vessel p-1 mb-8">
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
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Profile first */}
          <div id="profile-section">
            <ProfileSection
              initialProfile={profile}
              credentials={credentials}
              onUpdate={(updated) => {
                // mutate profile data optimistically
              }}
            />
          </div>

          {/* Checklist — compact when complete, full when incomplete */}
          <ProfileChecklist
            profile={{ ...profile, credentials }}
            emailVerified={emailVerified}
            onNavigateToCredentials={() => {
              setActiveTab("credentials");
              setTimeout(() => {
                document
                  .getElementById("credentials-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          />

          {/* Skills */}
          {profile.skills.length > 0 && (
            <section className="vessel p-5">
              <p className="text-xs text-[#7a6b5a] mb-4">$ cat ~/.skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className={`text-xs rounded px-2.5 py-1 border transition-colors ${
                      skill.isVerified
                        ? "bg-[#00e676]/5 border-[#00e676]/30 text-[#00e676]"
                        : "bg-[#1a1714] border-[#2a2420] text-[#b8a078]"
                    }`}
                  >
                    {skill.name}
                    {skill.isVerified && <Shield className="ml-1 h-3 w-3 inline" />}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Delete Account */}
          <section className="vessel p-5 border-[#ff5252]/20">
            <p className="text-xs text-[#7a6b5a] mb-4">$ rm -rf ~/</p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-sm text-[#ff5252] hover:text-[#ff5252]/80 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#ff5252] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#e8d5a3]">Delete your account?</p>
                    <p className="text-xs text-[#7a6b5a] mt-1">
                      This will permanently delete your profile, needs, contracts, messages, and all
                      associated data. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#ff5252] hover:bg-[#ff5252]/80 text-white"
                    onClick={async () => {
                      setDeletingAccount(true);
                      try {
                        const res = await fetch("/api/v1/profiles/me", { method: "DELETE" });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          alert(data.error || "Failed to delete account");
                          setDeletingAccount(false);
                          return;
                        }
                        await supabase.auth.signOut();
                        router.push("/");
                      } catch {
                        alert("Failed to delete account");
                        setDeletingAccount(false);
                      }
                    }}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {deletingAccount ? "Deleting..." : "Permanently Delete"}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "needs" && (
        <div>
          {!needs || needs.length === 0 ? (
            <>
              <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/needs/</p>
              <EmptyState
                title="No Needs Posted"
                description="Post your first need to start exchanging."
                action={
                  <Button asChild size="sm">
                    <Link href="/needs/new">Post Need</Link>
                  </Button>
                }
              />
            </>
          ) : (
            <>
              {/* Active needs */}
              {(() => {
                const activeNeeds = needs.filter((n) => n.status !== "archived");
                const archivedNeeds = needs.filter((n) => n.status === "archived");
                return (
                  <>
                    <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/needs/</p>
                    {activeNeeds.length === 0 ? (
                      <EmptyState
                        title="No Active Needs"
                        description="All your needs are archived. Re-post one below or create a new need."
                        action={
                          <Button asChild size="sm">
                            <Link href="/needs/new">Post Need</Link>
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-3 mb-8">
                        {activeNeeds.map((need) => (
                          <div
                            key={need.id}
                            className="vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors border-l-2 border-l-[#35c2f0]/40"
                          >
                            <div className="flex items-center justify-between group">
                              <div className="min-w-0">
                                <Link
                                  href={`/needs/${need.id}`}
                                  className="text-base font-medium text-[#e8d5a3] hover:text-[#f5a623] transition-colors block truncate"
                                >
                                  {need.title}
                                </Link>
                                <div className="flex items-center gap-3 text-xs text-[#7a6b5a] mt-1 flex-wrap">
                                  <Badge variant={statusBadgeVariant(need.status)}>
                                    {need.status}
                                  </Badge>
                                  <span>{need._count?.acceptances || 0} interested</span>
                                  {need.acceptances && need.acceptances.length > 0 && (
                                    <span className="text-[#00e676]">
                                      {need.acceptances.length} ready to contract
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/needs/${need.id}`}>
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Archived needs */}
                    {archivedNeeds.length > 0 && (
                      <>
                        <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/needs/archive/</p>
                        <div className="space-y-3">
                          {archivedNeeds.map((need) => (
                            <div
                              key={need.id}
                              className="vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors border-l-2 border-l-[#7a6b5a]/40 opacity-80"
                            >
                              <div className="flex items-center justify-between group">
                                <div className="min-w-0">
                                  <p className="text-base font-medium text-[#b8a078] truncate">
                                    {need.title}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-[#7a6b5a] mt-1 flex-wrap">
                                    <Badge variant="outline">archived</Badge>
                                    <span>cancelled contract</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className="text-[#b8a078] hover:text-[#e8d5a3]"
                                  >
                                    <Link href={`/needs/${need.id}/edit`}>
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRepostNeed(need.id)}
                                    className="text-[#00e676] hover:text-[#00e676]"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {activeTab === "contracts" && (
        <div>
          <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/contracts/</p>
          {!contracts || contracts.length === 0 ? (
            <EmptyState
              title="No Contracts Yet"
              description="Accept interest from someone on one of your needs to form a contract."
            />
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => {
                const posterId = contract.partyAId ?? contract.partyA?.id;
                const isPoster = profile?.id === posterId;
                const fulfillerSigned = !!contract.partyBSignedAt;
                const canCancel =
                  isPoster &&
                  !fulfillerSigned &&
                  (contract.status === "draft" ||
                    contract.status === "pending_terms" ||
                    contract.status === "active");
                return (
                  <div
                    key={contract.id}
                    className={`vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors border-l-2 ${
                      contract.status === "active" || contract.status === "completed"
                        ? "border-l-[#00e676]/40"
                        : contract.status === "cancelled"
                          ? "border-l-[#ff5252]/40"
                          : "border-l-[#f5a623]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between group">
                      <div className="min-w-0">
                        <p className="text-base font-medium text-[#e8d5a3] truncate">
                          {contract.need?.title || "contract"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#7a6b5a] mt-1 flex-wrap">
                          <Badge variant={statusBadgeVariant(contract.status)}>
                            {contract.status}
                          </Badge>
                          {canCancel && (
                            <span className="text-[#f5a623]">
                              waiting for signature — you can cancel
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelContract(contract.id)}
                            disabled={cancellingContractId === contract.id}
                            className="text-[#ff5252] hover:text-[#ff5252] hover:bg-[#ff5252]/10"
                          >
                            {cancellingContractId === contract.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/contracts/${contract.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "offers" && (
        <div>
          <p className="text-xs text-[#7a6b5a] mb-4">$ ls ~/interests/</p>
          {!offers || offers.length === 0 ? (
            <EmptyState
              title="No Interests Expressed"
              description="Browse needs and express your interest."
              action={
                <Button asChild size="sm">
                  <Link href="/needs">Browse Needs</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`vessel p-5 mb-3 hover:bg-[#1a1714] transition-colors border-l-2 ${
                    offer.status === "selected" || offer.status === "accepted"
                      ? "border-l-[#00e676]/40"
                      : offer.status === "declined"
                        ? "border-l-[#ff5252]/40"
                        : "border-l-[#d76bf5]/40"
                  }`}
                >
                  <div className="flex items-center justify-between group">
                    <div className="min-w-0">
                      <Link
                        href={`/needs/${offer.need?.id}`}
                        className="text-base font-medium text-[#e8d5a3] hover:text-[#f5a623] transition-colors block truncate"
                      >
                        {offer.need?.title}
                      </Link>
                      <div className="text-xs text-[#7a6b5a] mt-1 flex items-center gap-2 flex-wrap">
                        <Badge variant={statusBadgeVariant(offer.status)}>{offer.status}</Badge>
                        {offer.status === "accepted" && (
                          <span className="text-[#00e676]">poster accepted — contract pending</span>
                        )}
                        {offer.status === "pending" && <span>waiting for poster review</span>}
                        {offer.status === "declined" && (
                          <span className="text-[#ff5252]">declined</span>
                        )}
                        {offer.status === "selected" && (
                          <span className="text-[#00e676]">contract formed</span>
                        )}
                      </div>
                      {offer.message && (
                        <p className="text-sm text-[#b8a078] mt-2">&ldquo;{offer.message}&rdquo;</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/needs/${offer.need?.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "credentials" && (
        <div id="credentials-section">
          <CredentialsSection
            initialCredentials={credentials}
            onUpdate={(creds) => setCredentials(creds)}
          />
        </div>
      )}

      {activeTab === "community" && (
        <div className="space-y-6">
          <p className="text-xs text-[#7a6b5a] mb-4">$ tail -f ~/community.log</p>
          <SocialSection />
          <TerminalActivityFeed />
        </div>
      )}
    </div>
  );
}
