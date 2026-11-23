"use client";

import { Suspense, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ArrowRight, Briefcase, Lock, Plus, Radio, Users } from "lucide-react";

import NeedsListClient from "@/app/(app)/needs/_components/needs-list-client";
import ProsDirectoryPage from "@/app/(app)/pros/_components/pros-client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { RelayPreview } from "./relay-preview";
import { StatusBoard } from "./status-board";

type Band = "needs" | "nodes" | "relay";

const BANDS: {
  id: Band;
  label: string;
  freq: string;
  icon: typeof Briefcase;
  subtitle: string;
}[] = [
  {
    id: "needs",
    label: "needs",
    freq: "146.550 MHz",
    icon: Briefcase,
    subtitle: "open signals on the local board",
  },
  {
    id: "nodes",
    label: "nodes",
    freq: "146.400 MHz",
    icon: Users,
    subtitle: "verified people and business base-stations",
  },
  {
    id: "relay",
    label: "relay",
    freq: "146.700 MHz",
    icon: Radio,
    subtitle: "live community channels",
  },
];

function parseBand(value: string | null): Band {
  return BANDS.some((b) => b.id === value) ? (value as Band) : "needs";
}

export default function ExchangePage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ash">tuning in…</div>}>
      <ExchangeClient />
    </Suspense>
  );
}

function ExchangeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [band, setBand] = useState<Band>(() => parseBand(searchParams.get("band")));
  const [visited, setVisited] = useState<Record<Band, boolean>>({
    needs: true,
    nodes: false,
    relay: false,
  });
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id } : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBand(parseBand(searchParams.get("band")));
  }, [searchParams]);

  function tune(next: Band) {
    setBand(next);
    setVisited((v) => ({ ...v, [next]: true }));
    const params = new URLSearchParams(searchParams.toString());
    if (next === "needs") params.delete("band");
    else params.set("band", next);
    router.replace(`/exchange${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  const active = BANDS.find((b) => b.id === band) ?? BANDS[0];
  const relayLocked = band === "relay" && !user;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 pb-16">
      <div className="py-8">
        <p className="text-xs text-ash mb-3">» THE EXCHANGE — LOCAL MESH MARKET</p>
        <h1 className="heading-display text-3xl md:text-4xl text-gold">the exchange</h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Band sidebar — desktop. Frequencies are radio channels, labelled. */}
        <aside className="lg:w-56 lg:shrink-0">
          <nav
            aria-label="Exchange bands"
            className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:gap-1.5"
          >
            {BANDS.map((b) => {
              const isActive = band === b.id;
              const locked = b.id === "relay" && !user;
              return (
                <button
                  key={b.id}
                  onClick={() => tune(b.id)}
                  aria-selected={isActive}
                  className={cn(
                    "flex min-w-[9rem] items-center gap-3 border px-4 py-3 text-left transition-all lg:min-w-0",
                    isActive
                      ? "border-sun/50 bg-surface shadow-[0_0_20px_rgba(245,166,35,0.08)]"
                      : "border-line bg-surface/40 hover:border-linehi hover:bg-surface/70"
                  )}
                >
                  <b.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sun" : "text-ash")} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-sm",
                        isActive ? "text-gold" : "text-parchment"
                      )}
                    >
                      {b.label}
                      {locked && <Lock className="h-3 w-3 text-ash" />}
                    </span>
                    <span className="block font-mono text-[10px] tracking-wider text-ash">
                      {b.freq}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content column */}
        <div className="min-w-0 flex-1">
          {/* Band topbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                channel {active.freq}
              </p>
              <h2 className="heading-display text-xl text-gold">{active.label}</h2>
              <p className="text-xs text-ash">{active.subtitle}</p>
            </div>
            {band === "needs" && (
              <Button asChild size="sm">
                <Link href="/needs/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Broadcast a need
                </Link>
              </Button>
            )}
            {band === "nodes" && (
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard?tab=profile">Appear here</Link>
              </Button>
            )}
          </div>

          <StatusBoard />

          {relayLocked ? (
            <div className="vessel flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-mercury/30 bg-mercury/10">
                <Lock className="h-5 w-5 text-mercury" />
              </div>
              <div>
                <p className="heading-display text-xl text-gold">members only channel</p>
                <p className="mt-1 max-w-sm text-sm text-ash">
                  The relay is where the community talks. Log in to listen in and transmit — it
                  unlocks the moment you&apos;re signed in.
                </p>
              </div>
              <Button asChild>
                <Link href="/login?redirect=/exchange?band=relay">
                  Log in to tune in <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className={cn(band !== "needs" && "hidden")}>
                <NeedsListClient embedded />
              </div>
              {visited.nodes && (
                <div className={cn(band !== "nodes" && "hidden")}>
                  <ProsDirectoryPage embedded />
                </div>
              )}
              {visited.relay && (
                <div className={cn(band !== "relay" && "hidden")}>
                  <RelayPreview />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
