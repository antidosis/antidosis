"use client";

import { useState, useEffect } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import {
  ArrowRight,
  ShieldCheck,
  Star,
  MessageSquare,
  ScrollText,
  MapPin,
  Radio,
  Building2,
  FileText,
  Megaphone,
} from "lucide-react";

import { BootSequence } from "@/components/effects/boot-sequence";
import { SignalField } from "@/components/effects/signal-field";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { ExchangeExamples } from "@/components/exchange-examples";
import { LaunchCountdown, LaunchBanner } from "@/components/launch-countdown";
import { Navbar } from "@/components/layout/navbar";
import { TickerBanner } from "@/components/layout/ticker-banner";
import { LiveBadge } from "@/components/live-badge";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

import { DirectAgreementVisual } from "./direct-agreement-visual";
import { BusinessCardShowcase, CreatorReachShowcase } from "./network-visuals";
import { OffgridVision } from "./offgrid-vision";
import { ScenarioTeaser } from "./scenario-teaser";

// Lazy-load below-the-fold components to reduce initial JS bundle
const TerminalPreview = dynamic(() =>
  import("@/components/terminal-preview").then((mod) => ({ default: mod.TerminalPreview }))
);
const Footer = dynamic(() =>
  import("@/components/layout/footer").then((mod) => ({ default: mod.Footer }))
);
const NetworkMap = dynamic(() =>
  import("@/components/visuals/network-map").then((mod) => ({
    default: mod.NetworkMap,
  }))
);
const HandshakeIllustration = dynamic(() =>
  import("@/components/visuals/handshake-illustration").then((mod) => ({
    default: mod.HandshakeIllustration,
  }))
);
const PostIllustration = dynamic(() =>
  import("@/components/visuals/post-illustration").then((mod) => ({
    default: mod.PostIllustration,
  }))
);
const ReceiveIllustration = dynamic(() =>
  import("@/components/visuals/receive-illustration").then((mod) => ({
    default: mod.ReceiveIllustration,
  }))
);

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
        "reveal transition-all duration-700",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Identities",
    desc: "Confirmed email, verified mobile, and reviewed identity documents. Professional credentials are shown separately.",
    color: "var(--x-00e676)",
  },
  {
    icon: ScrollText,
    title: "Optional Contracts",
    desc: "A signed written record when the exchange is valuable. A handshake when it isn't. You choose.",
    color: "var(--x-00e5ff)",
  },
  {
    icon: Star,
    title: "Reputation Engine",
    desc: "Bilateral reviews after completed exchanges. Your history becomes your passport.",
    color: "var(--x-f5a623)",
  },
  {
    icon: MessageSquare,
    title: "Built-in Messaging",
    desc: "Negotiate in one thread. The full history stays attached to the exchange.",
    color: "var(--x-b24bf5)",
  },
  {
    icon: MapPin,
    title: "Local First",
    desc: "Trade with people nearby. Walk over with the lemons. Meet at the beach for the lesson.",
    color: "var(--x-00e5ff)",
  },
  {
    icon: Radio,
    title: "Built to Survive",
    desc: "Today the internet carries the signal. The design is ready for a future where it doesn't have to.",
    color: "var(--x-00e676)",
  },
];

