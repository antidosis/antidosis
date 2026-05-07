"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { BootSequence } from "@/components/effects/boot-sequence";
import { ScanLines } from "@/components/effects/scanlines";
import { ParticleField } from "@/components/effects/particle-field";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { ExchangeIllustration } from "@/components/visuals/exchange-illustration";
import { IdentityIllustration } from "@/components/visuals/identity-illustration";
import { ContractIllustration } from "@/components/visuals/contract-illustration";
import { ReputationIllustration } from "@/components/visuals/reputation-illustration";
import { PostIllustration } from "@/components/visuals/post-illustration";
import { ReceiveIllustration } from "@/components/visuals/receive-illustration";
import { HandshakeIllustration } from "@/components/visuals/handshake-illustration";
import { TickerBanner } from "@/components/layout/ticker-banner";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck, Star, MessageSquare, Zap, ScrollText } from "lucide-react";

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

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    const bootedBefore = sessionStorage.getItem("antidosis-booted");
    if (bootedBefore) {
      setHasBooted(true);
      setBooted(true);
    }
  }, []);

  function handleBootComplete() {
    sessionStorage.setItem("antidosis-booted", "true");
    setBooted(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col relative">
      <ScanLines />
      {!hasBooted && <BootSequence onComplete={handleBootComplete} />}
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
          <ParticleField />
          <div className="relative max-w-6xl mx-auto px-4 md:px-8">
            <div
              className={`transition-all duration-700 ${
                booted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-xs text-[#7a6b5a] mb-8 font-mono">
                    $ cat /etc/antidosis/motd
                  </p>
                  <h1 className="heading-display text-5xl md:text-7xl text-[#e8d5a3] mb-8">
                    exchange
                    <br />
                    <span className="text-[#f5a623]">everything.</span>
                    <TerminalCursor />
                  </h1>
                  <p className="text-base text-[#7a6b5a] max-w-md leading-relaxed mb-6">
                    A marketplace for reciprocal exchange. Post what you need.
                    Say what you&apos;ll give back. Connect with people you can
                    trust.
                  </p>
                  <p className="text-sm text-[#7a6b5a]/70 max-w-md leading-relaxed mb-10">
                    Contracts are optional — use them when you want binding
                    terms, skip them when you don&apos;t. No middlemen. No hidden
                    fees.
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
                <div className="hidden md:flex justify-center items-center">
                  <ExchangeIllustration className="w-full max-w-[320px] text-[#e8d5a3] opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <TickerBanner />

        <div className="divider" />

        {/* HOW IT WORKS — 3 Steps */}
        <section className="py-20 md:py-28 border-t border-[#2a2420]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-[#7a6b5a] mb-12 font-mono">
                $ cat docs/quickstart.md
              </p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8">
              <Reveal delay={0}>
                <StepCard
                  num="01"
                  title="Post What You Need"
                  desc="Describe a service, item, or task. Set what you're offering in return."
                  illustration={
                    <PostIllustration className="w-24 h-24 text-[#f5a623] opacity-60" />
                  }
                />
              </Reveal>
              <Reveal delay={150}>
                <StepCard
                  num="02"
                  title="Review Interested Responses"
                  desc="Browse profiles, ratings, and skills before choosing who to work with."
                  illustration={
                    <ReceiveIllustration className="w-24 h-24 text-[#00e5ff] opacity-60" />
                  }
                />
              </Reveal>
              <Reveal delay={300}>
                <StepCard
                  num="03"
                  title="Exchange & Review"
                  desc="Complete the work. Leave a bilateral review. Build your reputation."
                  illustration={
                    <HandshakeIllustration className="w-24 h-24 text-[#b24bf5] opacity-60" />
                  }
                />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* FEATURES */}
        <section>
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
            <Reveal>
              <p className="text-xs text-[#7a6b5a] mb-4 font-mono">$ ls features/</p>
            </Reveal>
          </div>

          {/* 01 — Verified Identities — Gold */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#f5a623]/15">
                    01
                  </span>
                </div>
                <div className="md:col-span-6">
                  <Reveal>
                    <h3 className="heading-display text-xl md:text-2xl text-[#f5a623] mb-3">
                      Verified Identities
                    </h3>
                    <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                      Email verification, social proof, skill credentials. Know
                      who you&apos;re dealing with before you commit.
                    </p>
                  </Reveal>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <Reveal delay={150}>
                    <IdentityIllustration className="w-40 h-40 text-[#f5a623] opacity-70" />
                  </Reveal>
                </div>
              </div>
            </div>
          </div>

          {/* 02 — Optional Contracts — Cyan */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#00e5ff]/15">
                    02
                  </span>
                </div>
                <div className="md:col-span-6">
                  <Reveal>
                    <h3 className="heading-display text-xl md:text-2xl text-[#00e5ff] mb-3">
                      Optional Contracts
                    </h3>
                    <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                      Use binding contracts for security, or exchange freely
                      with a handshake agreement. You choose what fits.
                    </p>
                  </Reveal>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <Reveal delay={150}>
                    <ContractIllustration className="w-40 h-40 text-[#00e5ff] opacity-70" />
                  </Reveal>
                </div>
              </div>
            </div>
          </div>

          {/* 03 — Reputation Engine — Violet */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#b24bf5]/15">
                    03
                  </span>
                </div>
                <div className="md:col-span-6">
                  <Reveal>
                    <h3 className="heading-display text-xl md:text-2xl text-[#b24bf5] mb-3">
                      Reputation Engine
                    </h3>
                    <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                      Bilateral 1-10 reviews with default excellence. Your
                      history becomes your passport. Every exchange builds
                      trust.
                    </p>
                  </Reveal>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <Reveal delay={150}>
                    <ReputationIllustration className="w-40 h-40 text-[#b24bf5] opacity-70" />
                  </Reveal>
                </div>
              </div>
            </div>
          </div>

          {/* 04 — Built-in Messaging — Gold again */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#f5a623]/15">
                    04
                  </span>
                </div>
                <div className="md:col-span-6">
                  <Reveal>
                    <h3 className="heading-display text-xl md:text-2xl text-[#f5a623] mb-3">
                      Built-in Messaging
                    </h3>
                    <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                      Negotiate inside every exchange. No external apps needed.
                      Full message history stays with the contract.
                    </p>
                  </Reveal>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <Reveal delay={150}>
                    <MessageSquare className="w-32 h-32 text-[#f5a623] opacity-40" />
                  </Reveal>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* TRUST PILLARS */}
        <section className="py-20 md:py-28 border-t border-[#2a2420]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-[#7a6b5a] mb-8 font-mono">
                $ cat docs/pillars.md
              </p>
              <h2 className="heading-display text-3xl md:text-4xl text-[#e8d5a3] mb-12">
                Built for <span className="text-[#00e676]">Trust.</span>
              </h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Reveal delay={0}>
                <PillarCard
                  icon={ShieldCheck}
                  title="Verified"
                  desc="Multi-layer identity verification"
                  color="#00e676"
                />
              </Reveal>
              <Reveal delay={100}>
                <PillarCard
                  icon={Star}
                  title="Rated"
                  desc="Bilateral reviews with every exchange"
                  color="#f5a623"
                />
              </Reveal>
              <Reveal delay={200}>
                <PillarCard
                  icon={MessageSquare}
                  title="Transparent"
                  desc="All negotiation in one thread"
                  color="#00e5ff"
                />
              </Reveal>
              <Reveal delay={300}>
                <PillarCard
                  icon={ScrollText}
                  title="Protected"
                  desc="Optional binding contracts"
                  color="#b24bf5"
                />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28 border-t border-[#2a2420]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ./join_network.sh</p>
              <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">
                Start Building
                <br />
                <span className="text-[#f5a623]">Your Reputation.</span>
              </h2>
              <p className="text-base text-[#7a6b5a] max-w-md mb-10 leading-relaxed">
                Join the Central Coast trial. Verify your identity, get Pro for
                free, and help shape the future of exchange.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/needs">Browse Needs</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/demo/contract-flow">
                    Try Contract Demo <ArrowRight className="ml-2 h-4 w-4" />
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
    <div className="bg-[#12100e] border border-[#2a2420] p-8 hover:border-[#f5a623]/30 transition-colors group">
      <div className="flex items-center justify-between mb-6">
        <span className="text-4xl font-bold text-[#7a6b5a]">{num}</span>
        {illustration}
      </div>
      <h3 className="heading-display text-xl md:text-2xl mb-3">{title}</h3>
      <p className="text-sm text-[#7a6b5a] leading-relaxed">{desc}</p>
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
      className="vessel p-6 group hover:scale-[1.02] transition-transform duration-300"
      style={{ borderColor: `${color}15` }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center mb-4"
        style={{ background: `${color}10`, border: `1px solid ${color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-sm font-medium text-[#e8d5a3] mb-1">{title}</p>
      <p className="text-xs text-[#7a6b5a]">{desc}</p>
    </div>
  );
}
