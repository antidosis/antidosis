"use client";

import { Suspense, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ArrowRight, BookUser, Briefcase, Lock, Plus, Radio } from "lucide-react";

import NeedsListClient from "@/app/(app)/needs/_components/needs-list-client";
import ProsDirectoryPage from "@/app/(app)/pros/_components/pros-client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { RelayPreview } from "./relay-preview";
import { StatusBoard } from "./status-board";

type Band = "needs" | "directory" | "relay";

const BANDS: {
  id: Band;
  label: string;
  code: string;
  icon: typeof Briefcase;
  subtitle: string;
  description: string;
}[] = [
  {
    id: "needs",
    label: "Needs",
    code: "01",
    icon: Briefcase,
    subtitle: "Local requests and offers",
    description: "Find someone who can help, or post what you need in return for value.",
  },
  {
    id: "directory",
    label: "Directory",
    code: "02",
    icon: BookUser,
    subtitle: "People and local businesses",
    description: "Compare skills, credentials and reputation before you start a conversation.",
  },
  {
    id: "relay",
    label: "Relay",
    code: "03",
    icon: Radio,
    subtitle: "Community conversations",
    description: "Join local channels and direct messages with other verified members.",
  },
];

function parseBand(value: string | null): Band {
  return BANDS.some((b) => b.id === value) ? (value as Band) : "needs";
}

export default function ExchangePage() {
  return (
    <Suspense
      fallback={<div className="py-24 text-center text-sm text-ash">Loading exchange…</div>}
    >
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
    directory: false,
    relay: false,
  });
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id } : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync band from the URL — render-adjust pattern
  const [bandSyncedFor, setBandSyncedFor] = useState(searchParams);
  if (bandSyncedFor !== searchParams) {
    setBandSyncedFor(searchParams);
    const next = parseBand(searchParams.get("band"));
    setBand(next);
    setVisited((current) => ({ ...current, [next]: true }));
  }

  function tune(next: Band) {
    setBand(next);
    setVisited((current) => ({ ...current, [next]: true }));
    const params = new URLSearchParams(searchParams.toString());
    if (next === "needs") params.delete("band");
    else params.set("band", next);
    router.replace(`/exchange${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  const active = BANDS.find((item) => item.id === band) ?? BANDS[0];
  const relayLocked = band === "relay" && !user;
  const relayLogin = `/login?next=${encodeURIComponent("/exchange?band=relay")}`;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 md:px-6 lg:px-8">
      <header className="flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between md:py-10">
        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
            Community exchange network
          </p>
          <h1 className="heading-display text-3xl text-gold md:text-4xl">
            One network. Every local exchange.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ash">
            Requests, trusted people and community conversation—without jumping between products.
          </p>
        </div>
        {band === "needs" && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/needs/new">
              <Plus className="mr-2 h-4 w-4" /> Post a need
            </Link>
          </Button>
        )}
        {band === "directory" && (
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href="/dashboard?tab=profile&profileSection=directory">
              Edit directory profile
            </Link>
          </Button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0">
          <nav
            aria-label="Exchange sections"
            className="flex snap-x gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:gap-0 lg:overflow-visible lg:rounded-lg lg:border lg:border-line lg:bg-surface/45 lg:p-2 lg:pb-2"
          >
            {BANDS.map((item) => {
              const isActive = band === item.id;
              const locked = item.id === "relay" && !user;
              return (
                <button
                  key={item.id}
                  onClick={() => tune(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex min-w-[210px] snap-start items-center gap-3 rounded-md border px-4 py-3.5 text-left transition-colors lg:min-w-0 lg:border-transparent",
                    isActive
                      ? "border-sun/35 bg-sun/[0.07] lg:border-sun/20"
                      : "border-line bg-surface/35 hover:border-linehi hover:bg-surface/70"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                      isActive
                        ? "border-sun/30 bg-sun/10 text-sun"
                        : "border-line bg-inset text-ash group-hover:text-parchment"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium",
                        isActive ? "text-gold" : "text-parchment"
                      )}
                    >
                      {item.label}
                      {locked && <Lock className="h-3 w-3 text-ash" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ash">
                      {item.subtitle}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "hidden font-mono text-[11px] lg:block",
                      isActive ? "text-sun" : "text-ash/50"
                    )}
                  >
                    {item.code}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-5 border-b border-line pb-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              Exchange / {active.code}
            </p>
            <h2 className="heading-display mt-1 text-2xl text-gold">{active.label}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ash">{active.description}</p>
          </div>

          <StatusBoard />

          {relayLocked ? (
            <div className="vessel flex flex-col items-center gap-4 rounded-lg p-8 text-center md:p-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-mercury/30 bg-mercury/10">
                <Lock className="h-5 w-5 text-mercury" />
              </div>
              <div>
                <p className="heading-display text-xl text-gold">Relay is for members</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ash">
                  Log in to read local channels and join the conversation. Participation requires a
                  verified mobile number.
                </p>
              </div>
              <Button asChild>
                <Link href={relayLogin}>
                  Log in to open Relay <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className={cn(band !== "needs" && "hidden")}>
                <NeedsListClient embedded />
              </div>
              {visited.directory && (
                <div className={cn(band !== "directory" && "hidden")}>
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
        </main>
      </div>
    </div>
  );
}
