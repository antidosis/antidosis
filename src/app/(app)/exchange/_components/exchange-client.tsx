"use client";

import { Suspense, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Briefcase, Radio, Users } from "lucide-react";

import NeedsListClient from "@/app/(app)/needs/_components/needs-list-client";
import ProsDirectoryPage from "@/app/(app)/pros/_components/pros-client";
import { cn } from "@/lib/utils";

import { RelayPreview } from "./relay-preview";
import { StatusBoard } from "./status-board";

type Band = "needs" | "nodes" | "relay";

const BANDS: { id: Band; label: string; freq: string; icon: typeof Briefcase }[] = [
  { id: "needs", label: "needs", freq: "146.550", icon: Briefcase },
  { id: "nodes", label: "nodes", freq: "146.400", icon: Users },
  { id: "relay", label: "relay", freq: "146.700", icon: Radio },
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
  const [band, setBand] = useState<Band>(() => parseBand(searchParams.get("band")));
  // Mount a band's content the first time it is visited, then keep it mounted
  // so tuning back is instant.
  const [visited, setVisited] = useState<Record<Band, boolean>>({
    needs: true,
    nodes: false,
    relay: false,
  });

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

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-16">
      <div className="py-10">
        <p className="text-xs text-ash mb-4">» THE EXCHANGE — LOCAL MESH MARKET</p>
        <h1 className="heading-display text-3xl md:text-4xl text-gold">the exchange</h1>
      </div>

      <StatusBoard />

      {/* Band tuner */}
      <div
        role="tablist"
        aria-label="Exchange bands"
        className="mb-8 inline-flex w-full flex-col gap-1 rounded border border-line bg-inset/60 p-1 sm:w-auto sm:flex-row"
      >
        {BANDS.map((b) => {
          const active = band === b.id;
          return (
            <button
              key={b.id}
              role="tab"
              aria-selected={active}
              onClick={() => tune(b.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-sm px-5 py-2 text-sm transition-colors",
                active ? "bg-raise text-gold shadow-sm" : "text-ash hover:text-parchment"
              )}
            >
              <b.icon className={cn("h-4 w-4", active && "text-sun")} />
              {b.label}
              <span className="font-mono text-[10px] opacity-60">{b.freq}</span>
            </button>
          );
        })}
      </div>

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
    </div>
  );
}
