"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { ArrowRight, Package, Power, Radio, RadioTower } from "lucide-react";

import type { PublicMeshBuilder } from "./builders-market";
import { BuildersMarket } from "./builders-market";
import type { InterestKind } from "./interest-form";
import { InterestForm } from "./interest-form";
import { MeshVisual } from "./mesh-visual";
import { Shelf } from "./shelf";

const STEPS = [
  {
    icon: Package,
    title: "Get a node",
    body: "One small device from the shelf — or any Meshtastic device you already own.",
  },
  {
    icon: Power,
    title: "Turn it on",
    body: "No SIM. No Wi-Fi. No internet. It talks to other nodes over licence-free radio.",
  },
  {
    icon: RadioTower,
    title: "You're connected",
    body: "Message your neighbours and trade — even in a blackout or a dead zone.",
  },
];

/**
 * The mesh store. One job: show everyday people that off-grid comms is a
 * simple product they can get — a shelf of things, three steps, and a
 * marketplace of local builders. The technical depth lives in docs and in
 * the dashboard, not here.
 */
export function StoreClient() {
  const [interestKind, setInterestKind] = useState<InterestKind>("node");
  const [builders, setBuilders] = useState<PublicMeshBuilder[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/store/builders");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBuilders(data.builders ?? []);
      } catch {
        setBuilders([]);
      }
    })();
  }, []);

  const refreshBuilders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/store/builders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuilders(data.builders ?? []);
    } catch {
      /* keep last good list */
    }
  }, []);

  function goToInterest(kind: InterestKind) {
    setInterestKind(kind);
    document.getElementById("interest")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="chapter scene-mesh">
      <div className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
        {/* Hero — the banner members asked to keep */}
        <div className="pt-8 md:pt-12">
          <p className="mb-4 font-mono text-xs text-ash">» STORE — OFF-GRID HARDWARE</p>
          <div className="vessel relative overflow-hidden">
            <MeshVisual className="h-72 w-full md:h-[26rem]" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="heading-display text-2xl text-gold md:text-4xl">
                when the internet stops,
                <br />
                <span className="text-sun">the mesh doesn&apos;t.</span>
              </p>
              <p className="mt-3 max-w-md text-sm text-ash md:text-base">
                Every dot is a neighbour. Every line is a message finding its way home.
              </p>
              <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#shelf"
                  className="inline-flex items-center gap-2 rounded bg-sun px-5 py-2.5 text-[15px] font-medium text-void transition-colors hover:bg-sunhi"
                >
                  <Package className="h-4 w-4" /> Browse the shelf
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded border border-line bg-void/40 px-5 py-2.5 text-[15px] text-parchment backdrop-blur-sm transition-colors hover:border-sun/40 hover:text-sun"
                >
                  How it works <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── The shelf ── */}
        <section id="shelf" className="scroll-mt-24 pt-14">
          <div className="mb-8 text-center">
            <h2 className="heading-display text-2xl text-gold md:text-3xl">The shelf</h2>
            <p className="mx-auto mt-2 max-w-md text-base text-ash">
              One small device. No SIM, no Wi-Fi, no internet needed.
            </p>
          </div>
          <Shelf builders={builders} onNotify={goToInterest} />
        </section>

        {/* ── How it works ── */}
        <section id="how" className="scroll-mt-24 pt-16">
          <div className="mb-8 text-center">
            <h2 className="heading-display text-2xl text-gold md:text-3xl">
              If you can pair headphones, you can do this
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="vessel p-4 text-center sm:p-6">
                <p className="heading-display text-2xl text-sun/40 sm:text-3xl">0{i + 1}</p>
                <step.icon className="mx-auto mt-2 h-6 w-6 text-sun sm:h-7 sm:w-7" />
                <h3 className="mt-3 text-base font-medium text-gold sm:text-lg">{step.title}</h3>
                <p className="mx-auto mt-1.5 max-w-[26ch] text-sm leading-snug text-ash sm:text-[15px]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* BYO strip */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-mercury/25 bg-mercury/[0.04] p-5 sm:flex-row sm:p-6">
            <div className="flex items-start gap-3">
              <Radio className="mt-0.5 h-5 w-5 shrink-0 text-mercury" />
              <p className="text-[15px] leading-relaxed text-parchment">
                <span className="font-medium text-gold">Already have a device?</span> Any
                Meshtastic-compatible node joins the antidosis channel — five-minute setup, no
                firmware changes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => goToInterest("byo_device")}
              className="shrink-0 rounded border border-mercury/40 px-4 py-2 text-[15px] font-medium text-mercury transition-colors hover:bg-mercury/10"
            >
              Get channel access
            </button>
          </div>
        </section>

        {/* ── Builders ── */}
        <section id="builders" className="scroll-mt-24 pt-16">
          <div className="mb-8 text-center">
            <h2 className="heading-display text-2xl text-gold md:text-3xl">Built by locals</h2>
            <p className="mx-auto mt-2 max-w-md text-base text-ash">
              Verified makers sell their nodes here. Buy from them — or become one.
            </p>
          </div>
          <BuildersMarket builders={builders} onApplied={refreshBuilders} />
        </section>

        {/* ── Interest ── */}
        <section id="interest" className="scroll-mt-24 pt-16">
          <div className="mb-8 text-center">
            <h2 className="heading-display text-2xl text-gold md:text-3xl">Get on the list</h2>
            <p className="mx-auto mt-2 max-w-md text-base text-ash">
              Launch pricing, channel access, pilot news — leave an email, done.
            </p>
          </div>
          <InterestForm key={interestKind} initialKind={interestKind} />
        </section>

        {/* Fine print */}
        <p className="mt-14 border-t border-line/60 pt-6 text-sm leading-relaxed text-ash/70">
          915–928 MHz ISM operation in Australia is licence-free under ACMA LIPD class conditions.
          Antidosis is not the seller of builder-listed products — pricing, warranty and delivery
          are between you and the builder.{" "}
          <Link href="/safety" className="underline-offset-4 hover:text-gold hover:underline">
            How we keep the platform safe
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
