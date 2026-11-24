import Link from "next/link";

import { ArrowLeft, ArrowRight, PackageCheck, Radio, Wrench } from "lucide-react";
import type { Metadata } from "next";

import { EmailLink } from "@/components/email-link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Express Interest — Mesh Node Pilot",
  description:
    "Register interest in the Antidosis mesh node pilot, get channel setup guidance for your own Meshtastic device, or apply as a local node builder.",
  alternates: { canonical: "https://antidosis.com/store/interest" },
  openGraph: {
    title: "Join the Antidosis mesh pilot",
    description: "Node launch updates, BYO device setup and community builder applications.",
    url: "https://antidosis.com/store/interest",
  },
};

const PATHS = [
  {
    icon: PackageCheck,
    title: "I want a ready-to-use node",
    body: "Register for pilot batch updates. Hardware pricing and availability are still being confirmed; expressing interest is free and is not an order.",
    subject: "Mesh node pilot — launch updates",
    action: "Get launch updates",
  },
  {
    icon: Radio,
    title: "I already own a device",
    body: "Tell us your 915 MHz Meshtastic-compatible model. We can help with the ANZ region setup and explain how channel access will work for verified members.",
    subject: "BYO mesh device — setup interest",
    action: "Ask about my device",
  },
  {
    icon: Wrench,
    title: "I build or sell nodes",
    body: "Apply to be considered for the builder directory. Listings follow range testing, transparent hardware specifications and clear buyer support expectations.",
    subject: "Mesh builder application",
    action: "Start an application",
  },
];

export default function StoreInterestPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Link href="/store" className="inline-flex items-center text-sm text-ash hover:text-gold">
        <ArrowLeft className="mr-2 h-4 w-4" /> Mesh store
      </Link>
      <header className="mt-8 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-mercury">Mesh pilot</p>
        <h1 className="heading-display mt-3 text-4xl text-gold md:text-5xl">
          Help build the local network.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ash md:text-lg">
          Choose the path that fits you. No payment, no preorder and no commitment—just a direct
          conversation with the pilot team.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PATHS.map((path) => (
          <section key={path.title} className="vessel flex flex-col rounded-lg p-6">
            <path.icon className="h-6 w-6 text-sun" />
            <h2 className="mt-5 text-xl font-medium text-gold">{path.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ash">{path.body}</p>
            <EmailLink
              email="support@antidosis.com"
              subject={path.subject}
              className="mt-6 inline-flex min-h-11 items-center justify-between rounded border border-line px-4 py-2 text-sm font-medium text-parchment transition-colors hover:border-sun/40 hover:text-sun"
            >
              {path.action} <ArrowRight className="h-4 w-4" />
            </EmailLink>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-mercury/25 bg-mercury/[0.035] p-6 md:p-8">
        <h2 className="text-xl font-medium text-gold">What happens next</h2>
        <ol className="mt-5 grid gap-5 md:grid-cols-3">
          <li>
            <span className="font-mono text-sm text-sun">01</span>
            <p className="mt-2 text-sm leading-relaxed text-parchment">
              We confirm your device, location and what you want to test.
            </p>
          </li>
          <li>
            <span className="font-mono text-sm text-sun">02</span>
            <p className="mt-2 text-sm leading-relaxed text-parchment">
              You receive practical setup or pilot information when the relevant stage is ready.
            </p>
          </li>
          <li>
            <span className="font-mono text-sm text-sun">03</span>
            <p className="mt-2 text-sm leading-relaxed text-parchment">
              Range and reliability results guide expansion. No coverage is promised before testing.
            </p>
          </li>
        </ol>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/store/builders">Builder requirements</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/how-it-works">How the online exchange works today</Link>
        </Button>
      </div>
    </main>
  );
}
