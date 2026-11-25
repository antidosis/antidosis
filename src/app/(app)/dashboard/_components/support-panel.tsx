"use client";

import { useState } from "react";

import { LifeBuoy, Loader2, Send } from "lucide-react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useApi } from "@/lib/swr-config";

interface SupportRequestItem {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const SUBJECT_OPTIONS = [
  { value: "account", label: "Account & sign-in" },
  { value: "payment_or_billing", label: "Payments & billing" },
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

export function SupportPanel() {
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
      toast("Support request sent — we usually reply within one business day", "success");
    } catch {
      toast("Couldn't send request — try again", "error");
    } finally {
      setSending(false);
    }
  }

  const requests = data?.requests ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)]">
        <section className="vessel rounded-lg border-mercury/20 bg-mercury/[0.02] p-4 sm:p-6">
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
              New request
            </p>
            <h2 className="heading-display mt-1 text-xl text-gold">How can we help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ash">
              Send the team a message. Urgent safety issues are prioritised. For anything
              time-critical you can also email{" "}
              <a href="mailto:support@antidosis.com" className="text-sun hover:underline">
                support@antidosis.com
              </a>
              .
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

            <Button type="button" onClick={submit} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send request
            </Button>
          </div>
        </section>

        <section className="vessel rounded-lg border-line/60 bg-surface/30 p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-mercury" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
              Your requests
            </p>
          </div>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ash">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-ash">
              No support requests yet. Anything you send appears here with its status.
            </p>
          ) : (
            <ul className="space-y-3">
              {requests.map((request) => (
                <li key={request.id} className="rounded-lg border border-line/60 bg-inset/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gold">
                      {SUBJECT_OPTIONS.find((option) => option.value === request.subject)?.label ??
                        request.subject}
                    </p>
                    <Badge variant={STATUS_VARIANT[request.status] ?? "outline"}>
                      {STATUS_LABEL[request.status] ?? request.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-ash">{request.message}</p>
                  <p className="mt-2 text-xs text-ash">
                    {new Date(request.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
