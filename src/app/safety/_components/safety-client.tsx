"use client";

import Link from "next/link";

import {
  ArrowRight,
  Eye,
  FileSignature,
  Flag,
  Globe,
  Handshake,
  Lock,
  ShieldCheck,
  Stamp,
  Store,
  UserCheck,
} from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const HERO_SIGNALS = [
  "Verified mobile required to participate",
  "Signed agreements with a full audit trail",
  "External links judged before they're shown",
  "Reports reviewed by humans, tracked by ticket",
];

const PILLARS = [
  {
    icon: UserCheck,
    accent: "var(--x-00e676)",
    title: "Verified people, not strangers",
    body: "Posting, messaging and accepting all require a verified Australian mobile number, and members can verify their identity with a government-issued ID reviewed by our team. The verified badge travels with them — on their profile, their posts and their listing.",
  },
  {
    icon: FileSignature,
    accent: "var(--x-00e5ff)",
    title: "Signed agreements, full audit trail",
    body: "Every exchange can run on a written contract — terms, signatures, timestamps. Every change, acceptance and event is logged autonomously, so there is always a single source of truth if a deal is ever questioned.",
  },
  {
    icon: Globe,
    accent: "var(--x-f5a623)",
    title: "Guarded external links",
    body: "Profile and listing links are judged before they're allowed: link shorteners, file hosts, paste sites and raw IP addresses are rejected outright. On listings, every external link shows its true destination in plain text before you click — no masked surprises.",
  },
  {
    icon: Flag,
    accent: "var(--x-ff5252)",
    title: "Report anything, see it reviewed",
    body: "Every need, profile and message carries a report action. Reports land in an admin queue with your ticket tracked in your dashboard — you see the outcome, not a black hole. Scams, safety concerns, harassment and spam are all valid reasons.",
  },
  {
    icon: Stamp,
    accent: "var(--x-b24bf5)",
    title: "A reputation engine for reporters",
    body: "Good-faith reports earn trust; dismissed ones cost more than a valid report earns. Chronically bad-faith reporters sink below zero and their future reports are flagged for the admin team — so the safety system itself can't be weaponised.",
  },
  {
    icon: Eye,
    accent: "var(--x-e8d5a3)",
    title: "Hard data boundaries",
    body: "Your public profile, your directory listing and your private vault are three separate spaces. Identity documents never appear publicly — only a redacted summary you explicitly choose to share leaves the vault. Personal contact details never leak into listings.",
  },
];

