"use client";

import { useEffect, useState } from "react";

import { Activity, FileCheck2, Users } from "lucide-react";

import { useApi } from "@/lib/swr-config";

interface Stats {
  openNeeds: number;
  contractsThisWeek: number;
  nodesOnAir: number;
}

function Stat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: typeof Activity;
  loading: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-inset text-mercury">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-lg leading-none text-parchment">
          {loading ? <span className="text-ash">—</span> : value?.toLocaleString("en-AU")}
        </p>
        <p className="mt-1 truncate text-xs text-ash">{label}</p>
      </div>
    </div>
  );
}

export function StatusBoard() {
  const { data } = useApi<Stats>("/api/v1/exchange/stats", { refreshInterval: 60000 });
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStale(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  const loading = !data;

  return (
    <section
      aria-label="Exchange activity"
      className="mb-6 rounded-lg border border-line bg-surface/40"
    >
      <div className="flex items-center justify-between border-b border-line/60 px-4 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">Live activity</p>
        <p className="flex items-center gap-2 text-xs text-ash">
          <span className="relative flex h-2 w-2">
            {!!data && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-50" />
            )}
            <span
              className={`relative h-2 w-2 rounded-full ${data ? "bg-ok" : stale ? "bg-alert" : "bg-ash"}`}
            />
          </span>
          {data ? "updated just now" : stale ? "reconnecting" : "connecting"}
        </p>
      </div>
      <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-line/60">
        <Stat label="open needs" value={data?.openNeeds} icon={Activity} loading={loading} />
        <Stat
          label="agreements this week"
          value={data?.contractsThisWeek}
          icon={FileCheck2}
          loading={loading}
        />
        <Stat
          label="members active recently"
          value={data?.nodesOnAir}
          icon={Users}
          loading={loading}
        />
      </div>
    </section>
  );
}
