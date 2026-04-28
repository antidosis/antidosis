"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { BootSequence } from "@/components/effects/boot-sequence";
import { ScanLines } from "@/components/effects/scanlines";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { ExchangeIllustration } from "@/components/visuals/exchange-illustration";
import { IdentityIllustration } from "@/components/visuals/identity-illustration";
import { ContractIllustration } from "@/components/visuals/contract-illustration";
import { ReputationIllustration } from "@/components/visuals/reputation-illustration";
import { MessageIllustration } from "@/components/visuals/message-illustration";
import { PostIllustration } from "@/components/visuals/post-illustration";
import { ReceiveIllustration } from "@/components/visuals/receive-illustration";
import { HandshakeIllustration } from "@/components/visuals/handshake-illustration";
import { TickerBanner } from "@/components/layout/ticker-banner";

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
        <section className="pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className={`transition-all duration-700 ${booted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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
                  <p className="text-base text-[#7a6b5a] max-w-md leading-relaxed mb-12">
                    A marketplace for reciprocal exchange. Post what you need. Say what you&apos;ll give back. Connect with people you can trust.
                    Service for service. Item for item. Cash for time. Or any mix. No middlemen. No hidden fees.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild size="lg">
                      <Link href="/needs">Browse Needs</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                      <Link href="/needs/new">Post a Need</Link>
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

        {/* FEATURES */}
        <section>
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
            <p className="text-xs text-[#7a6b5a] mb-4 font-mono">$ ls features/</p>
          </div>

          {/* 01 — Verified Identities — Gold */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#f5a623]/15">01</span>
                </div>
                <div className="md:col-span-6">
                  <h3 className="heading-display text-xl md:text-2xl text-[#f5a623] mb-3">
                    Verified Identities
                  </h3>
                  <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                    Email verification, social proof, skill credentials. Know who you&apos;re dealing with.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <IdentityIllustration className="w-40 h-40 text-[#f5a623] opacity-70" />
                </div>
              </div>
            </div>
          </div>

          {/* 02 — Binding Contracts — Cyan */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#00e5ff]/15">02</span>
                </div>
                <div className="md:col-span-6">
                  <h3 className="heading-display text-xl md:text-2xl text-[#00e5ff] mb-3">
                    Binding Contracts
                  </h3>
                  <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                    Terms negotiated, signed by both parties, tracked through fulfillment.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <ContractIllustration className="w-40 h-40 text-[#00e5ff] opacity-70" />
                </div>
              </div>
            </div>
          </div>

          {/* 03 — Reputation Engine — Violet */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#b24bf5]/15">03</span>
                </div>
                <div className="md:col-span-6">
                  <h3 className="heading-display text-xl md:text-2xl text-[#b24bf5] mb-3">
                    Reputation Engine
                  </h3>
                  <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                    Bilateral 1-10 reviews. Your history becomes your passport.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <ReputationIllustration className="w-40 h-40 text-[#b24bf5] opacity-70" />
                </div>
              </div>
            </div>
          </div>

          {/* 04 — Realtime Messaging — Gold again */}
          <div className="border-t border-[#2a2420]">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-2">
                  <span className="text-6xl md:text-7xl font-bold text-[#f5a623]/15">04</span>
                </div>
                <div className="md:col-span-6">
                  <h3 className="heading-display text-xl md:text-2xl text-[#f5a623] mb-3">
                    Realtime Messaging
                  </h3>
                  <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">
                    Negotiate inside every contract. No external apps needed.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <MessageIllustration className="w-40 h-40 text-[#f5a623] opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* HOW IT WORKS */}
        <section className="py-20 md:py-28 border-t border-[#2a2420]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-12 font-mono">$ cat docs/quickstart.md</p>
            <div className="grid md:grid-cols-3 gap-8">
              <StepCard
                num="01"
                title="Post What You Need"
                desc="Describe a service, item, or task. Set what you&apos;re offering in return."
                illustration={<PostIllustration className="w-24 h-24 text-[#f5a623] opacity-60" />}
              />
              <StepCard
                num="02"
                title="Review Interested Responses"
                desc="People with proven skills express interest. Browse their profiles, ratings, and history before you choose."
                illustration={<ReceiveIllustration className="w-24 h-24 text-[#00e5ff] opacity-60" />}
              />
              <StepCard
                num="03"
                title="Form a Binding Contract"
                desc="Agree on terms. Sign digitally. Complete. Review. Build trust."
                illustration={<HandshakeIllustration className="w-24 h-24 text-[#b24bf5] opacity-60" />}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-28 border-t border-[#2a2420]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ./join_network.sh</p>
            <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">
              Start Building
              <br />
              <span className="text-[#f5a623]">Your Reputation.</span>
            </h2>
            <p className="text-base text-[#7a6b5a] max-w-md mb-10 leading-relaxed">
              Join the first trial region. Verify your identity, get Pro for free, and help shape the future of exchange.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">Create Account</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/needs">Browse Needs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StepCard({ num, title, desc, illustration }: { num: string; title: string; desc: string; illustration: React.ReactNode }) {
  return (
    <div className="bg-[#12100e] border border-[#2a2420] p-8 hover:border-[#f5a623]/30 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <span className="text-4xl font-bold text-[#7a6b5a]">{num}</span>
        {illustration}
      </div>
      <h3 className="heading-display text-xl md:text-2xl mb-3">{title}</h3>
      <p className="text-sm text-[#7a6b5a] leading-relaxed">{desc}</p>
    </div>
  );
}
