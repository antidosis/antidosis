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
        <p className="text-sm text-[#7a6b5a] leading-relaxed mb-6">{desc}</p>
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
              <p className="text-sm text-[#b8a078]">{item}</p>
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
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO */}
        <section className="pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ cat docs/how-it-works.md</p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="heading-display text-5xl md:text-7xl text-[#e8d5a3] mb-6">
                Exchange,
                <br />
                <span className="text-[#f5a623]">Simplified.</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-base text-[#7a6b5a] max-w-lg leading-relaxed mb-10">
                Post what you need. Offer what you have. Connect with people you can trust.
                Contracts are optional — use them when you want extra security.
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
                  <Link href="/demo/contract-flow">
                    See Contract Demo <ArrowRight className="ml-2 h-4 w-4" />
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
                <GitFork className="h-4 w-4 text-[#b24bf5]" />
                <p className="text-xs text-[#7a6b5a] font-mono">$ ls paths/</p>
              </div>
              <h2 className="heading-display text-3xl md:text-4xl text-[#e8d5a3] mb-4">
                Two Ways to Exchange
              </h2>
              <p className="text-sm text-[#7a6b5a] max-w-md mb-14">
                Every need can be fulfilled with or without a binding contract. Choose what feels
                right for the exchange.
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
                  color="#00e5ff"
                  accent="#00e5ff"
                />
              </Reveal>
              <Reveal delay={300}>
                <PathCard
                  icon={ScrollText}
                  title="Binding Contract"
                  desc="For higher-stakes or new connections. Negotiate terms, sign digitally, and track fulfillment with a formal agreement."
                  items={[
                    "Both parties write their terms",
                    "Review, accept, and lock terms",
                    "Digitally sign the generated contract",
                    "Mark complete and review",
                  ]}
                  color="#f5a623"
                  accent="#f5a623"
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
              <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ cat docs/journey.md</p>
              <h2 className="heading-display text-3xl md:text-4xl text-[#e8d5a3] mb-4">
                The Journey
              </h2>
              <p className="text-sm text-[#7a6b5a] max-w-md mb-16">
                From account creation to review. Three phases. Ten minutes to start.
              </p>
            </Reveal>

            {/* Phase 1: Setup */}
            <Reveal delay={100}>
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-[#2a2420]" />
                  <span className="text-xs font-mono text-[#7a6b5a]">PHASE 01 — SETUP</span>
                  <div className="h-px flex-1 bg-[#2a2420]" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <JourneyStep icon={UserPlus} title="Create Account" color="#f5a623" delay={0} />
                  <JourneyStep
                    icon={ShieldCheck}
                    title="Get Verified"
                    color="#00e5ff"
                    delay={100}
                  />
                  <JourneyStep icon={FileText} title="Post a Need" color="#f5a623" delay={200} />
                  <JourneyStep
                    icon={PenTool}
                    title="Optional Contract"
                    color="#b24bf5"
                    delay={300}
                  />
                </div>
              </div>
            </Reveal>

            {/* Phase 2: Connect */}
            <Reveal delay={100}>
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-[#2a2420]" />
                  <span className="text-xs font-mono text-[#7a6b5a]">PHASE 02 — CONNECT</span>
                  <div className="h-px flex-1 bg-[#2a2420]" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <JourneyStep icon={Search} title="Browse & Find" color="#00e5ff" delay={0} />
                  <JourneyStep icon={Hand} title="Express Interest" color="#00e5ff" delay={100} />
                  <JourneyStep icon={MessageSquare} title="Message" color="#b24bf5" delay={200} />
                  <JourneyStep icon={CheckCircle} title="Accept" color="#f5a623" delay={300} />
                </div>
              </div>
            </Reveal>

            {/* Phase 3: Complete */}
            <Reveal delay={100}>
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px flex-1 bg-[#2a2420]" />
                  <span className="text-xs font-mono text-[#7a6b5a]">PHASE 03 — COMPLETE</span>
                  <div className="h-px flex-1 bg-[#2a2420]" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <JourneyStep icon={Package} title="Do the Exchange" color="#e8d5a3" delay={0} />
                  <JourneyStep
                    icon={CheckCircle}
                    title="Mark Complete"
                    color="#00e676"
                    delay={100}
                  />
                  <JourneyStep icon={Star} title="Rate 1-10" color="#f5a623" delay={200} />
                  <JourneyStep
                    icon={ShieldCheck}
                    title="Build Reputation"
                    color="#00e5ff"
                    delay={300}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <div className="divider" />

        {/* TRUST BY DESIGN */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <Reveal>
                  <p className="text-xs text-[#7a6b5a] mb-6 font-mono">$ cat docs/trust.md</p>
                  <h2 className="heading-display text-3xl md:text-4xl text-[#e8d5a3] mb-6">
                    Trust by
                    <br />
                    <span className="text-[#00e676]">Design.</span>
                  </h2>
                </Reveal>
                <Reveal delay={150}>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-[#00e676]/10 border border-[#00e676]/20">
                        <ShieldCheck className="h-4 w-4 text-[#00e676]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e8d5a3] mb-1">
                          Verified Identities
                        </p>
                        <p className="text-xs text-[#7a6b5a]">
                          Email, mobile, and credential verification. Know who you&apos;re dealing
                          with.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-[#f5a623]/10 border border-[#f5a623]/20">
                        <Star className="h-4 w-4 text-[#f5a623]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e8d5a3] mb-1">Bilateral Reviews</p>
                        <p className="text-xs text-[#7a6b5a]">
                          Both parties rate each other 1-10. Default is excellence — you consciously
                          mark down.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-[#00e5ff]/10 border border-[#00e5ff]/20">
                        <MessageSquare className="h-4 w-4 text-[#00e5ff]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e8d5a3] mb-1">
                          Built-in Messaging
                        </p>
                        <p className="text-xs text-[#7a6b5a]">
                          No external apps. Every exchange has its own message thread with full
                          history.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-[#b24bf5]/10 border border-[#b24bf5]/20">
                        <ScrollText className="h-4 w-4 text-[#b24bf5]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e8d5a3] mb-1">
                          Optional Contracts
                        </p>
                        <p className="text-xs text-[#7a6b5a]">
                          Use binding contracts when you want formal terms. Skip them when you
                          don&apos;t.
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
              <Reveal delay={200} className="flex justify-center">
                <div className="relative w-72 h-72 md:w-80 md:h-80">
                  {/* Orbital reputation rings */}
                  <div className="absolute inset-0 rounded-full border border-[#2a2420]" />
                  <div className="absolute inset-4 rounded-full border border-[#2a2420]" />
                  <div className="absolute inset-8 rounded-full border border-[#f5a623]/20" />
                  <div className="absolute inset-12 rounded-full border border-[#00e5ff]/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Star className="h-10 w-10 text-[#f5a623] mx-auto mb-2" />
                      <p className="heading-display text-3xl text-[#e8d5a3]">10</p>
                      <p className="text-xs text-[#7a6b5a] mt-1">default rating</p>
                    </div>
                  </div>
                  {/* Orbiting dots */}
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "20s" }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#f5a623]" />
                  </div>
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "30s", animationDirection: "reverse" }}
                  >
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                  </div>
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "25s" }}
                  >
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#b24bf5]" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Reveal>
              <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ./join_network.sh</p>
              <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">
                Ready to
                <br />
                <span className="text-[#f5a623]">Start?</span>
              </h2>
              <p className="text-base text-[#7a6b5a] max-w-md mb-10 leading-relaxed">
                Join the Central Coast trial. Verify your identity, get Pro for free, and help shape
                the future of exchange.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/needs">Browse Needs</Link>
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
