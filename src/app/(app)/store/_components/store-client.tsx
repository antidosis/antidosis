"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Globe,
  Package,
  Radio,
  RadioTower,
  RefreshCw,
  Router,
  Satellite,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { BuildersMarket } from "./builders-market";
import { InterestForm, type InterestKind } from "./interest-form";
import { MeshVisual } from "./mesh-visual";

const SECTIONS = [
  { id: "nodes", label: "the shelf" },
  { id: "network", label: "how it connects" },
  { id: "builders", label: "builders" },
  { id: "setup", label: "set it up" },
  { id: "interest", label: "join the pilot" },
] as const;

const SIMPLE_STEPS = [
  {
    title: "Get a node",
    body: "One small device. Order from a verified builder below when the first shelves land, or bring any Meshtastic-compatible device you already own.",
  },
  {
    title: "Turn it on",
    body: "No SIM card. No Wi-Fi. No internet. The node talks to other nodes directly, over licence-free radio.",
  },
  {
    title: "You're connected",
    body: "Text your neighbours, trade, ask for help — even in a blackout, a flood, or a dead zone. The mesh keeps the community on the air.",
  },
];

const RUNBOOK_STEPS = [
  {
    step: "01",
    title: "Get a node",
    body: "Any Meshtastic-compatible 915 MHz device works — a builder's, ours, or your own. See the pilot parts list on the shelf.",
  },
  {
    step: "02",
    title: "Install the app",
    body: "Meshtastic app on Android or iOS, pair over Bluetooth. Set the region to ANZ (915 MHz) on first launch.",
  },
  {
    step: "03",
    title: "Join the antidosis channel",
    body: "Verified members receive the channel QR. Scan it in the app — the node is now on the antidosis mesh, alongside the public mesh.",
  },
  {
    step: "04",
    title: "Keep it alive",
    body: "A node at a window covers the street; a node on a roof covers the suburb. Mains-powered nodes relay for everyone.",
  },
];

const SHOPPING_LIST = [
  { item: "Heltec WiFi LoRa 32 V3", role: "Budget hand-held / home node", price: "~AU$30–45" },
  {
    item: "LilyGo T-Beam (915 MHz)",
    role: "Field node — GPS + 18650 battery",
    price: "~AU$75–100",
  },
  { item: "RAK WisMesh Mesh (915)", role: "Reliable base station / gateway", price: "~AU$45–80" },
  { item: "915 MHz antenna + pigtail", role: "Range is antenna-first", price: "~AU$15–40" },
  {
    item: "18650 battery + holder / solar",
    role: "Off-grid power for fixed nodes",
    price: "~AU$20–60",
  },
];

/**
 * How the radio mesh and the online platform relate — the three layers, in
 * plain language, with an honest status for each.
 */
const CONNECTION_LAYERS = [
  {
    icon: Globe,
    status: "live now",
    statusTone: "border-ok/40 text-ok",
    title: "The exchange — online",
    body: "Antidosis today runs on the internet: needs, directory, contracts, reviews, and the Relay comms surface. Every member's phone is already a node on this layer.",
  },
  {
    icon: RadioTower,
    status: "pilot",
    statusTone: "border-sun/50 text-sun",
    title: "The channel — radio",
    body: "A channel is a private, encrypted group on the public 915 MHz mesh — a name plus a key, not special hardware. Any Meshtastic device with the antidosis channel joins the community mesh and keeps working with no internet at all. Verified members receive the channel key.",
  },
  {
    icon: RefreshCw,
    status: "roadmap",
    statusTone: "border-mercury/40 text-mercury",
    title: "The bridge — gateway",
    body: "A gateway is a fixed node with an internet uplink. It is how online needs will reach radios in the field, and how everything said on the mesh reconciles back to your account when connectivity returns. The channel pilot comes first; gateway sync is the next phase.",
  },
];

