"use client";

import { useState } from "react";

import { CheckCircle2, Flag, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const REASONS = [
  { value: "scam", label: "scam or fraud" },
  { value: "safety", label: "safety concern" },
  { value: "abuse", label: "abuse or harassment" },
  { value: "spam", label: "spam" },
  { value: "other", label: "other" },
] as const;

interface ReportButtonProps {
  targetType: "need" | "profile" | "message";
  targetId: string;
}

/**
 * Trust-and-safety intake: files a report into the admin queue
 * (POST /api/v1/reports). Requires mobile-verified participation —
 * a 403 funnels the user to verify instead of failing silently.
 */
export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("scam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not submit report. Try again later.");
    } catch {
      setError("Could not submit report. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ok">
        <CheckCircle2 className="h-3.5 w-3.5" />
        report received — thank you
      </span>
    );
  }

  return (
    <div className="inline-block">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-ash hover:text-bad transition-colors"
        >
          <Flag className="h-3.5 w-3.5" />
          report
        </button>
      ) : (
        <div className="vessel p-4 mt-2 w-72">
          <p className="text-xs text-gold mb-2">report this {targetType}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-inset border border-line text-gold text-sm px-3 py-2 outline-none focus:border-sun rounded mb-2"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="what happened? (optional)"
            rows={3}
            maxLength={2000}
            className="w-full bg-inset border border-line text-gold text-sm px-3 py-2 outline-none focus:border-sun rounded mb-2 resize-none"
          />
          {error && <p className="text-xs text-bad mb-2">{error}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={submit}
              disabled={submitting}
              className="bg-bad text-white hover:bg-bad/90"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Flag className="h-3.5 w-3.5 mr-1" />
              )}
              submit report
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