export default function HomePage() {
  const [hasBooted, setHasBooted] = useState(false);
  const [showBoot, setShowBoot] = useState(true);

  useEffect(() => {
    const bootedBefore = sessionStorage.getItem("antidosis-booted");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (bootedBefore || reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time boot gate reading sessionStorage + reduced-motion before first paint
      setHasBooted(true);
      setShowBoot(false);
    }
  }, []);

  function handleBootComplete() {
    sessionStorage.setItem("antidosis-booted", "true");
    setShowBoot(false);
  }

  return (
    <div
      className={cn(
        "signal-journey min-h-screen bg-void text-gold flex flex-col relative",
        !hasBooted && "signal-journey-booting"
      )}
      data-signal-journey="home"
    >
      {hasBooted && <SignalField />}
      {showBoot && (
        <BootSequence onExitStart={() => setHasBooted(true)} onComplete={handleBootComplete} />
      )}
      <Navbar />
      <LaunchBanner />

      <main className="flex-1">
        {/* HERO */}
        <section
          data-signal-scene="hero"
          className="home-chapter home-hero relative overflow-hidden pb-16 pt-28 md:pb-28 md:pt-40"
        >
          <div className="relative max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <p className="text-xs text-ash mb-8 font-mono">
                  ◉ ON AIR — CHANNEL 01 · CENTRAL COAST
                </p>
                <h1 className="heading-display hero-title mb-6 text-4xl leading-[1.08] sm:text-5xl md:mb-8 md:text-7xl">
                  your neighbourhood,
                  <br />
                  <span className="text-sun">on the air.</span>
                  <TerminalCursor />
                </h1>
                <p className="text-base text-ash max-w-md leading-relaxed mb-4">
                  Antidosis is the exchange network. Post what you need. Say what you&apos;ll give
                  back. Connect with verified locals you can trust.
                </p>
                <p className="text-sm text-ash/90 max-w-md leading-relaxed mb-10">
                  Contracts optional. No commissions or hidden fees. Online today, with a long-term
                  vision for radio-mesh coordination during internet outages.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/needs">Browse Needs</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/needs/new">Post a Need</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="/how-it-works">
                      How It Works <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="home-hero-visual mt-10 md:mt-0">
                <div className="home-hero-visual-bar">
                  <span>
                    <i /> Exchange topology
                  </span>
                  <span>Illustrative network</span>
                </div>
                <NetworkMap className="h-[210px] w-full sm:h-[270px] md:h-[340px]" />
                <div className="home-hero-visual-footer">
                  <span>Needs</span>
                  <span>Skills</span>
                  <span>Trust</span>
                  <span>Reciprocity</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE SIGNALS — example exchanges first, concept second */}
        <section data-signal-scene="exchange" className="home-chapter home-exchange py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-3 font-mono">
                » EXAMPLE SIGNALS — WHAT YOU COULD EXCHANGE
              </p>
              <h2 className="heading-display text-2xl md:text-4xl text-gold mb-10">
                Your Need Is <span className="text-sun">Someone Else&apos;s Want.</span>
              </h2>
            </Reveal>
            <ExchangeExamples />
          </div>
        </section>

        <TickerBanner />

        {/* HOW IT WORKS — 3 Steps */}
        <section data-signal-scene="path" className="home-chapter home-path py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-12 font-mono">» SIGNAL PATH — THREE STEPS</p>
            </Reveal>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              <Reveal delay={0}>
                <StepCard
                  num="01"
                  title="Post What You Need"
                  desc="Describe a service, item, or task. Set what you're offering in return."
                  illustration={<PostIllustration className="w-24 h-24 text-sun opacity-60" />}
                />
              </Reveal>
              <Reveal delay={150}>
                <StepCard
                  num="02"
                  title="Review Interested Responses"
                  desc="Browse profiles, ratings, and skills before choosing who to work with."
                  illustration={
                    <ReceiveIllustration className="w-24 h-24 text-mercury opacity-60" />
                  }
                />
              </Reveal>
              <Reveal delay={300}>
                <StepCard
                  num="03"
                  title="Exchange & Review"
                  desc="Complete the work. Leave a bilateral review. Build your reputation."
                  illustration={
                    <HandshakeIllustration className="w-24 h-24 text-quint opacity-60" />
                  }
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* DIRECT AGREEMENTS — private contracts are a product, not an afterthought */}
        <section data-signal-scene="direct" className="home-chapter home-direct py-16 md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-8">
            <Reveal>
              <p className="mb-3 font-mono text-xs text-mercury">
                DIRECT AGREEMENTS — NO LISTING REQUIRED
              </p>
              <h2 className="heading-display text-3xl text-gold md:text-4xl">
                Already know who you&apos;re working with?
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-parchment">
                Skip the public marketplace. Create a private agreement, send one secure invitation,
                and make the scope, exchange and expectations clear before either of you signs.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ash">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-ok" /> Both parties contribute and accept the
                  terms
                </li>
                <li className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-sun" /> Messages, signatures and completion stay
                  together
                </li>
                <li className="flex items-center gap-2.5">
                  <Star className="h-4 w-4 text-sun" /> Completed agreements support genuine
                  bilateral reviews
                </li>
              </ul>
              <Button asChild className="mt-7">
                <Link href="/dashboard?tab=contracts">
                  Create a direct agreement <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-xs text-ash">Free. General-purpose tool, not legal advice.</p>
            </Reveal>
            <Reveal delay={150}>
              <DirectAgreementVisual />
            </Reveal>
          </div>
        </section>

        {/* FEATURES — one compact grid */}
        <section data-signal-scene="trust" className="home-chapter home-trust py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-8 font-mono">
                » CHANNEL LISTING — NETWORK FEATURES
              </p>
              <h2 className="heading-display text-3xl md:text-4xl text-gold mb-12">
                Built for <span className="text-ok">Trust.</span>
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 80}>
                  <PillarCard icon={f.icon} title={f.title} desc={f.desc} color={f.color} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY RELAY */}
        <section data-signal-scene="relay" className="home-chapter home-relay py-16 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <Reveal>
                <p className="text-xs text-ash mb-8 font-mono">◉ RELAY — COMMUNITY COMMS</p>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="heading-display text-2xl md:text-4xl text-gold">
                    Community <span className="text-mercury">Relay</span>
                  </h2>
                  <LiveBadge />
                </div>
                <p className="text-sm text-ash leading-relaxed max-w-md mb-6">
                  Real-time channels like #general, #trades, and #help. Message anyone directly with
                  /dm. Get notified when someone mentions you. The community stays on the air.
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/demo/terminal">
                    Watch the Relay demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Reveal>
              <Reveal delay={150}>
                <TerminalPreview />
              </Reveal>
            </div>
          </div>
        </section>

        {/* BUSINESSES + CREATORS — two audiences, the same trust rails */}
        <section
          data-signal-scene="communities"
          className="home-chapter home-communities py-16 md:py-24"
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-6 font-mono">» ONE NETWORK — EVERY KIND OF VALUE</p>
              <h2 className="heading-display text-3xl md:text-4xl text-gold mb-5">
                A place for business. <span className="text-orchid">A place for influence.</span>
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-ash md:text-base">
                Different people bring different value. The directory, messaging, agreements and
                reputation system give both a common, trusted foundation.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <Reveal>
                <PathwayCard
                  icon={Building2}
                  eyebrow="For businesses"
                  title="Local business, verified."
                  description="Post tasks, find skilled locals and build a public record of reliable work."
                  visual={<BusinessCardShowcase />}
                  points={[
                    "Business profile with ABN and chosen trust credentials",
                    "Tasks, jobs and direct agreements on the same exchange flow",
                    "Free to join and post; featured placement is a future option",
                  ]}
                  href="/pros"
                  linkLabel="Explore the business directory"
                  className="border-sun/25 bg-sun/[0.025]"
                  iconClass="text-sun"
                />
              </Reveal>
              <Reveal delay={140}>
                <PathwayCard
                  icon={Megaphone}
                  eyebrow="For creators & reviewers"
                  title="Your reach is an exchange."
                  description="Share your audience, find local collaborations and build a reputation for delivering what you promise."
                  visual={<CreatorReachShowcase />}
                  points={[
                    "Audience size, social links and niche skills in one profile",
                    "Products, meals, experiences or payment for genuine content",
                    "Clear terms and honest disclosure for sponsored exchanges",
                  ]}
                  href="/needs"
                  linkLabel="Find promo and review exchanges"
                  className="border-orchid/25 bg-orchid/[0.025]"
                  iconClass="text-orchid"
                />
              </Reveal>
            </div>
            <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ash">
              Payments and sponsored benefits are arranged directly between the parties; Antidosis
              never holds funds. Sponsored content must be disclosed under Australian consumer law.
            </p>
          </div>
        </section>

        <LaunchCountdown />

        <OffgridVision />

        {/* FIELD STORY — the off-grid vision you can actually watch */}
        <ScenarioTeaser />

        {/* CTA */}
        <section
          data-signal-scene="join"
          className="home-chapter home-join overflow-hidden py-20 md:py-32"
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-8 font-mono">◉ JOIN THE NETWORK</p>
              <h2 className="heading-display text-3xl md:text-5xl text-gold mb-6">
                Start Building
                <br />
                <span className="text-sun">Your Reputation.</span>
              </h2>
              <p className="text-base text-ash max-w-md mb-10 leading-relaxed">
                Join the Central Coast trial. Verify your identity, strengthen local exchange, and
                help build the path to off-grid coordination.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/needs">Browse Needs</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/demo">
                    Try Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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

