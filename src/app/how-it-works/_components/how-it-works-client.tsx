"use client";

import Link from "next/link";

import {
  UserPlus,
  ShieldCheck,
  FileText,
  Search,
  Hand,
  MessageSquare,
  CheckCircle,
  Star,
  Zap,
  ScrollText,
  PenTool,
  ArrowRight,
  GitFork,
  Package,
  Megaphone,
  Camera,
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

function PathCard({
  icon: Icon,
  title,
  desc,
  items,
  color,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  items: string[];
  color: string;
  accent: string;
}) {
  return (
    <div
      className="relative vessel p-8 md:p-10 overflow-hidden group"
      style={{ borderColor: `${accent}20` }}
    >
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: accent }}
      />
      <div className="relative">
        <div
          className="w-14 h-14 flex items-center justify-center mb-6"
          style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}
        >
          <Icon className="h-6 w-6" style={{ color: accent }} />
        </div>
        <h3 className="heading-display text-2xl mb-3" style={{ color }}>
          {title}
        </h3>
        <p className="text-sm text-ash leading-relaxed mb-6">{desc}</p>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}
              >
                <span className="text-[10px] font-mono" style={{ color: accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm text-parchment">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyStep({
  icon: Icon,
  title,
  color,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="flex flex-col items-center text-center">
      <div
        className="w-16 h-16 flex items-center justify-center mb-4"
        style={{ background: `${color}10`, border: `1px solid ${color}25` }}
      >
        <Icon className="h-7 w-7" style={{ color }} />
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {title}
      </p>
    </Reveal>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-void text-gold flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO */}
        <section className="pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-8 font-mono">◉ ON AIR — HOW THE NETWORK WORKS</p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="heading-display text-5xl md:text-7xl text-gold mb-6">
                Exchange,
                <br />
                <span className="text-sun">Simplified.</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-base text-ash max-w-lg leading-relaxed mb-10">
                Post what you need. Offer what you have. Connect with people you can trust.
                Contracts are optional — use them when you want extra security. One network, every
                node a neighbour.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/needs/new">Post a Need</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/needs">Browse Needs</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/demo">
                    See Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* TWO PATHS */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <div className="flex items-center gap-3 mb-4">
                <GitFork className="h-4 w-4 text-quint" />
                <p className="text-xs text-ash font-mono">» TWO CHANNELS — PICK ONE</p>
              </div>
              <h2 className="heading-display text-3xl md:text-4xl text-gold mb-4">
                Two Ways to Exchange
              </h2>
              <p className="text-sm text-ash max-w-md mb-14">
                Every need can be fulfilled with or without a signed written agreement. Choose what
                feels right for the exchange.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              <Reveal delay={150}>
                <PathCard
                  icon={Zap}
                  title="Free Form"
                  desc="For trusted connections and low-stakes exchanges. No paperwork. Just a handshake agreement and built-in messaging."
                  items={[
                    "Poster accepts your interest",
                    "Message to coordinate details",
                    "Complete and leave a review",
                  ]}
                  color="var(--x-00e5ff)"
                  accent="var(--x-00e5ff)"
                />
              </Reveal>
              <Reveal delay={300}>
                <PathCard
                  icon={ScrollText}
                  title="Written Agreement"
                  desc="For higher-stakes or new connections. Negotiate terms, sign digitally, and keep a formal record of what both parties agreed."
                  items={[
                    "Both parties write their terms",
                    "Review, accept, and lock terms",
                    "Digitally sign the generated contract",
                    "Mark complete and review",
                  ]}
                  color="var(--x-f5a623)"
                  accent="var(--x-f5a623)"
                />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* THE JOURNEY */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-8 font-mono">» TRANSMISSION SEQUENCE</p>
              <h2 className="heading-display text-3xl md:text-4xl text-gold mb-4">The Journey</h2>
              <p className="text-sm text-ash max-w-md mb-16">
                From account creation to review. Three phases. Registration and mobile setup usually
                take minutes; identity and credential reviews require manual approval.
              </p>
            </Reveal>

            {/* Phase 1: Setup */}
            <Reveal delay={100}>
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-line" />
                  <span className="text-xs font-mono text-ash">PHASE 01 — SETUP</span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <JourneyStep
                    icon={UserPlus}
                    title="Create Account"
                    color="var(--x-f5a623)"
                    delay={0}
                  />
                  <JourneyStep
                    icon={ShieldCheck}
                    title="Get Verified"
                    color="var(--x-00e5ff)"
                    delay={100}
                  />
                  <JourneyStep
                    icon={FileText}
                    title="Post a Need"
                    color="var(--x-f5a623)"
                    delay={200}
                  />
                </div>
              </div>
            </Reveal>

            {/* Phase 2: Connect */}
            <Reveal delay={100}>
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-line" />
                  <span className="text-xs font-mono text-ash">PHASE 02 — CONNECT</span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                  <JourneyStep
                    icon={Search}
                    title="Browse & Find"
                    color="var(--x-00e5ff)"
                    delay={0}
                  />
                  <JourneyStep
                    icon={Hand}
                    title="Express Interest"
                    color="var(--x-00e5ff)"
                    delay={100}
                  />
                  <JourneyStep
                    icon={MessageSquare}
                    title="Message"
                    color="var(--x-b24bf5)"
                    delay={200}
                  />
                  <JourneyStep
                    icon={CheckCircle}
                    title="Accept"
                    color="var(--x-f5a623)"
                    delay={300}
                  />
                  <JourneyStep
                    icon={PenTool}
                    title="Optional Agreement"
                    color="var(--x-b24bf5)"
                    delay={400}
                  />
                </div>
              </div>
            </Reveal>

            {/* Phase 3: Complete */}
            <Reveal delay={100}>
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-line" />
                  <span className="text-xs font-mono text-ash">PHASE 03 — COMPLETE</span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <JourneyStep
                    icon={Package}
                    title="Do the Exchange"
                    color="var(--x-e8d5a3)"
                    delay={0}
                  />
                  <JourneyStep
                    icon={CheckCircle}
                    title="Mark Complete"
                    color="var(--x-00e676)"
                    delay={100}
                  />
                  <JourneyStep icon={Star} title="Rate 1-10" color="var(--x-f5a623)" delay={200} />
                  <JourneyStep
                    icon={ShieldCheck}
                    title="Build Reputation"
                    color="var(--x-00e5ff)"
                    delay={300}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* TRUST BY DESIGN */}
        <section className="section-plateau py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <Reveal>
                  <p className="text-xs text-ash mb-6 font-mono">» TRUST PROTOCOL</p>
                  <h2 className="heading-display text-3xl md:text-4xl text-gold mb-6">
                    Trust by
                    <br />
                    <span className="text-ok">Design.</span>
                  </h2>
                </Reveal>
                <Reveal delay={150}>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-ok/10 border border-ok/20">
                        <ShieldCheck className="h-4 w-4 text-ok" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gold mb-1">Verified Identities</p>
                        <p className="text-xs text-ash">
                          Confirmed email, verified mobile, and reviewed identity documents.
                          Professional credentials are shown separately.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-sun/10 border border-sun/20">
                        <Star className="h-4 w-4 text-sun" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gold mb-1">Bilateral Reviews</p>
                        <p className="text-xs text-ash">
                          Both parties rate each other 1-10. Default is excellence — you consciously
                          mark down.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-mercury/10 border border-mercury/20">
                        <MessageSquare className="h-4 w-4 text-mercury" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gold mb-1">Built-in Messaging</p>
                        <p className="text-xs text-ash">
                          No external apps. Every exchange has its own message thread with full
                          history.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-quint/10 border border-quint/20">
                        <ScrollText className="h-4 w-4 text-quint" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gold mb-1">Optional Contracts</p>
                        <p className="text-xs text-ash">
                          Use a signed written agreement when you want formal terms. Skip it when
                          you don&apos;t.
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
              <Reveal delay={200} className="flex justify-center">
                <div className="relative w-72 h-72 md:w-80 md:h-80">
                  {/* Orbital reputation rings */}
                  <div className="absolute inset-0 rounded-full border border-line" />
                  <div className="absolute inset-4 rounded-full border border-line" />
                  <div className="absolute inset-8 rounded-full border border-sun/20" />
                  <div className="absolute inset-12 rounded-full border border-mercury/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Star className="h-10 w-10 text-sun mx-auto mb-2" />
                      <p className="heading-display text-3xl text-gold">10</p>
                      <p className="text-xs text-ash mt-1">default rating</p>
                    </div>
                  </div>
                  {/* Orbiting dots */}
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "20s" }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sun" />
                  </div>
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "30s", animationDirection: "reverse" }}
                  >
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-mercury" />
                  </div>
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "25s" }}
                  >
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-quint" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* BUSINESS DESK */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-6 font-mono">
                » TRADE DESK — BUSINESSES ON THE NETWORK
              </p>
              <h2 className="heading-display text-3xl md:text-4xl text-gold mb-4">
                Run Local Jobs on the
                <br />
                <span className="text-sun">Same Rails.</span>
              </h2>
              <p className="text-sm text-ash leading-relaxed max-w-2xl mb-10">
                A tradie, a cafe, a tutoring service — any verified member can flip their account to
                a business account. Everything works exactly the same, with three additions:
              </p>
            </Reveal>
            <Reveal delay={150}>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="vessel p-6">
                  <ShieldCheck className="h-5 w-5 text-ok mb-3" />
                  <p className="text-sm font-medium text-gold mb-2">ABN on the record</p>
                  <p className="text-xs text-ash leading-relaxed">
                    Add your ABN once. It is validated, shown with a business badge in the
                    directory, and never displayed for personal accounts.
                  </p>
                </div>
                <div className="vessel p-6">
                  <FileText className="h-5 w-5 text-sun mb-3" />
                  <p className="text-sm font-medium text-gold mb-2">Business contracts</p>
                  <p className="text-xs text-ash leading-relaxed">
                    The same negotiation, signing, and PDF flow — with your legal name and ABN on
                    the contract document.
                  </p>
                </div>
                <div className="vessel p-6">
                  <Star className="h-5 w-5 text-mercury mb-3" />
                  <p className="text-sm font-medium text-gold mb-2">Reviews that count</p>
                  <p className="text-xs text-ash leading-relaxed">
                    Every completed job feeds the same reputation system. Payment terms are recorded
                    in the contract; money moves directly between the parties — never through
                    antidosis.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* CREATOR DESK */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-6 font-mono">
                ◈ CREATOR DESK — INFLUENCERS &amp; REVIEWERS
              </p>
              <h2 className="heading-display text-3xl md:text-4xl text-gold mb-4">
                Your Audience Is
                <br />
                <span className="text-orchid">An Exchange.</span>
              </h2>
              <p className="text-sm text-ash leading-relaxed max-w-2xl mb-10">
                Food reviewers, local creators, and micro-influencers trade posts and reviews for
                meals, products, and paid gigs — the same rails as every other exchange:
              </p>
            </Reveal>
            <Reveal delay={150}>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="vessel p-6">
                  <Camera className="h-5 w-5 text-orchid mb-3" />
                  <p className="text-sm font-medium text-gold mb-2">Put your reach on the record</p>
                  <p className="text-xs text-ash leading-relaxed">
                    Add your audience size and social links to your profile. Businesses browsing the
                    directory can see exactly what a collab with you is worth.
                  </p>
                </div>
                <div className="vessel p-6">
                  <Megaphone className="h-5 w-5 text-sun mb-3" />
                  <p className="text-sm font-medium text-gold mb-2">Promo / Review needs</p>
                  <p className="text-xs text-ash leading-relaxed">
                    A dedicated exchange mode for promotion deals: a café trades a free meal for a
                    reel, a shop trades product for an honest review, a tradie pays cash for a
                    shout- out. Browse them like any other need.
                  </p>
                </div>
                <div className="vessel p-6">
                  <Star className="h-5 w-5 text-mercury mb-3" />
                  <p className="text-sm font-medium text-gold mb-2">Reputation that compounds</p>
                  <p className="text-xs text-ash leading-relaxed">
                    Every collab runs through the same contract flow with the exchange recorded in
                    the terms. Deliver, get reviewed, and your next deal is easier to land.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-8 font-mono">◉ TUNE IN</p>
              <h2 className="heading-display text-3xl md:text-5xl text-gold mb-6">
                Ready to
                <br />
                <span className="text-sun">Start?</span>
              </h2>
              <p className="text-base text-ash max-w-md mb-10 leading-relaxed">
                Join the Central Coast trial. Verify your identity, and help build a network that
                keeps working when everything else doesn&apos;t.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/needs">Browse Needs</Link>
                </Button>
              </div>
              <p className="mt-8 text-sm text-ash">
                For our team:{" "}
                <Link href="/brief" className="text-gold underline underline-offset-4">
                  read the Antidosis employee brief <ArrowRight className="inline h-3.5 w-3.5" />
                </Link>
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
