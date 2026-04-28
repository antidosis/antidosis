"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";

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
} from "lucide-react";

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

type PendingCredential = {
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
  createdAt: string;
  profile: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingCredential[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      // Try loading admin data — API will 403 if not admin
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
      const [statsRes, pendingRes] = await Promise.all([
        fetch("/api/v1/admin/stats"),
        fetch("/api/v1/admin/credentials/pending"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(data.credentials || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function verifyCredential(id: string) {
    setActioning(id);
    const res = await fetch(`/api/v1/admin/credentials/${id}/verify`, {
      method: "POST",
    });
    if (res.ok) {
      setPending((prev) => prev.filter((c) => c.id !== id));
      // Refresh stats
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());
    }
    setActioning(null);
  }

  async function rejectCredential(id: string) {
    if (!confirm("Reject this credential verification?")) return;
    setActioning(id);
    const res = await fetch(`/api/v1/admin/credentials/${id}/reject`, {
      method: "POST",
    });
    if (res.ok) {
      setPending((prev) => prev.filter((c) => c.id !== id));
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
          <StatCard icon={Clock} label="pending verifications" value={stats.pendingVerifications} accent />
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
            {pending.map((cred) => (
              <div
                key={cred.id}
                className="vessel p-5 hover:bg-[#1a1714] transition-colors"
              >
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
                      <Badge variant="outline">{cred.type}</Badge>
                      {cred.isPublic && (
                        <span className="flex items-center gap-1 text-xs text-[#b8a078]">
                          <Eye className="h-3 w-3" /> public
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#7a6b5a] space-y-1">
                      {cred.documentNumber && (
                        <p>
                          number: {"*".repeat(Math.max(0, cred.documentNumber.length - 4))}
                          {cred.documentNumber.slice(-4)}
                        </p>
                      )}
                      {cred.issuedBy && <p>issued by: {cred.issuedBy}</p>}
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
                      {cred.description && (
                        <p className="text-[#7a6b5a]/70">{cred.description}</p>
                      )}
                    </div>

                    {cred.fileUrl && (
                      <a
                        href={cred.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#f5a623] hover:underline mt-3"
                      >
                        <ExternalLink className="h-3 w-3" /> view document
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
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
                      onClick={() => rejectCredential(cred.id)}
                      disabled={actioning === cred.id}
                      className="text-[#ff5252]"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      reject
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
      <p className={`text-2xl font-bold ${accent ? "text-[#f5a623]" : "text-[#e8d5a3]"}`}>{value}</p>
    </div>
  );
}
