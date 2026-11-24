"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, Package, Radio, Wrench } from "lucide-react";

import { EmailLink } from "@/components/email-link";
import { cn } from "@/lib/utils";

import { MeshVisual } from "./mesh-visual";

type Tab = "network" | "get" | "setup" | "builders";

const TABS: { id: Tab; label: string }[] = [
  { id: "network", label: "the network" },
  { id: "get", label: "get a node" },
  { id: "setup", label: "set it up" },
  { id: "builders", label: "for builders" },
];

const SIMPLE_STEPS = [
  {
    title: "Get a node",
    body: "One small device. Order it here when the first batch lands, or bring any Meshtastic-compatible device you already own.",
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
    body: "Any Meshtastic-compatible 915 MHz device works — ours, a builder's, or your own. See the shopping list below.",
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

function NotifyButton({ subject, label, href }: { subject: string; label: string; href?: string }) {
  const className =
    "inline-flex items-center gap-2 rounded bg-sun px-4 py-2 text-[15px] font-medium text-void transition-colors hover:bg-sunhi";
  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <EmailLink email="support@antidosis.com" subject={subject} className={className}>
      {label}
    </EmailLink>
  );
}

export function StoreClient() {
  const [tab, setTab] = useState<Tab>("network");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="mb-4 font-mono text-xs text-ash">» STORE — OFF-GRID HARDWARE</p>
        <h1 className="heading-display mb-4 text-3xl text-gold md:text-5xl">
          the mesh <span className="text-sun">store</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ash">
          One device keeps you connected to your community when everything else drops out.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Store sections"
        className="mb-10 flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-[15px] transition-colors",
              tab === t.id
                ? "border-sun text-gold"
                : "border-transparent text-ash hover:text-parchment"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1 — the network: the concept, plain language */}
      {tab === "network" && (
        <div>
          <div className="vessel relative mb-10 overflow-hidden">
            <MeshVisual className="h-64 w-full md:h-96" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="heading-display text-2xl text-gold md:text-4xl">
                when the internet stops,
                <br />
                <span className="text-sun">the mesh doesn&apos;t.</span>
              </p>
              <p className="mt-3 max-w-md text-sm text-ash md:text-base">
                Every dot is a neighbour. Every line is a message finding its way home.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SIMPLE_STEPS.map((s, i) => (
              <div key={s.title} className="vessel p-6">
                <p className="heading-display mb-3 text-3xl text-sun/40">0{i + 1}</p>
                <h3 className="mb-1.5 text-lg font-medium text-gold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ash">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setTab("get")}
              className="inline-flex items-center gap-2 rounded bg-sun px-5 py-2.5 text-[15px] font-medium text-void transition-colors hover:bg-sunhi"
            >
              <Package className="h-4 w-4" /> See the nodes
            </button>
            <Link
              href="/exchange?band=relay"
              className="inline-flex items-center gap-2 text-[15px] text-ash transition-colors hover:text-gold"
            >
              <Radio className="h-4 w-4" /> Meanwhile, the relay works on the internet too
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2 — get a node */}
      {tab === "get" && (
        <div>
          <div className="mb-8 grid gap-5 md:grid-cols-2">
            <section className="vessel flex flex-col p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sun">
                flagship
              </p>
              <h2 className="heading-display mb-2 text-2xl text-gold">The Antidosis Node</h2>
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
                <NotifyButton
                  subject="Node notify"
                  label="Express interest"
                  href="/store/interest"
                />
              </div>
            </section>

            <section className="vessel flex flex-col p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
                bring your own
              </p>
              <h2 className="heading-display mb-2 text-2xl text-gold">Any device, our channel</h2>
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
                <NotifyButton
                  subject="Channel access"
                  label="Get channel access"
                  href="/store/interest"
                />
              </div>
            </section>
          </div>

          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/70">
            pilot shopping list — ~AU$150 gets you testing
          </p>
          <div className="vessel overflow-hidden">
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
                    <td className="px-5 py-3 text-right font-mono text-xs text-ash">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ash">
            Sourcing: Heltec/LilyGo/RAK official stores, or a verified node builder. Two nodes
            minimum for a range test — three if you can place one high.
          </p>
        </div>
      )}

      {/* TAB 3 — setup */}
      {tab === "setup" && (
        <div>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-ash">
            From box to mesh in about five minutes. If you can pair Bluetooth headphones, you can do
            this.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RUNBOOK_STEPS.map((s) => (
              <div key={s.step} className="vessel p-5">
                <p className="heading-display mb-3 text-3xl text-sun/40">{s.step}</p>
                <h3 className="mb-1.5 text-base font-medium text-gold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ash">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <NotifyButton subject="Setup help" label="Stuck? Get setup help" />
          </div>
        </div>
      )}

      {/* TAB 4 — builders + the fine print */}
      {tab === "builders" && (
        <div>
          <section className="mb-8 border border-line bg-surface/40 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/70">
                  <Wrench className="h-3 w-3" /> verified node builders
                </p>
                <h2 className="heading-display text-xl text-gold">Built by the community</h2>
                <p className="mt-1 max-w-lg text-[15px] text-ash">
                  Local makers who sell pre-flashed, channel-ready nodes. Applications open —
                  builders get listed here and receive buyer referrals from the platform.
                </p>
              </div>
              <NotifyButton
                subject="Node builder application"
                label="For mesh builders"
                href="/store/builders"
              />
            </div>
            <p className="mt-5 border-t border-line/60 pt-4 text-sm italic text-ash">
              No builders listed yet — the pilot is sourcing its first three. Range-test results
              will be published here.
            </p>
          </section>

          <p className="text-sm leading-relaxed text-ash/70">
            Regulatory: 915–928 MHz ISM operation in Australia is licence-free under ACMA LIPD class
            conditions; community mesh practice stays well inside power and duty-cycle etiquette.
            Devices are communication tools — the antidosis exchange, contracts, and verification
            remain on the platform.
          </p>
        </div>
      )}
    </div>
  );
}
