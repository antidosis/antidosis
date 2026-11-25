"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Loader2,
  Users,
  Briefcase,
  FileText,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Smartphone,
  LayoutDashboard,
  Flag,
  LifeBuoy,
  Download,
  RefreshCw,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { ReportsSection } from "./_components/reports-section";
import { SerrSection } from "./_components/serr-section";
import { SupportSection } from "./_components/support-section";
import { UserManagementSection } from "./_components/user-management-section";

type Stats = {
  totalUsers: number;
  totalNeeds: number;
  totalContracts: number;
  totalCredentials: number;
  pendingVerifications: number;
  totalVerified: number;
  recentNeeds: number;
  recentContracts: number;
};

type PendingCancellation = {
  id: string;
  status: string;
  cancelRequestedAt: string;
  cancelEscalatedAt: string | null;
  cancelReason: string | null;
  need: { id: string; title: string };
  partyA: { id: string; fullName: string | null; email: string; avatarUrl: string | null };
  partyB: { id: string; fullName: string | null; email: string; avatarUrl: string | null };
};

type PendingCredential = {
  id: string;
  type: string;
  subType: string | null;
  title: string;
  description: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  signedUrl: string | null;
  signedBackUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  profile: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
    mobile: string | null;
  };
};

type AdminView = "operations" | "verifications" | "reports" | "support" | "members" | "compliance";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [supabase] = useState(() => createClient());
  const [view, setView] = useState<AdminView>("operations");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingCredential[]>([]);
  const [pendingCancellations, setPendingCancellations] = useState<PendingCancellation[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);
  const [forceCancellingId, setForceCancellingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }
      await loadData();
    }
    void init();
    return () => {
      active = false;
    };
    // loadData is intentionally scoped to this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, pendingRes, cancellationsRes] = await Promise.all([
        fetch("/api/v1/admin/stats"),
        fetch("/api/v1/admin/credentials/pending"),
        fetch("/api/v1/admin/contracts/pending-cancellation"),
      ]);
      if (statsRes.status === 401 || statsRes.status === 403) {
        router.replace("/dashboard");
        return;
      }
      if (!statsRes.ok || !pendingRes.ok || !cancellationsRes.ok) {
        throw new Error("One or more admin queues could not be loaded");
      }
      const [statsData, pendingData, cancellationsData] = await Promise.all([
        statsRes.json(),
        pendingRes.json(),
        cancellationsRes.json(),
      ]);
      setStats(statsData);
      setPending(pendingData.credentials || []);
      setPendingCancellations(cancellationsData.contracts || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Admin data could not be loaded", "error");
    } finally {
      setLoading(false);
    }
  }

  async function forceCancelContract(id: string) {
    if (!confirm("Force-cancel this contract? Both parties' active agreement will be cancelled.")) {
      return;
    }
    setForceCancellingId(id);
    try {
      const response = await fetch(`/api/v1/admin/contracts/${id}/force-cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Contract cancellation failed");
      }
      setPendingCancellations((previous) => previous.filter((contract) => contract.id !== id));
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
      toast("Contract cancelled", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Contract cancellation failed", "error");
    } finally {
      setForceCancellingId(null);
    }
  }

  async function verifyCredential(id: string) {
    setActioning(id);
    try {
      const response = await fetch(`/api/v1/admin/credentials/${id}/verify`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Verification failed");
      }
      setPending((previous) => previous.filter((credential) => credential.id !== id));
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
      toast("Credential verified", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Verification failed", "error");
    } finally {
      setActioning(null);
    }
  }

  async function rejectCredential(id: string) {
    setActioning(id);
    try {
      const response = await fetch(`/api/v1/admin/credentials/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason.trim() || undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Rejection failed");
      }
      setPending((previous) => previous.filter((credential) => credential.id !== id));
      setRejectingId(null);
      setRejectReason("");
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
      toast("Credential rejected with feedback", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Rejection failed", "error");
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-ash">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
        loading admin...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-xs text-ash">Trust & safety workspace</p>
          <h1 className="heading-display text-2xl text-gold md:text-3xl">Admin operations</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh queues
        </Button>
      </div>

      <nav
        aria-label="Admin workspaces"
        className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface/35 p-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {(
          [
            {
              id: "operations",
              label: "Operations",
              icon: LayoutDashboard,
              count: pendingCancellations.length,
            },
            { id: "verifications", label: "ID review", icon: ShieldCheck, count: pending.length },
            { id: "reports", label: "Reports", icon: Flag },
            { id: "support", label: "Support", icon: LifeBuoy },
            { id: "members", label: "Members", icon: Users },
            { id: "compliance", label: "SERR export", icon: Download },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            aria-current={view === item.id ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              view === item.id
                ? "border-sun/30 bg-sun/[0.07] text-sun"
                : "border-transparent text-ash hover:bg-surface hover:text-gold"
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
            {"count" in item && item.count > 0 && (
              <span className="rounded bg-raise px-1.5 font-mono text-[10px]">{item.count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <StatCard icon={Users} label="users" value={stats.totalUsers} />
          <StatCard icon={ShieldCheck} label="verified" value={stats.totalVerified} />
          <StatCard icon={Briefcase} label="needs" value={stats.totalNeeds} />
          <StatCard icon={FileText} label="contracts" value={stats.totalContracts} />
          <StatCard icon={Award} label="credentials" value={stats.totalCredentials} />
          <StatCard
            icon={Clock}
            label="pending verifications"
            value={stats.pendingVerifications}
            accent
          />
          <StatCard icon={Briefcase} label="needs (7d)" value={stats.recentNeeds} />
          <StatCard icon={FileText} label="contracts (7d)" value={stats.recentContracts} />
        </div>
      )}

      {view === "verifications" && (
        <section>
          <p className="text-xs text-ash mb-6">$ ls ~/pending_verifications/ ({pending.length})</p>

          {pending.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8 text-ok" />}
              title="all caught up"
              description="no pending credential verifications"
            />
          ) : (
            <div className="space-y-4">
              {pending.map((cred) => {
                const isExpanded = expandedId === cred.id;
                const isRejecting = rejectingId === cred.id;
                return (
                  <div key={cred.id} className="vessel p-5 hover:bg-raise transition-colors">
                    {/* Header row */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            src={cred.profile.avatarUrl}
                            name={cred.profile.fullName}
                            className="h-8 w-8"
                          />
                          <div>
                            <p className="text-sm font-medium text-gold">
                              {cred.profile.fullName || "unnamed user"}
                            </p>
                            <p className="text-xs text-ash">{cred.profile.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="text-base font-medium text-gold">{cred.title}</p>
                          <Badge variant="outline">
                            {cred.subType && cred.type === "identification"
                              ? cred.subType.replace(/_/g, " ")
                              : cred.type}
                          </Badge>
                          {cred.isPublic && (
                            <span className="flex items-center gap-1 text-xs text-parchment">
                              <Eye className="h-3 w-3" /> public
                            </span>
                          )}
                        </div>

                        {/* Quick details (always visible) */}
                        <div className="text-xs text-ash space-y-1">
                          {cred.documentNumber && (
                            <p>
                              number: {"*".repeat(Math.max(0, cred.documentNumber.length - 4))}
                              {cred.documentNumber.slice(-4)}
                            </p>
                          )}
                          {cred.issuedBy && <p>issued by: {cred.issuedBy}</p>}
                          {cred.expiresAt && (
                            <p>
                              expires:{" "}
                              {new Date(cred.expiresAt).toLocaleDateString("en-AU", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>

                        {/* Document links */}
                        <div className="flex items-center gap-3 mt-3">
                          {cred.signedUrl && (
                            <a
                              href={cred.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-sun hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> view document
                            </a>
                          )}
                          {cred.signedBackUrl && (
                            <a
                              href={cred.signedBackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-sun hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> view back
                            </a>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : cred.id)}
                            className="inline-flex items-center gap-1 text-xs text-ash hover:text-gold transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            {isExpanded ? "less" : "more details"}
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-line/40 text-xs text-ash space-y-1">
                            {cred.profile.mobile && (
                              <p className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3" />
                                {cred.profile.mobile}
                              </p>
                            )}
                            {cred.issuedAt && (
                              <p>
                                issued:{" "}
                                {new Date(cred.issuedAt).toLocaleDateString("en-AU", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                            {cred.description && <p className="text-ash/70">{cred.description}</p>}
                            <p>
                              uploaded:{" "}
                              {new Date(cred.createdAt).toLocaleDateString("en-AU", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-2 sm:flex-col">
                        <Button
                          size="sm"
                          onClick={() => verifyCredential(cred.id)}
                          disabled={actioning === cred.id}
                          className="bg-ok text-onaccent hover:bg-ok/90"
                        >
                          {actioning === cred.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          verify
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRejectingId(isRejecting ? null : cred.id);
                            setRejectReason("");
                          }}
                          disabled={actioning === cred.id}
                          className="text-bad"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          {isRejecting ? "cancel" : "reject"}
                        </Button>
                      </div>
                    </div>

                    {/* Rejection reason form */}
                    {isRejecting && (
                      <div className="mt-4 pt-4 border-t border-line/40">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-bad mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-gold mb-2">Rejection reason (optional)</p>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="e.g. Image unclear, expired document, wrong document type..."
                              className="w-full bg-inset border border-line text-gold text-sm px-3 py-2 outline-none focus:border-bad rounded mb-2 resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rejectCredential(cred.id)}
                                disabled={actioning === cred.id}
                                className="text-bad border border-bad/30 hover:bg-bad/5"
                              >
                                {actioning === cred.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                )}
                                confirm reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason("");
                                }}
                              >
                                cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {view === "operations" && (
        <section>
          <p className="text-xs text-ash mb-6">
            $ ls ~/pending_contract_cancellations/ ({pendingCancellations.length})
          </p>

          {pendingCancellations.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8 text-ok" />}
              title="all caught up"
              description="no pending contract cancellations"
            />
          ) : (
            <div className="space-y-4">
              {pendingCancellations.map((c) => (
                <div key={c.id} className="vessel p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-sun" />
                        <p className="text-sm font-medium text-gold">{c.need.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ash mb-2">
                        <span>{c.partyA.fullName || "Unknown"}</span>
                        <span>vs</span>
                        <span>{c.partyB.fullName || "Unknown"}</span>
                      </div>
                      <div className="text-xs text-ash space-y-1">
                        <p>
                          Requested:{" "}
                          {new Date(c.cancelRequestedAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {c.cancelEscalatedAt && (
                          <p className="text-amber-500">
                            Escalated:{" "}
                            {new Date(c.cancelEscalatedAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {c.cancelReason && <p>Reason: {c.cancelReason}</p>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        onClick={() => forceCancelContract(c.id)}
                        disabled={forceCancellingId === c.id}
                        className="bg-bad text-white hover:bg-bad/90"
                      >
                        {forceCancellingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Force Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {view === "compliance" && <SerrSection />}
      {view === "reports" && <ReportsSection />}
      {view === "support" && <SupportSection />}
      {view === "members" && <UserManagementSection />}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "vessel-lit rounded-lg p-3 sm:p-4" : "vessel rounded-lg p-3 sm:p-4"}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accent ? "text-sun" : "text-ash"}`} />
        <span className="text-xs text-ash uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-sun" : "text-gold"}`}>{value}</p>
    </div>
  );
}