const SPACES = [
  {
    icon: Globe,
    title: "Public profile",
    body: "Who you are to the neighbourhood — name, skills, reviews, and the contact details you choose to show.",
    accent: "var(--x-00e5ff)",
  },
  {
    icon: Store,
    title: "Directory listing",
    body: "Your business front — specialties, accepted exchanges and business contact. Entirely separate from your personal profile.",
    accent: "var(--x-f5a623)",
  },
  {
    icon: Lock,
    title: "Private vault",
    body: "ID, licences and credentials stay in a private workspace. Nothing leaves unless you explicitly share a redacted summary.",
    accent: "var(--x-00e676)",
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
    <div className="chapters flex min-h-screen flex-col bg-void text-gold">
      <Navbar />
      <main className="flex-1">
        {/* HERO — the protocol, stated plainly */}
        <section className="chapter scene-beacon pb-16 pt-28 md:pb-24 md:pt-40">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal>
              <p className="mb-8 font-mono text-xs text-ash">$ cat ~/protocol/safety.txt</p>
              <h1 className="heading-display mb-6 text-4xl leading-[1.08] text-gold sm:text-5xl md:text-7xl">
                Trust is
                <br />
                <span className="text-ok">the protocol.</span>
              </h1>
              <p className="mb-10 max-w-xl text-base leading-relaxed text-ash">
                A local exchange network is only as strong as the trust between strangers on it. So
                safety on Antidosis isn&apos;t a settings page — it&apos;s built into every layer:
                identity, agreements, links, reporting and data.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                {HERO_SIGNALS.map((signal) => (
                  <div
                    key={signal}
                    className="flex items-start gap-2.5 rounded-lg border border-line bg-surface/70 p-3 sm:p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    <span className="text-xs leading-relaxed text-parchment sm:text-sm">
                      {signal}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* SIX LAYERS — the structural work the platform does */}
        <section className="chapter scene-beam py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal>
              <p className="mb-3 font-mono text-xs text-ash">» SIX LAYERS — ALWAYS ON</p>
              <h2 className="heading-display mb-10 text-2xl text-gold md:text-4xl">
                The structural <span className="text-ok">work.</span>
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
              {PILLARS.map((pillar, index) => (
                <Reveal key={pillar.title} delay={index * 70}>
                  <article
                    className="vessel h-full rounded-xl border-l-2 p-4 md:p-6"
                    style={{ borderLeftColor: `${pillar.accent}66` }}
                  >
                    <div
                      className="mb-3 flex h-9 w-9 items-center justify-center md:mb-4 md:h-10 md:w-10"
                      style={{
                        background: `${pillar.accent}10`,
                        border: `1px solid ${pillar.accent}25`,
                      }}
                    >
                      <pillar.icon
                        className="h-4 w-4 md:h-5 md:w-5"
                        style={{ color: pillar.accent }}
                      />
                    </div>
                    <h3 className="mb-1.5 text-sm font-medium leading-snug text-gold md:mb-2 md:text-base">
                      {pillar.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-ash md:text-sm">{pillar.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* THREE SPACES — hard data boundaries, made visible */}
        <section className="chapter scene-orbit py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal>
              <p className="mb-3 font-mono text-xs text-ash">
                » THREE SPACES — NOTHING CROSSES BY ACCIDENT
              </p>
              <h2 className="heading-display mb-4 text-2xl text-gold md:text-4xl">
                Your data lives in <span className="text-mercury">separate rooms.</span>
              </h2>
              <p className="mb-10 max-w-2xl text-sm leading-relaxed text-ash md:text-base">
                The most common way platforms leak is by blending contexts. Antidosis keeps your
                personal profile, your business listing and your private documents in three
                hard-separated spaces — each with its own rules about what can be seen.
              </p>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
              {SPACES.map((space, index) => (
                <Reveal key={space.title} delay={index * 100}>
                  <div
                    className="vessel h-full rounded-xl p-4 md:p-7"
                    style={{ borderColor: `${space.accent}26` }}
                  >
                    <space.icon
                      className="mb-3 h-5 w-5 md:mb-4 md:h-6 md:w-6"
                      style={{ color: space.accent }}
                    />
                    <h3 className="heading-display mb-1.5 text-base text-gold md:mb-2 md:text-xl">
                      {space.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-ash md:text-sm">{space.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CHECKLIST — the judgement only you can bring */}
        <section className="chapter scene-ledger py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal>
              <div className="mb-3 flex items-center gap-3">
                <Handshake className="h-4 w-4 text-sun" />
                <p className="font-mono text-xs text-ash">» FIELD PROTOCOL — SIX HABITS</p>
              </div>
              <h2 className="heading-display mb-4 text-2xl text-gold md:text-4xl">
                The member&apos;s <span className="text-sun">checklist.</span>
              </h2>
              <p className="mb-10 max-w-2xl text-sm leading-relaxed text-ash md:text-base">
                The platform does the structural work — you bring the judgement. Six habits that
                keep every exchange clean.
              </p>
            </Reveal>
            <ol className="grid grid-cols-2 gap-3 md:gap-4">
              {PRACTICES.map((practice, index) => (
                <Reveal key={practice} delay={index * 60}>
                  <li className="vessel flex h-full items-start gap-3 rounded-xl p-3 sm:p-5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sun/40 bg-sun/10 font-mono text-[11px] text-sun">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-relaxed text-parchment sm:text-sm">
                      {practice}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* REPORT — the loop closes with a human */}
        <section className="chapter scene-target py-16 md:py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <Reveal>
              <p className="mb-3 font-mono text-xs text-ash">◉ THE LOOP CLOSES WITH A HUMAN</p>
              <h2 className="heading-display mb-6 text-3xl text-gold md:text-5xl">
                Something wrong?
                <br />
                <span className="text-ok">Report it.</span>
              </h2>
              <p className="mb-10 max-w-xl text-base leading-relaxed text-ash">
                Every need, profile and message has a report action. You&apos;ll see the outcome in
                your dashboard — and good reports build your own standing in the network.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    Join the network <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/how-it-works">How it works</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/terms">Read the terms</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
