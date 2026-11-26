"use client";

import { useCallback, useEffect, useState } from "react";

import { LifeBuoy, Loader2, MessageSquareReply } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type SupportTicket = {
  id: string;
  reference: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  profile: { id: string; fullName: string | null; email: string; handle: string | null };
};

const SUBJECT_LABEL: Record<string, string> = {
  account: "Account & sign-in",
  payment_or_billing: "Payments & billing",
  safety_report: "Safety concern",
  technical_issue: "Technical issue",
  other: "Other",
};

const STATUS_TONE: Record<string, string> = {
  open: "border-sun/40 bg-sun/[0.06]",
  in_progress: "border-mercury/40 bg-mercury/[0.05]",
  resolved: "border-ok/30 bg-ok/[0.04]",
};

export function SupportSection() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(
    async (status: "open" | "all") => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/admin/support?status=${status === "all" ? "all" : "open"}`
        );
        if (!res.ok) throw new Error("Tickets could not be loaded");
        const data = await res.json();
        setTickets(data.requests || []);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Tickets could not be loaded", "error");
      }
      setLoading(false);
    },
    [toast]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch triggered by filter/mount; setState lives inside the async loader
    load(filter);
  }, [filter, load]);

  async function respond(ticket: SupportTicket) {
    if (draft.trim().length < 2) return;
    setSending(true);
    try {
      const response = await fetch(`/api/v1/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: draft.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Reply failed");
      }
      toast(`Replied to ${ticket.reference} — resolved`, "success");
      setReplying(null);
      setDraft("");
      await load(filter);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Reply failed", "error");
    } finally {
      setSending(false);
    }
  }

  async function setStatus(ticket: SupportTicket, status: string) {
    try {
      const response = await fetch(`/api/v1/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Status update failed");
      toast(`${ticket.reference} marked ${status.replace("_", " ")}`, "success");
      await load(filter);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Status update failed", "error");
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-ash">
          <LifeBuoy className="h-4 w-4 text-mercury" />$ ls ~/support_queue/ ({tickets.length})
        </p>
        <div className="flex gap-2" role="tablist" aria-label="Ticket filter">
          {(["open", "all"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={filter === option}
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs",
                filter === option
                  ? "bg-sun/10 text-sun"
                  : "text-ash hover:bg-surface hover:text-parchment"
              )}
            >
              {option === "open" ? "Open" : "All tickets"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-ash">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          loading tickets…
        </div>
      ) : tickets.length === 0 ? (
        <p className="py-8 text-center text-sm text-ash">
          {filter === "open" ? "No open tickets — the queue is clear." : "No tickets yet."}
        </p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className={cn(
                "rounded-lg border p-4 sm:p-5",
                STATUS_TONE[ticket.status] ?? "border-line"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-mercury">{ticket.reference}</span>
                  <Badge variant={ticket.status === "resolved" ? "success" : "warning"}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <span className="text-xs text-ash/70">
                  {new Date(ticket.createdAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-gold">
                {SUBJECT_LABEL[ticket.subject] ?? ticket.subject}
                <span className="ml-2 font-normal text-ash">
                  from {ticket.profile.fullName ?? ticket.profile.handle ?? "member"} ·{" "}
                  {ticket.profile.email}
                </span>
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-parchment">
                {ticket.message}
              </p>

              {ticket.response && (
                <div className="mt-3 rounded-md border border-ok/25 bg-ok/[0.05] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-ok">
                    <MessageSquareReply className="h-3.5 w-3.5" /> Team reply
                    {ticket.respondedAt && (
                      <span className="font-normal text-ash">
                        ·{" "}
                        {new Date(ticket.respondedAt).toLocaleString("en-AU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-parchment">
                    {ticket.response}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {replying === ticket.id ? (
                  <div className="w-full space-y-2">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={4}
                      placeholder="Write the reply the member will see…"
                      className="w-full rounded border border-line bg-inset px-3 py-2 text-sm text-gold outline-none focus:border-sun"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => respond(ticket)} disabled={sending}>
                        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send reply &amp; resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplying(null);
                          setDraft("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {ticket.status !== "resolved" && (
                      <Button size="sm" onClick={() => setReplying(ticket.id)}>
                        <MessageSquareReply className="mr-2 h-4 w-4" /> Reply
                      </Button>
                    )}
                    {ticket.status === "open" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatus(ticket, "in_progress")}
                      >
                        Mark in progress
                      </Button>
                    )}
                    {ticket.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatus(ticket, "resolved")}
                      >
                        Resolve without reply
                      </Button>
                    )}
                    {ticket.status === "resolved" && filter === "all" && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(ticket, "open")}>
                        Reopen
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
