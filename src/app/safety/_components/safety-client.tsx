"use client";

import Link from "next/link";

import {
  Eye,
  FileSignature,
  Flag,
  Globe,
  Handshake,
  ShieldCheck,
  Stamp,
  UserCheck,
} from "lucide-react";

const PILLARS = [
  {
    icon: UserCheck,
    accent: "text-ok",
    border: "border-ok/25",
    title: "Verified people, not strangers",
    body: "Posting, messaging and accepting all require a verified Australian mobile number, and members can verify their identity with a government-issued ID reviewed by our team. The verified badge travels with them — on their profile, their posts and their listing.",
  },
  {
    icon: FileSignature,
    accent: "text-aero",
    border: "border-aero/25",
    title: "Signed agreements, full audit trail",
    body: "Every exchange can run on a written contract — terms, signatures, timestamps. Every change, acceptance and event is logged autonomously with military precision, so there is always a single source of truth if a deal is ever questioned.",
  },
  {
    icon: Globe,
    accent: "text-sun",
    border: "border-sun/25",
    title: "Guarded external links",
    body: "Profile and listing links are judged before they're allowed: link shorteners, file hosts, paste sites and raw IP addresses are rejected outright. On listings, every external link shows its true destination in plain text before you click — no masked surprises.",
  },
  {
    icon: Flag,
    accent: "text-bad",
    border: "border-bad/25",
    title: "Report anything, see it reviewed",
    body: "Every need, profile and message carries a report action. Reports land in an admin queue with your ticket tracked in your dashboard — you see the outcome, not a black hole. Scams, safety concerns, harassment and spam are all valid reasons.",
  },
  {
    icon: Stamp,
    accent: "text-mercury",
    border: "border-mercury/25",
    title: "A reputation engine for reporters",
    body: "Good-faith reports earn trust; dismissed ones cost more than a valid report earns. Chronically bad-faith reporters sink below zero and their future reports are flagged for the admin team — so the safety system itself can't be weaponised.",
  },
  {
    icon: Eye,
    accent: "text-gold",
    border: "border-gold/25",
    title: "Hard data boundaries",
    body: "Your public profile, your directory listing and your private vault are three separate spaces. Identity documents never appear publicly — only a redacted summary you explicitly choose to share leaves the vault. Personal contact details never leak into listings.",
  },
];

const PRACTICES = [
  "Meet in a public place for first exchanges, and bring someone for larger jobs.",
  "Keep payment and messaging on the platform until trust is earned — that's where the record lives.",
  "Never pay a deposit to a link someone sends you — verify the business independently first.",
  "Check the destination address before signing in anywhere from an external link.",
  "A verified badge describes checks completed on Antidosis — still confirm licensing and insurance for licensed trades.",
  "If a deal feels off, walk away and report. One report can protect the next hundred members.",
];

export function SafetyClient() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 md:px-8">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ash">
          $ cat ~/protocol/safety.txt
        </p>
        <h1 className="heading-display mt-4 text-4xl text-gold md:text-5xl">
          Trust is the protocol.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-parchment">
          A local exchange network is only as strong as the trust between strangers on it. So safety
          on Antidosis isn&apos;t a settings page — it&apos;s built into every layer: identity,
          agreements, links, reporting and data.
        </p>
      </header>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <article
            key={pillar.title}
            className={`vessel rounded-xl border-l-2 ${pillar.border} p-6`}
          >
            <pillar.icon className={`h-6 w-6 ${pillar.accent}`} />
            <h2 className="mt-4 text-lg font-medium text-gold">{pillar.title}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ash">{pillar.body}</p>
          </article>
        ))}
      </div>

      <section className="vessel mt-16 rounded-xl p-6 md:p-10">
        <div className="flex items-center gap-3">
          <Handshake className="h-6 w-6 text-sun" />
          <h2 className="heading-display text-2xl text-gold">The member&apos;s checklist</h2>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">
          The platform does the structural work — you bring the judgement. Six habits that keep
          every exchange clean.
        </p>
        <ol className="mt-7 grid gap-4 md:grid-cols-2">
          {PRACTICES.map((practice, index) => (
            <li key={practice} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sun/40 bg-sun/10 font-mono text-[11px] text-sun">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-parchment">{practice}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-xl border border-ok/25 bg-ok/[0.04] p-6 md:flex-row md:items-center md:p-8">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-ok" />
          <div>
            <h2 className="text-lg font-medium text-gold">Something wrong? Report it.</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ash">
              Every need, profile and message has a report action. You&apos;ll see the outcome in
              your dashboard — and good reports build your own standing in the network.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-md bg-ok px-5 py-2.5 text-sm font-medium text-onaccent transition-colors hover:bg-ok/90"
          >
            Join the network
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center rounded-md border border-line px-5 py-2.5 text-sm text-parchment transition-colors hover:border-linehi hover:text-gold"
          >
            How it works
          </Link>
        </div>
      </section>
    </div>
  );
}
