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
  Crown,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Smartphone,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  totalUsers: number;
  totalNeeds: number;
  totalContracts: number;
  totalCredentials: number;
  pendingVerifications: number;
  totalPros: number;
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

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
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
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.status === 403) {
        router.push("/dashboard");
        return;
      }
      loadData();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [statsRes, pendingRes, cancellationsRes] = await Promise.all([
        fetch("/api/v1/admin/stats"),
        fetch("/api/v1/admin/credentials/pending"),
        fetch("/api/v1/admin/contracts/pending-cancellation"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(data.credentials || []);
      }
      if (cancellationsRes.ok) {
        const data = await cancellationsRes.json();
        setPendingCancellations(data.contracts || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function forceCancelContract(id: string) {
    setForceCancellingId(id);
    const res = await fetch(`/api/v1/admin/contracts/${id}/force-cancel`, { method: "POST" });
    if (res.ok) {
      setPendingCancellations((prev) => prev.filter((c) => c.id !== id));
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
    }
    setForceCancellingId(null);
  }

  async function verifyCredential(id: string) {
    setActioning(id);
    const res = await fetch(`/api/v1/admin/credentials/${id}/verify`, { method: "POST" });
    if (res.ok) {
      setPending((prev) => prev.filter((c) => c.id !== id));
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
    }
    setActioning(null);
  }

  async function rejectCredential(id: string) {
    setActioning(id);
    const res = await fetch(`/api/v1/admin/credentials/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: rejectReason.trim() || undefined }),
    });
    if (res.ok) {
      setPending((prev) => prev.filter((c) => c.id !== id));
      setRejectingId(null);
      setRejectReason("");
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
    }
    setActioning(null);
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-[#7a6b5a]">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
        loading admin...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8">
      <p className="text-xs text-[#7a6b5a] mb-6">$ sudo su</p>
      <h1 className="text-2xl heading-display text-[#e8d5a3] mb-8">admin dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard icon={Users} label="users" value={stats.totalUsers} />
          <StatCard icon={Crown} label="pros" value={stats.totalPros} />
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

      <div className="divider mb-8" />

      {/* Pending Verifications */}
      <section>
        <p className="text-xs text-[#7a6b5a] mb-6">
          $ ls ~/pending_verifications/ ({pending.length})
        </p>

        {pending.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-[#00e676]" />}
            title="all caught up"
            description="no pending credential verifications"
          />
        ) : (
          <div className="space-y-4">
            {pending.map((cred) => {
              const isExpanded = expandedId === cred.id;
              const isRejecting = rejectingId === cred.id;
              return (
                <div key={cred.id} className="vessel p-5 hover:bg-[#1a1714] transition-colors">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar
                          src={cred.profile.avatarUrl}
                          name={cred.profile.fullName}
                          className="h-8 w-8"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#e8d5a3]">
                            {cred.profile.fullName || "unnamed user"}
                          </p>
                          <p className="text-xs text-[#7a6b5a]">{cred.profile.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-base font-medium text-[#e8d5a3]">{cred.title}</p>
                        <Badge variant="outline">
                          {cred.subType && cred.type === "identification"
                            ? cred.subType.replace(/_/g, " ")
                            : cred.type}
                        </Badge>
                        {cred.isPublic && (
                          <span className="flex items-center gap-1 text-xs text-[#b8a078]">
                            <Eye className="h-3 w-3" /> public
                          </span>
                        )}
                      </div>

                      {/* Quick details (always visible) */}
                      <div className="text-xs text-[#7a6b5a] space-y-1">
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
                            className="inline-flex items-center gap-1 text-xs text-[#f5a623] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> view document
                          </a>
                        )}
                        {cred.signedBackUrl && (
                          <a
                            href={cred.signedBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#f5a623] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> view back
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : cred.id)}
                          className="inline-flex items-center gap-1 text-xs text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
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
                        <div className="mt-3 pt-3 border-t border-[#2a2420]/40 text-xs text-[#7a6b5a] space-y-1">
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
                          {cred.description && (
                            <p className="text-[#7a6b5a]/70">{cred.description}</p>
                          )}
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
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => verifyCredential(cred.id)}
                        disabled={actioning === cred.id}
                        className="bg-[#00e676] text-[#0a0806] hover:bg-[#00e676]/90"
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
                        className="text-[#ff5252]"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        {isRejecting ? "cancel" : "reject"}
                      </Button>
                    </div>
                  </div>

                  {/* Rejection reason form */}
                  {isRejecting && (
                    <div className="mt-4 pt-4 border-t border-[#2a2420]/40">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-[#ff5252] mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-[#e8d5a3] mb-2">Rejection reason (optional)</p>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Image unclear, expired document, wrong document type..."
                            className="w-full bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-sm px-3 py-2 outline-none focus:border-[#ff5252] rounded mb-2 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => rejectCredential(cred.id)}
                              disabled={actioning === cred.id}
                              className="text-[#ff5252] border border-[#ff5252]/30 hover:bg-[#ff5252]/5"
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

      <div className="divider mb-8" />

      {/* Pending Contract Cancellations */}
      <section>
        <p className="text-xs text-[#7a6b5a] mb-6">
          $ ls ~/pending_contract_cancellations/ ({pendingCancellations.length})
        </p>

        {pendingCancellations.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-[#00e676]" />}
            title="all caught up"
            description="no pending contract cancellations"
          />
        ) : (
          <div className="space-y-4">
            {pendingCancellations.map((c) => (
              <div key={c.id} className="vessel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-[#f5a623]" />
                      <p className="text-sm font-medium text-[#e8d5a3]">{c.need.title}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#7a6b5a] mb-2">
                      <span>{c.partyA.fullName || "Unknown"}</span>
                      <span>vs</span>
                      <span>{c.partyB.fullName || "Unknown"}</span>
                    </div>
                    <div className="text-xs text-[#7a6b5a] space-y-1">
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
                      className="bg-[#ff5252] text-white hover:bg-[#ff5252]/90"
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
    <div className={accent ? "vessel-lit p-5" : "vessel p-5"}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accent ? "text-[#f5a623]" : "text-[#7a6b5a]"}`} />
        <span className="text-xs text-[#7a6b5a] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-[#f5a623]" : "text-[#e8d5a3]"}`}>
        {value}
      </p>
    </div>
  );
}
