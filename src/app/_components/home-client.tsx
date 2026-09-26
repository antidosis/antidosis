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
} from "lucide-react";

import { BootSequence } from "@/components/effects/boot-sequence";
import { ParticleField } from "@/components/effects/particle-field";
import { ScanLines } from "@/components/effects/scanlines";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { ExchangeExamples } from "@/components/exchange-examples";
import { LaunchCountdown, LaunchBanner } from "@/components/launch-countdown";
import { Navbar } from "@/components/layout/navbar";
import { TickerBanner } from "@/components/layout/ticker-banner";
import { LiveBadge } from "@/components/live-badge";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

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

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Identities",
    desc: "Email, mobile, and credential checks. Know who you're dealing with before you commit.",
    color: "var(--x-00e676)",
  },
  {
    icon: ScrollText,
    title: "Optional Contracts",
    desc: "Binding terms when the exchange is valuable. A handshake when it isn't. You choose.",
    color: "var(--x-00e5ff)",
  },
  {
    icon: Star,
    title: "Reputation Engine",
    desc: "Bilateral reviews on every exchange. Your history becomes your passport.",
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

  useEffect(() => {
    const bootedBefore = sessionStorage.getItem("antidosis-booted");
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (bootedBefore || isMobile || reducedMotion) {
      setHasBooted(true);
    }
  }, []);

  function handleBootComplete() {
    sessionStorage.setItem("antidosis-booted", "true");
  }

  return (
    <div className="min-h-screen bg-void text-gold flex flex-col relative">
      <ScanLines />
      {!hasBooted && <BootSequence onComplete={handleBootComplete} />}
      <Navbar />
      <LaunchBanner />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
          <ParticleField />
          <div className="relative max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs text-ash mb-8 font-mono">
                  ◉ ON AIR — CHANNEL 01 · CENTRAL COAST
                </p>
                <h1 className="heading-display text-5xl md:text-7xl text-gold mb-8">
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
                  Contracts optional. No middlemen, no hidden fees. Built to keep working when the
                  internet doesn&apos;t.
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
              <div className="mt-10 md:mt-0">
                <NetworkMap className="w-full h-[220px] md:h-[340px]" />
              </div>
            </div>
          </div>
        </section>

        {/* LIVE SIGNALS — example exchanges first, concept second */}
        <section className="py-16 md:py-20 border-t border-line">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-3 font-mono">» LIVE SIGNALS — ON THE AIR</p>
              <h2 className="heading-display text-2xl md:text-4xl text-gold mb-10">
                Your Need Is <span className="text-sun">Someone Else&apos;s Want.</span>
              </h2>
            </Reveal>
            <ExchangeExamples />
          </div>
        </section>

        <LaunchCountdown />

        <TickerBanner />

        <div className="divider" />

        {/* HOW IT WORKS — 3 Steps */}
        <section className="py-20 md:py-28 border-t border-line">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-12 font-mono">» SIGNAL PATH — THREE STEPS</p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8">
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

        <div className="divider" />

        {/* FEATURES — one compact grid */}
        <section className="py-20 md:py-28 border-t border-line">
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

        <div className="divider" />

        {/* COMMUNITY RELAY */}
        <section className="py-20 md:py-28 border-t border-line">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
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
                  <Link href="/terminal">
                    Open Relay <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Reveal>
              <Reveal delay={150}>
                <TerminalPreview />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28 border-t border-line">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-ash mb-8 font-mono">◉ JOIN THE NETWORK</p>
              <h2 className="heading-display text-3xl md:text-5xl text-gold mb-6">
                Start Building
                <br />
                <span className="text-sun">Your Reputation.</span>
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
    <div className="bg-surface border border-line p-8 hover:border-sun/30 transition-colors group">
      <div className="flex items-center justify-between mb-6">
        <span className="text-4xl font-bold text-ash">{num}</span>
        {illustration}
      </div>
      <h3 className="heading-display text-xl md:text-2xl mb-3">{title}</h3>
      <p className="text-sm text-ash leading-relaxed">{desc}</p>
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
