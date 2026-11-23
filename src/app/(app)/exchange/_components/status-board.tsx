"use client";

import { useEffect, useState } from "react";

import { Radio } from "lucide-react";

import { useApi } from "@/lib/swr-config";

interface Stats {
  openNeeds: number;
  contractsThisWeek: number;
  nodesOnAir: number;
}

function Stat({ label, value, pulse }: { label: string; value: number; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
      </span>
      <p className="font-mono text-sm text-parchment">
        {value}
        <span className="ml-1.5 text-xs text-ash">{label}</span>
      </p>
    </div>
  );
}

/** The heartbeat strip above the bands — proof the network is alive. */
export function StatusBoard() {
  const { data } = useApi<Stats>("/api/v1/exchange/stats", {
    refreshInterval: 60000,
  });
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStale(true), 15000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-label="Network status"
      className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-line bg-surface/40 px-4 py-3"
    >
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
        <Radio className="h-3.5 w-3.5 text-mercury" /> network status
        <span className={stale && !data ? "text-alert" : "text-ok"}>
          {data ? "on air" : "tuning…"}
        </span>
      </p>
      <Stat label="open needs" value={data?.openNeeds ?? 0} pulse />
      <Stat label="contracts this week" value={data?.contractsThisWeek ?? 0} />
      <Stat label="nodes on the air" value={data?.nodesOnAir ?? 0} pulse />
    </div>
  );
}