export function StoreClient() {
  const [interestKind, setInterestKind] = useState<InterestKind>("node");

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
                  href="#nodes"
                  className="inline-flex items-center gap-2 rounded bg-sun px-5 py-2.5 text-[15px] font-medium text-void transition-colors hover:bg-sunhi"
                >
                  <Package className="h-4 w-4" /> Browse the shelf
                </a>
                <a
                  href="#network"
                  className="inline-flex items-center gap-2 rounded border border-line bg-void/40 px-5 py-2.5 text-[15px] text-parchment backdrop-blur-sm transition-colors hover:border-sun/40 hover:text-sun"
                >
                  How it connects <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky section nav */}
        <nav
          aria-label="Store sections"
          className="sticky top-16 z-30 -mx-4 mt-6 overflow-x-auto border-y border-line bg-void/85 px-4 backdrop-blur-md md:-mx-8 md:px-8"
        >
          <div className="flex gap-1">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="whitespace-nowrap px-4 py-3 text-[15px] text-ash transition-colors hover:text-gold"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── The shelf ── */}
        <section id="nodes" className="scroll-mt-32 pt-12">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            the shelf
          </p>
          <h2 className="heading-display mb-3 text-2xl text-gold md:text-3xl">
            Two ways onto the mesh
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-ash">
            Hardware is a commodity — the network is the channel, the verified members and the
            community. Buy ready-made from a verified builder, or bring any compatible device.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="vessel flex flex-col p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sun">
                flagship
              </p>
              <h3 className="heading-display mb-2 text-2xl text-gold">The Antidosis Node</h3>
              <p className="mb-4 text-[15px] leading-relaxed text-ash">
                Cased, pre-flashed, channel pre-configured, app-pairing included. Power it on and
                you&apos;re on the mesh — the plug-and-play way in.
              </p>
              <ul className="mb-6 space-y-1.5 text-[15px] text-parchment">
                <li>· 915 MHz LoRa, ESP32-class, days of battery</li>
                <li>· antidosis channel preconfigured (verified members)</li>
                <li>· Pairs with the app over Bluetooth</li>
                <li>· Engraved enclosure, Central Coast tested</li>
              </ul>
              <p className="mb-4 font-mono text-xs text-ash">
                Price TBC — pilot batch pricing soon
              </p>
              <div className="mt-auto">
                <button
                  onClick={() => goToInterest("node")}
                  className="inline-flex items-center gap-2 rounded bg-sun px-4 py-2 text-[15px] font-medium text-void transition-colors hover:bg-sunhi"
                >
                  <Package className="h-4 w-4" /> Notify me at launch
                </button>
              </div>
            </div>

            <div className="vessel flex flex-col p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
                bring your own
              </p>
              <h3 className="heading-display mb-2 text-2xl text-gold">Any device, our channel</h3>
              <p className="mb-4 text-[15px] leading-relaxed text-ash">
                Already have a node, or want to build one? Any Meshtastic-compatible device joins
                the antidosis channel — no firmware changes, no exclusivity. The channel key is
                distributed to verified members.
              </p>
              <ul className="mb-6 space-y-1.5 text-[15px] text-parchment">
                <li>· Works alongside the public mesh</li>
                <li>· Setup runbook below — five minutes</li>
                <li>· Channel QR distributed to verified members</li>
              </ul>
              <div className="mt-auto">
                <button
                  onClick={() => goToInterest("byo_device")}
                  className="inline-flex items-center gap-2 rounded border border-mercury/40 px-4 py-2 text-[15px] font-medium text-mercury transition-colors hover:bg-mercury/10"
                >
                  <Radio className="h-4 w-4" /> Get channel access
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/70">
              pilot parts list — ~AU$150 gets you testing
            </p>
            <div className="vessel overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[15px]">
                <thead>
                  <tr className="border-b border-line/60 text-xs uppercase tracking-wider text-ash">
                    <th className="px-5 py-3 font-medium">item</th>
                    <th className="px-3 py-3 font-medium">role</th>
                    <th className="px-5 py-3 text-right font-medium">typical price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {SHOPPING_LIST.map((row) => (
                    <tr key={row.item} className="transition-colors hover:bg-raise/30">
                      <td className="px-5 py-3 text-parchment">{row.item}</td>
                      <td className="px-3 py-3 text-ash">{row.role}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-ash">
                        {row.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-ash">
              Sourcing: Heltec/LilyGo/RAK official stores, or a verified builder below. Two nodes
              minimum for a range test — three if you can place one high.
            </p>
          </div>
        </section>

        {/* ── How it connects ── */}
        <section id="network" className="scroll-mt-32 pt-16">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            how it connects
          </p>
          <h2 className="heading-display mb-3 text-2xl text-gold md:text-3xl">
            One community, three layers
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-ash">
            The radio mesh is not a separate app or a separate network — it is the same antidosis
            community on a transport that survives outages. Here is exactly how the pieces meet.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {CONNECTION_LAYERS.map((layer) => (
              <div key={layer.title} className="vessel flex flex-col p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <layer.icon className="h-6 w-6 text-sun" />
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                      layer.statusTone
                    )}
                  >
                    {layer.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gold">{layer.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ash">{layer.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface/40 p-5">
              <h4 className="flex items-center gap-2 text-base font-medium text-gold">
                <Router className="h-4 w-4 text-mercury" /> Does the mesh see online needs?
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                Not yet — and we won&apos;t pretend otherwise. Today the channel carries member text
                between nodes. Gateway sync (the bridge above) is the phase that publishes verified
                members&apos; needs to radios in the field and reconciles mesh activity back to
                accounts. It is designed, documented and sequenced after the channel pilot proves
                coverage.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface/40 p-5">
              <h4 className="flex items-center gap-2 text-base font-medium text-gold">
                <Satellite className="h-4 w-4 text-mercury" /> What if I never buy a node?
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ash">
                Nothing changes — the exchange, Relay and contracts work online exactly as they do
                now. A node is resilience, not a requirement: it keeps your neighbourhood reachable
                in a blackout, a storm, or a dead zone, and relays for everyone else on the mesh.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {SIMPLE_STEPS.map((s, i) => (
              <div
                key={s.title}
                className={cn("vessel p-4 sm:p-6", i === 2 && "col-span-2 md:col-span-1")}
              >
                <p className="heading-display mb-3 text-3xl text-sun/40">0{i + 1}</p>
                <h3 className="mb-1.5 text-lg font-medium text-gold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ash">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Builders ── */}
        <section id="builders" className="scroll-mt-32 pt-16">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            verified node builders
          </p>
          <h2 className="heading-display mb-3 text-2xl text-gold md:text-3xl">
            Built by the community
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-ash">
            Local makers who sell pre-flashed, channel-ready nodes. Every listing below is a real
            member, manually approved, with their own product shelf. Buying from a builder keeps the
            infrastructure — and the money — inside the community.
          </p>
          <BuildersMarket />
        </section>

        {/* ── Setup ── */}
        <section id="setup" className="scroll-mt-32 pt-16">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            set it up
          </p>
          <h2 className="heading-display mb-3 text-2xl text-gold md:text-3xl">
            Box to mesh in five minutes
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-ash">
            If you can pair Bluetooth headphones, you can do this.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {RUNBOOK_STEPS.map((s) => (
              <div key={s.step} className="vessel p-4 sm:p-5">
                <p className="heading-display mb-3 text-3xl text-sun/40">{s.step}</p>
                <h3 className="mb-1.5 text-base font-medium text-gold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ash">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Join the pilot ── */}
        <section id="interest" className="scroll-mt-32 pt-16">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            join the pilot
          </p>
          <h2 className="heading-display mb-3 text-2xl text-gold md:text-3xl">Get on the list</h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-ash">
            Launch updates, channel access for your own device, or plain mesh news — pick a lane,
            leave an email, done. No account needed.
          </p>
          <InterestForm key={interestKind} initialKind={interestKind} />
        </section>

        {/* Fine print */}
        <p className="mt-14 border-t border-line/60 pt-6 text-sm leading-relaxed text-ash/70">
          Regulatory: 915–928 MHz ISM operation in Australia is licence-free under ACMA LIPD class
          conditions; community mesh practice stays well inside power and duty-cycle etiquette.
          Devices are communication tools — the antidosis exchange, contracts, and verification
          remain on the platform. Antidosis is not the seller of builder-listed products; pricing,
          warranty and delivery are between you and the builder.{" "}
          <Link href="/safety" className="underline-offset-4 hover:text-gold hover:underline">
            How we keep the platform safe
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
