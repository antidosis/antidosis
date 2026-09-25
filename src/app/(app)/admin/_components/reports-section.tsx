"use client";

import { useEffect, useState } from "react";

import { CheckCircle2, Flag, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ReportItem = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; fullName: string | null; email: string };
};

const REASON_VARIANT: Record<string, string> = {
  safety: "text-[#ff5252]",
  scam: "text-[#f5a623]",
  abuse: "text-[#f5a623]",
  spam: "text-[#8f7f6e]",
  other: "text-[#8f7f6e]",
};

export function ReportsSection() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/admin/reports?status=open");
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function setStatus(id: string, status: "resolved" | "dismissed") {
    setActioning(id);
    const res = await fetch(`/api/v1/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
    setActioning(null);
  }

  return (
    <section className="mt-8">
      <p className="text-xs text-[#8f7f6e] mb-6">$ ls ~/open_reports/ ({reports.length})</p>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#8f7f6e]">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
          loading reports...
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-[#00e676]" />}
          title="all caught up"
          description="no open reports"
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="vessel p-5 hover:bg-[#1a1714] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Flag
                      className={`h-4 w-4 ${REASON_VARIANT[report.reason] || "text-[#8f7f6e]"}`}
                    />
                    <Badge variant="outline">{report.reason}</Badge>
                    <span className="text-xs text-[#8f7f6e]">
                      {report.targetType} · {report.targetId}
                    </span>
                  </div>
                  <p className="text-xs text-[#8f7f6e] mb-1">
                    reported by {report.reporter.fullName || "unnamed user"} (
                    {report.reporter.email}) ·{" "}
                    {new Date(report.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {report.details && (
                    <p className="text-sm text-[#e8d5a3] mt-2">{report.details}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setStatus(report.id, "resolved")}
                    disabled={actioning === report.id}
                    className="bg-[#00e676] text-[#0a0806] hover:bg-[#00e676]/90"
                  >
                    {actioning === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(report.id, "dismissed")}
                    disabled={actioning === report.id}
                    className="text-[#8f7f6e]"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
