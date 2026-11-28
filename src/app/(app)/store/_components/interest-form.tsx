"use client";

import { useState } from "react";

import { CheckCircle2, Loader2, Mail } from "lucide-react";

import { ActionProgress } from "@/components/ui/action-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InterestKind = "node" | "byo_device" | "updates";

const KIND_OPTIONS: { id: InterestKind; label: string }[] = [
  { id: "node", label: "I want a node" },
  { id: "byo_device", label: "I have a device" },
  { id: "updates", label: "Keep me posted" },
];

const inputClass =
  "w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun";

/**
 * Email-only interest capture — no account needed. Posts to
 * /api/v1/store/interest, which dedupes on (email, kind) and rate-limits.
 */
export function InterestForm({ initialKind = "node" }: { initialKind?: InterestKind }) {
  const [kind, setKind] = useState<InterestKind>(initialKind);
  const [email, setEmail] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/v1/store/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          email,
          deviceModel: kind === "byo_device" && deviceModel ? deviceModel : undefined,
          company,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong — try again");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="vessel p-6 text-center md:p-8">
        <CheckCircle2 className="mx-auto h-8 w-8 text-ok" />
        <h3 className="heading-display mt-4 text-xl text-gold">You&apos;re on the list</h3>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ash">
          Confirmation is on its way to <span className="text-parchment">{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-5 text-sm text-ash underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          Register another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="vessel mx-auto max-w-xl p-5 md:p-7">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Interest type">
        {KIND_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={kind === option.id}
            onClick={() => setKind(option.id)}
            className={cn(
              "rounded-lg border px-2 py-2.5 text-center text-sm font-medium transition-colors sm:text-[15px]",
              kind === option.id
                ? "border-sun/60 bg-sun/[0.07] text-sun"
                : "border-line bg-surface/30 text-gold hover:bg-surface/60"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-label="Email"
          className={inputClass}
          maxLength={254}
        />
        {kind === "byo_device" && (
          <input
            type="text"
            value={deviceModel}
            onChange={(event) => setDeviceModel(event.target.value)}
            placeholder="Device model — e.g. LilyGo T-Beam 915, Heltec V3…"
            aria-label="Device model"
            className={inputClass}
            maxLength={120}
          />
        )}
      </div>

      {/* Honeypot — invisible to humans, catnip for bots */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="mt-3 text-sm text-bad">{error}</p>}

      <ActionProgress
        active={sending}
        stages={["Registering your interest", "Sending confirmation"]}
        className="mt-4"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={sending || !email}>
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Register interest
        </Button>
        <p className="text-xs text-ash">Free, no commitment, no spam.</p>
      </div>
    </form>
  );
}
