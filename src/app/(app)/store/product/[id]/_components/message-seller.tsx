"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react";

import { InlineMobileVerify } from "@/components/inline-mobile-verify";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Session = "loading" | "anon" | "authed";

/**
 * Buyer → seller enquiry. Sends a real direct message (POST
 * /api/v1/terminal/dm/messages), so the seller receives it in Relay, the
 * dashboard inbox and notifications. Mobile verification is handled inline —
 * the buyer never gets bounced to another page.
 */
export function MessageSeller({
  sellerProfileId,
  sellerName,
  productName,
  priceLabel,
  productPath,
}: {
  sellerProfileId: string;
  sellerName: string;
  productName: string;
  priceLabel: string;
  productPath: string;
}) {
  const [session, setSession] = useState<Session>("loading");
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(
    `Hi ${sellerName} — I'm interested in "${productName}" (${priceLabel}) from your mesh store shelf. Is it still available?`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) setSession(user ? "authed" : "anon");
      })
      .catch(() => {
        if (!cancelled) setSession("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/terminal/dm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sellerProfileId, content: content.trim() }),
      });
      if (res.ok) {
        setSent(true);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 403 && body.code === "MOBILE_NOT_VERIFIED") {
        setNeedsVerify(true);
        return;
      }
      if (res.status === 400 && typeof body.error === "string" && body.error.includes("yourself")) {
        setError("This is your own listing — manage it from your dashboard.");
        return;
      }
      setError(body.error || "Message could not be sent — try again.");
    } catch {
      setError("Message could not be sent — try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-ok/30 bg-ok/[0.05] p-4">
        <p className="flex items-center gap-2 text-[15px] font-medium text-ok">
          <CheckCircle2 className="h-4 w-4" /> Enquiry sent to {sellerName}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ash">
          Their reply lands in your Relay direct messages and your dashboard inbox — no phone
          numbers or emails change hands.
        </p>
        <Button asChild size="sm" variant="secondary" className="mt-3">
          <Link href="/terminal">Open Relay</Link>
        </Button>
      </div>
    );
  }

  if (session === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line/70 p-4 text-sm text-ash">
        <Loader2 className="h-4 w-4 animate-spin" /> checking your session…
      </div>
    );
  }

  if (session === "anon") {
    return (
      <div className="rounded-lg border border-line/70 p-4">
        <p className="text-sm leading-relaxed text-ash">
          Sign in to message {sellerName} about this item — enquiries stay on Antidosis, so neither
          side shares personal details.
        </p>
        <Button asChild className="mt-3">
          <Link href={`/login?next=${encodeURIComponent(productPath)}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Sign in to message the seller
          </Link>
        </Button>
      </div>
    );
  }

  if (needsVerify) {
    return (
      <div className="rounded-lg border border-sun/30 bg-sun/[0.04] p-4">
        <p className="mb-3 text-sm leading-relaxed text-parchment">
          One quick step — verify your mobile so sellers know you&apos;re real, then your message
          goes straight through.
        </p>
        <InlineMobileVerify
          onVerified={() => {
            setNeedsVerify(false);
            void send();
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line/70 p-4">
      {!open ? (
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <MessageSquare className="mr-2 h-4 w-4" /> Message {sellerName}
        </Button>
      ) : (
        <div>
          <label htmlFor="seller-enquiry" className="mb-1.5 block text-sm text-parchment">
            Your message to {sellerName}
          </label>
          <textarea
            id="seller-enquiry"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun"
          />
          <p className="mt-1 text-xs text-ash/70">
            Ask about availability, postage to your suburb, or payment — keep it on-platform so both
            sides stay protected.
          </p>
          {error && <p className="mt-2 text-sm text-bad">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={send} disabled={sending || content.trim().length === 0}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send enquiry
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