function StepCard({
  num,
  title,
  desc,
  illustration,
}: {
  num: string;
  title: string;
  desc: string;
  illustration: React.ReactNode;
}) {
  return (
    <div className="group h-full rounded-lg border border-line bg-surface p-3 transition-colors hover:border-sun/30 sm:p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-1 sm:mb-5">
        <span className="text-xl font-bold text-ash sm:text-2xl md:text-3xl">{num}</span>
        <div className="[&>svg]:h-10 [&>svg]:w-10 sm:[&>svg]:h-14 sm:[&>svg]:w-14 md:[&>svg]:h-20 md:[&>svg]:w-20">
          {illustration}
        </div>
      </div>
      <h3 className="heading-display mb-2 text-sm leading-tight sm:text-lg md:mb-3 md:text-xl">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-ash sm:text-sm">{desc}</p>
    </div>
  );
}

function PathwayCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  points,
  href,
  linkLabel,
  className,
  iconClass,
  visual,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  href: string;
  linkLabel: string;
  className: string;
  iconClass: string;
  visual?: React.ReactNode;
}) {
  return (
    <div className={cn("vessel flex h-full flex-col rounded-xl p-6 sm:p-8", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ash">{eyebrow}</p>
        <Icon className={cn("h-6 w-6", iconClass)} />
      </div>
      {visual && <div className="mt-5">{visual}</div>}
      <h3 className="heading-display mt-7 text-2xl text-gold md:text-3xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ash">{description}</p>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2.5 text-sm leading-relaxed text-parchment"
          >
            <ShieldCheck className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant="secondary" size="sm" className="mt-7 w-fit">
        <Link href={href}>
          {linkLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function PillarCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div
      className="vessel p-4 md:p-6 group hover:scale-[1.02] transition-transform duration-300 h-full"
      style={{ borderColor: `${color}15` }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center mb-4"
        style={{ background: `${color}10`, border: `1px solid ${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-sm font-medium text-gold mb-1">{title}</p>
      <p className="text-xs text-ash">{desc}</p>
    </div>
  );
}
