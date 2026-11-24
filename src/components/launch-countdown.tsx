import Link from "next/link";

import { ArrowRight, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

const MILESTONES = [
  { value: "500+", label: "active members" },
  { value: "100+", label: "monthly exchanges" },
  { value: "50+", label: "verified members" },
  { value: "5+", label: "participating suburbs" },
];

export function LaunchCountdown() {
  return (
    <section
      data-signal-scene="expansion"
      className="relative w-full overflow-hidden border-y border-sun/15 bg-inset"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <p className="mb-8 font-mono text-xs text-ash">» NEW REGIONS — EVIDENCE BEFORE EXPANSION</p>
        <div className="mb-10 grid gap-8 md:mb-14 md:grid-cols-2 md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-sun" />
              <span className="text-xs font-medium uppercase tracking-widest text-sun">
                Central Coast pilot active
              </span>
            </div>
            <h2 className="heading-display mb-4 text-3xl text-gold md:text-5xl">
              Earn density.
              <br />
              <span className="text-sun">Then expand.</span>
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-ash md:text-base">
            Wollongong, Newcastle and the Gold Coast are on the shortlist—not on a countdown.
            Expansion follows real participation, successful exchanges and trusted local density.
            There is no fixed launch date.
          </p>
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-parchment">
          Proposed expansion targets — not current platform metrics
        </p>
        <div className="mb-10 grid max-w-3xl grid-cols-2 gap-3 md:mb-12 md:grid-cols-4 md:gap-4">
          {MILESTONES.map((milestone) => (
            <div key={milestone.label} className="vessel-lit p-4 md:p-5">
              <p className="font-mono text-2xl font-bold text-sun md:text-3xl">{milestone.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-ash">{milestone.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              <MapPin className="mr-2 h-4 w-4" /> Join the Central Coast pilot
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/blog/regional-expansion-plan">
              Read the roadmap <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-ash/90">
          Joining, posting, contracting and reviewing are free. No credit card required.
        </p>
      </div>
    </section>
  );
}

export function LaunchBanner() {
  return (
    <div className="launch-banner w-full border-b border-sun/15 bg-inset">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-sun" />
          <p className="truncate text-xs text-ash">
            Central Coast pilot active. Expansion follows milestones, not a fixed date.
          </p>
        </div>
        <Link
          href="/blog/regional-expansion-plan"
          className="shrink-0 text-xs font-medium text-sun underline underline-offset-2 transition-colors hover:text-gold"
        >
          Roadmap →
        </Link>
      </div>
    </div>
  );
}
