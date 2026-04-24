"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BootSequence } from "@/components/effects/boot-sequence";
import { ScanLines } from "@/components/effects/scanlines";
import { TerminalCursor } from "@/components/effects/terminal-cursor";

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
    <div className="min-h-screen bg-[#0c0c0c] text-[#e8c97c] flex flex-col relative">
      <ScanLines />
      {!hasBooted && <BootSequence onComplete={handleBootComplete} />}
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          {/* HERO */}
          <section className="pt-32 pb-24 md:pt-40 md:pb-32">
            <div className={`transition-all duration-700 ${booted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <p className="text-[12px] text-[#7a6b4a] mb-8">
                $ cat /etc/antidosis/motd
              </p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-8 glow-text">
                exchange
                <br />
                <span className="text-[#f5b800]">everything.</span>
                <TerminalCursor />
              </h1>
              <p className="text-[15px] text-[#7a6b4a] max-w-md leading-relaxed mb-12">
                A marketplace for reciprocal exchange.
                Trade skills, items, and time with people you can trust.
                No middlemen. No bullshit.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/needs" className="btn-cmd-primary">
                  $ browse_needs
                </Link>
                <Link href="/needs/new" className="btn-cmd">
                  $ post_need
                </Link>
              </div>
            </div>
          </section>

          <div className="divider" />

          {/* FEATURES */}
          <section className="py-20 md:py-28">
            <p className="text-[12px] text-[#7a6b4a] mb-12">$ ls features/</p>
            <div className="space-y-12">
              <FeatureLine
                num="01"
                title="verified_identities"
                desc="Email verification, social proof, skill credentials. Know who you're dealing with."
              />
              <FeatureLine
                num="02"
                title="binding_contracts"
                desc="Terms negotiated, signed by both parties, tracked through fulfillment."
              />
              <FeatureLine
                num="03"
                title="reputation_engine"
                desc="Bilateral 1-10 reviews. Your history becomes your passport."
              />
              <FeatureLine
                num="04"
                title="realtime_messaging"
                desc="Negotiate inside every contract. No external apps needed."
              />
            </div>
          </section>

          <div className="divider" />

          {/* HOW IT WORKS */}
          <section className="py-20 md:py-28">
            <p className="text-[12px] text-[#7a6b4a] mb-12">$ cat docs/quickstart.md</p>
            <div className="space-y-16">
              <StepLine
                num="01"
                title="post what you need"
                desc="Describe a service, item, or task. Set what you're offering in return."
              />
              <StepLine
                num="02"
                title="receive verified offers"
                desc="People with proven skills submit offers. Browse profiles, ratings, history."
              />
              <StepLine
                num="03"
                title="form a binding contract"
                desc="Agree on terms. Sign digitally. Complete. Review. Build trust."
              />
            </div>
          </section>

          <div className="divider" />

          {/* CTA */}
          <section className="py-20 md:py-28">
            <p className="text-[12px] text-[#7a6b4a] mb-8">$ ./join_network.sh</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 glow-text">
              start building
              <br />
              <span className="text-[#f5b800]">your reputation.</span>
            </h2>
            <p className="text-[15px] text-[#7a6b4a] max-w-md mb-10">
              Join the Central Coast community. Post your first need.
              Become part of a network built on trust.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-cmd-primary">
                $ create_account
              </Link>
              <Link href="/needs" className="btn-cmd">
                $ browse_needs
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureLine({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="grid md:grid-cols-12 gap-4 md:gap-8 group">
      <div className="md:col-span-2">
        <span className="text-[12px] text-[#7a6b4a]">{num}</span>
      </div>
      <div className="md:col-span-10">
        <h3 className="text-base font-bold mb-2 group-hover:text-[#f5b800] transition-colors">
          {title}
        </h3>
        <p className="text-[13px] text-[#7a6b4a] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StepLine({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="grid md:grid-cols-12 gap-4 md:gap-8">
      <div className="md:col-span-2">
        <span className="text-5xl md:text-7xl font-bold text-[#1a1a1a]">{num}</span>
      </div>
      <div className="md:col-span-10 md:pt-4">
        <h3 className="text-xl md:text-2xl font-bold mb-3">{title}</h3>
        <p className="text-[13px] text-[#7a6b4a] leading-relaxed max-w-md">{desc}</p>
      </div>
    </div>
  );
}
