"use client";

import { useState } from "react";

import { CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InterestKind = "node" | "byo_device" | "updates";

const KIND_OPTIONS: { id: InterestKind; label: string; hint: string }[] = [
  {
    id: "node",
    label: "I want a node",
    hint: "Pilot batch pricing and availability, straight to your inbox.",
  },
  {
    id: "byo_device",
    label: "I already have a device",
    hint: "Tell us the model — we'll help with ANZ setup and channel access.",
  },
  {
    id: "updates",
    label: "Keep me posted",
    hint: "Occasional mesh updates: pilot progress and range-test results.",
  },
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
  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [message, setMessage] = useState("");
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
          name: name || undefined,
          suburb: suburb || undefined,
          deviceModel: kind === "byo_device" && deviceModel ? deviceModel : undefined,
          message: message || undefined,
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
          Confirmation is on its way to <span className="text-parchment">{email}</span>. When the
          relevant stage is ready — pricing, channel access or pilot news — you&apos;ll hear from us
          first.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setMessage("");
          }}
          className="mt-5 text-sm text-ash underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          Register another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="vessel p-5 md:p-7">
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Interest type">
        {KIND_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={kind === option.id}
            onClick={() => setKind(option.id)}
            className={cn(
              "rounded-lg border p-3.5 text-left transition-colors",
              kind === option.id
                ? "border-sun/60 bg-sun/[0.07]"
                : "border-line bg-surface/30 hover:border-line hover:bg-surface/60"
            )}
          >
            <span
              className={cn(
                "block text-[15px] font-medium",
                kind === option.id ? "text-sun" : "text-gold"
              )}
            >
              {option.label}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ash">{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">
            Email <span className="text-sun">*</span>
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            maxLength={254}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional"
            className={inputClass}
            maxLength={120}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">Suburb</span>
          <input
            type="text"
            value={suburb}
            onChange={(event) => setSuburb(event.target.value)}
            placeholder="Helps us plan coverage"
            className={inputClass}
            maxLength={120}
          />
        </label>
        {kind === "byo_device" && (
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm text-parchment">Device model</span>
            <input
              type="text"
              value={deviceModel}
              onChange={(event) => setDeviceModel(event.target.value)}
              placeholder="e.g. LilyGo T-Beam 915, Heltec V3…"
              className={inputClass}
              maxLength={120}
            />
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">Anything else</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder="Optional — questions, your setup, where you'd place a node…"
            className={inputClass}
            maxLength={2000}
          />
        </label>
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={sending || !email}>
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Register interest
        </Button>
        <p className="text-xs text-ash">
          Free, no commitment, no spam — one confirmation, then only what you asked for.
        </p>
      </div>
    </form>
  );
}
