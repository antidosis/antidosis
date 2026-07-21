"use client";

import { useState } from "react";

import { Download, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type SerrSellerSummary = {
  profileId: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  abn: string | null;
  locationName: string | null;
  transactionCount: number;
  cashTransactionCount: number;
  totalCashAud: number;
};

type SerrReport = {
  period: { from: string; to: string };
  sellers: SerrSellerSummary[];
  totals: { sellers: number; transactions: number; totalCashAud: number };
  notes: string[];
};

/**
 * SERR (Sharing Economy Reporting Regime) export panel.
 * Produces the per-seller transaction data the ATO requires for each
 * half-year period; CSV downloads lodge via ATO Online services.
 */
export function SerrSection() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SerrReport | null>(null);

  const query = () => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  };

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/serr${query()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setReport(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  const csvUrl = `/api/v1/admin/serr${query()}${query() ? "&" : "?"}format=csv`;

  return (
    <section>
      <div className="divider mb-8" />
      <p className="text-xs text-[#7a6b5a] mb-2">$ ls ~/serr_reporting/</p>
      <h2 className="text-lg heading-display text-[#e8d5a3] mb-2">SERR reporting (ATO)</h2>
      <p className="text-xs text-[#7a6b5a] mb-6 max-w-2xl">
        Sharing Economy Reporting Regime: per-seller transaction totals for completed exchanges.
        Leave dates blank for the most recent statutory half-year period (Jan–Jun due 31 Jul,
        Jul–Dec due 31 Jan). Lodge the CSV via ATO Online services for business.
      </p>

      <div className="vessel p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-[#7a6b5a] uppercase tracking-wide">from</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="block bg-[#1a1714] border border-[#2a2420] rounded px-3 py-2 text-sm text-[#e8d5a3]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#7a6b5a] uppercase tracking-wide">to</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="block bg-[#1a1714] border border-[#2a2420] rounded px-3 py-2 text-sm text-[#e8d5a3]"
            />
          </div>
          <Button onClick={loadReport} disabled={loading}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Load report
          </Button>
          {report && (
            <a
              href={csvUrl}
              className="inline-flex items-center gap-1 text-sm text-[#f5a623] hover:text-[#e8d5a3] transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              download CSV
            </a>
          )}
        </div>
        {error && <p className="text-xs text-[#ff5252] mt-3">{error}</p>}
      </div>

      {report && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="vessel p-4">
              <p className="text-xs text-[#7a6b5a] uppercase tracking-wide mb-1">sellers</p>
              <p className="text-xl font-bold text-[#e8d5a3]">{report.totals.sellers}</p>
            </div>
            <div className="vessel p-4">
              <p className="text-xs text-[#7a6b5a] uppercase tracking-wide mb-1">transactions</p>
              <p className="text-xl font-bold text-[#e8d5a3]">{report.totals.transactions}</p>
            </div>
            <div className="vessel p-4">
              <p className="text-xs text-[#7a6b5a] uppercase tracking-wide mb-1">
                gross cash (AUD)
              </p>
              <p className="text-xl font-bold text-[#f5a623]">
                ${report.totals.totalCashAud.toFixed(2)}
              </p>
            </div>
          </div>

          {report.sellers.length === 0 ? (
            <p className="text-sm text-[#7a6b5a]">
              No completed exchanges in this period — a nil report is not required.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#7a6b5a] uppercase tracking-wide border-b border-[#2a2420]">
                    <th className="py-2 pr-4">seller</th>
                    <th className="py-2 pr-4">ABN</th>
                    <th className="py-2 pr-4">location</th>
                    <th className="py-2 pr-4 text-right">txns</th>
                    <th className="py-2 pr-4 text-right">cash txns</th>
                    <th className="py-2 text-right">gross (AUD)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sellers.map((s) => (
                    <tr key={s.profileId} className="border-b border-[#2a2420]/50">
                      <td className="py-2 pr-4">
                        <p className="text-[#e8d5a3]">{s.fullName || "—"}</p>
                        <p className="text-xs text-[#7a6b5a]">{s.email}</p>
                      </td>
                      <td className="py-2 pr-4 text-[#b8a078]">{s.abn || "—"}</td>
                      <td className="py-2 pr-4 text-[#b8a078]">{s.locationName || "—"}</td>
                      <td className="py-2 pr-4 text-right text-[#b8a078]">{s.transactionCount}</td>
                      <td className="py-2 pr-4 text-right text-[#b8a078]">
                        {s.cashTransactionCount}
                      </td>
                      <td className="py-2 text-right text-[#e8d5a3]">
                        ${s.totalCashAud.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ul className="mt-4 space-y-1">
            {report.notes.map((note) => (
              <li key={note} className="text-xs text-[#7a6b5a]">
                · {note}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
