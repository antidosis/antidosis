import Link from "next/link";

import { ArrowLeft, CheckCircle2, RadioTower, ShieldCheck, Wrench } from "lucide-react";
import type { Metadata } from "next";

import { EmailLink } from "@/components/email-link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For Mesh Builders — Antidosis Node Pilot",
  description:
    "Apply to build or supply Meshtastic-compatible 915 MHz nodes for the Antidosis community pilot. Review hardware, range-testing and buyer-support expectations.",
  alternates: { canonical: "https://antidosis.com/store/builders" },
  openGraph: {
    title: "Build nodes for the Antidosis community mesh",
    description: "Hardware, testing and support expectations for local mesh builders.",
    url: "https://antidosis.com/store/builders",
  },
};

const EXPECTATIONS = [
  {
    icon: RadioTower,
    title: "Correct Australian hardware",
    body: "915 MHz Meshtastic-compatible hardware, legal antenna connections and the ANZ region configured during setup. Never ship a device configured for another region.",
  },
  {
    icon: ShieldCheck,
    title: "Honest, testable claims",
    body: "Publish exact board, antenna, battery and enclosure specifications. Range statements must come from documented local tests—not theoretical marketing figures.",
  },
  {
    icon: Wrench,
    title: "Real buyer support",
    body: "Provide clear pricing, warranty or repair terms, pairing instructions and a way for buyers to get help. Channel access remains subject to platform verification.",
  },
];

export default function MeshBuildersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Link href="/store" className="inline-flex items-center text-sm text-ash hover:text-gold">
        <ArrowLeft className="mr-2 h-4 w-4" /> Mesh store
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            Builder network
          </p>
          <h1 className="heading-display mt-3 text-4xl text-gold md:text-5xl">
            Build the infrastructure your neighbours can rely on.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ash md:text-lg">
            We are looking for makers and existing sellers who can supply dependable nodes, explain
            them plainly and stand behind their work. A listing is earned through evidence, not
            purchased.
          </p>
          <EmailLink
            email="support@antidosis.com"
            subject="Mesh builder application"
            className="mt-7 inline-flex min-h-11 items-center rounded bg-sun px-5 py-2.5 text-[15px] font-medium text-void hover:bg-sunhi"
          >
            Apply as a mesh builder
          </EmailLink>
        </header>

        <aside className="rounded-lg border border-sun/25 bg-sun/[0.035] p-6">
          <h2 className="text-lg font-medium text-gold">Include in your application</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-parchment">
            <li>· Your business or maker name and contact details</li>
            <li>· Exact devices, antennas, batteries and enclosures offered</li>
            <li>· AUD pricing, stock lead time and buyer-support terms</li>
            <li>· Photos and any documented Australian range tests</li>
            <li>· Your experience with Meshtastic and ANZ radio configuration</li>
          </ul>
        </aside>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {EXPECTATIONS.map((item) => (
          <section key={item.title} className="vessel rounded-lg p-6">
            <item.icon className="h-6 w-6 text-mercury" />
            <h2 className="mt-4 text-lg font-medium text-gold">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">{item.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-line bg-surface/40 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          <div>
            <h2 className="text-xl font-medium text-gold">Pilot review process</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ash">
              Applications are reviewed manually. Before any listing, we may inspect a sample,
              verify its configuration and run two-node or multi-node range tests. Approval does not
              make Antidosis the seller or guarantee radio coverage; those responsibilities stay
              with the builder and the actual site conditions.
            </p>
          </div>
        </div>
      </section>

      <Button asChild variant="secondary" className="mt-8">
        <Link href="/store/interest">Not a builder? Join the pilot</Link>
      </Button>
    </main>
  );
}
