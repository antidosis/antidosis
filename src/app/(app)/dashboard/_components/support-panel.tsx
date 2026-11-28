"use client";

import { useState } from "react";

import Link from "next/link";

import { Flag, LifeBuoy, Loader2, MessageSquareReply, Send } from "lucide-react";
import { mutate } from "swr";

import { ActionProgress } from "@/components/ui/action-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

interface SupportRequestItem {
  id: string;
  reference: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface ReportItem {
  id: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const SUBJECT_OPTIONS = [
  { value: "account", label: "Account & sign-in" },
  { value: "payment_or_billing", label: "Payments & billing" },
  { value: "mesh_store", label: "Mesh store & selling" },
  { value: "safety_report", label: "Safety concern" },
  { value: "technical_issue", label: "Something is broken" },
  { value: "other", label: "Something else" },
] as const;

const STATUS_VARIANT: Record<string, "outline" | "success" | "warning"> = {
  open: "warning",
  in_progress: "outline",
  resolved: "success",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

const REPORT_REASON_LABEL: Record<string, string> = {
  scam: "Scam or fraud",
  safety: "Safety concern",
  abuse: "Abuse or harassment",
  spam: "Spam",
  other: "Other",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SupportPanel() {
  const [view, setView] = useState<"tickets" | "reports">("tickets");

  return (
    <div className="mx-auto max-w-6xl">
      <div
        role="tablist"
        aria-label="Support sections"
        className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface/35 p-2 sm:inline-flex"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "tickets"}
          onClick={() => setView("tickets")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm",
            view === "tickets"
              ? "border border-mercury/25 bg-mercury/[0.07] text-mercury"
              : "border border-transparent text-ash hover:text-gold"
          )}
        >
          <LifeBuoy className="h-4 w-4" /> Support tickets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "reports"}
          onClick={() => setView("reports")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm",
            view === "reports"
              ? "border border-bad/25 bg-bad/[0.07] text-bad"
              : "border border-transparent text-ash hover:text-gold"
          )}
        >
          <Flag className="h-4 w-4" /> My reports
        </button>
      </div>

      {view === "tickets" ? <TicketsView /> : <ReportsView />}
    </div>
  );
}

/* ─── Support tickets ──────────────────────────────────────────────────── */

function TicketsView() {
  const { toast } = useToast();
  const [subject, setSubject] = useState<string>("account");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { data, isLoading } = useApi<{ requests: SupportRequestItem[] }>("/api/v1/support");

  async function submit() {
    if (sending) return;
    if (message.trim().length < 10) {
      toast("Please describe the issue in at least 10 characters", "error");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/v1/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message: message.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast(typeof result.error === "string" ? result.error : "Couldn't send request", "error");
        return;
      }
      setMessage("");
      await mutate("/api/v1/support");
      toast(
        `Ticket ${result.request?.reference ?? "created"} sent — we usually reply within one business day`,
        "success"
      );
    } catch {
      toast("Couldn't send request — try again", "error");
    } finally {
      setSending(false);
    }
  }

  const requests = data?.requests ?? [];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)]">
      <section className="vessel rounded-lg border-mercury/20 bg-mercury/[0.02] p-4 sm:p-6">
        <div className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
            New ticket
          </p>
          <h2 className="heading-display mt-1 text-xl text-gold">How can we help?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ash">
            Send the team a message. Urgent safety issues are prioritised. For anything
            time-critical you can also email{" "}
            <a href="mailto:support@antidosis.com" className="text-sun hover:underline">
              support@antidosis.com
            </a>
            . Every ticket gets a reference number so we can pick it up quickly.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-subject">Topic</Label>
            <select
              id="support-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-10 w-full rounded border border-line bg-inset px-3 text-sm text-gold outline-none transition-colors focus:border-sun"
            >
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-message">What happened?</Label>
            <textarea
              id="support-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              maxLength={4000}
              placeholder="Describe the issue — what you were doing, what you expected, and what happened instead."
              className="w-full rounded border border-line bg-inset px-3 py-2 text-base text-gold outline-none transition-colors placeholder:text-ash focus:border-sun"
            />
            <p className="text-xs text-ash">{message.length}/4000</p>
          </div>

          <ActionProgress
            active={sending}
            stages={["Sending your ticket", "Creating your reference number"]}
          />
          <Button type="button" onClick={submit} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send ticket
          </Button>
        </div>
      </section>

      <section className="vessel rounded-lg border-line/60 bg-surface/30 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-mercury" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
            Your tickets
          </p>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-ash">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-ash">
            No support tickets yet. Anything you send appears here with its reference number and
            status.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id} className="rounded-lg border border-line/60 bg-inset/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-mercury">{request.reference}</p>
                  <Badge variant={STATUS_VARIANT[request.status] ?? "outline"}>
                    {STATUS_LABEL[request.status] ?? request.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-gold">
                  {SUBJECT_OPTIONS.find((option) => option.value === request.subject)?.label ??
                    request.subject}
                </p>
                <p className="mt-1 line-clamp-3 text-sm text-ash">{request.message}</p>
                {request.response && (
                  <div className="mt-3 rounded-md border border-ok/25 bg-ok/[0.05] p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-ok">
                      <MessageSquareReply className="h-3.5 w-3.5" /> Reply from the Antidosis team
                      {request.respondedAt && (
                        <span className="font-normal text-ash">
                          · {formatDate(request.respondedAt)}
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-parchment">
                      {request.response}
                    </p>
                  </div>
                )}
                <p className="mt-2 text-xs text-ash/70">Opened {formatDate(request.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ─── My reports (trust & safety) ──────────────────────────────────────── */

function ReportsView() {
  const { data, isLoading } = useApi<{ reports: ReportItem[] }>("/api/v1/reports/mine");
  const reports = data?.reports ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bad/20 bg-bad/[0.03] p-4">
        <div>
          <p className="text-sm font-medium text-gold">Reports you&apos;ve filed</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ash">
            When you report a need, profile or message, the trust &amp; safety team reviews it.
            Status updates appear here. To report something new, use the flag on any need, profile
            or message.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/needs">Browse needs</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-ash">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="vessel p-8 text-center">
          <Flag className="mx-auto h-6 w-6 text-ash" />
          <p className="mt-3 text-sm text-parchment">You haven&apos;t filed any reports</p>
          <p className="mt-1 text-xs text-ash">
            See something that breaks community trust? The flag action is on every need and profile.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="vessel p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-gold">
                  {REPORT_REASON_LABEL[report.reason] ?? report.reason} — {report.targetLabel}
                </p>
                <Badge variant={STATUS_VARIANT[report.status] ?? "outline"}>
                  {STATUS_LABEL[report.status] ?? report.status}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ash">
                <span>
                  {report.targetType === "need"
                    ? "Need"
                    : report.targetType === "profile"
                      ? "Profile"
                      : "Message"}
                </span>
                <span>Filed {formatDate(report.createdAt)}</span>
                {report.status !== "open" && <span>Updated {formatDate(report.updatedAt)}</span>}
              </div>
              {report.details && (
                <p className="mt-2 text-sm leading-relaxed text-ash">
                  &ldquo;{report.details}&rdquo;
                </p>
              )}
              {report.targetType === "need" && report.targetLabel !== "Deleted need" && (
                <Link
                  href={`/needs/${report.targetId}`}
                  className="mt-2 inline-block text-xs font-medium text-sun hover:underline"
                >
                  View the reported need →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
