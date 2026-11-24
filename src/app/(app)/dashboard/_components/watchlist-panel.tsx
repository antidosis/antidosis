"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, BellOff, Bookmark, MapPin } from "lucide-react";
import { mutate } from "swr";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useApi } from "@/lib/swr-config";

import { statusBadgeVariant } from "./dashboard-nav";

interface WatchedNeed {
  id: string;
  title: string;
  status: string;
  locationName: string | null;
  offerType: string;
  offerDescription: string;
  poster: { id: string; fullName: string | null; avatarUrl: string | null; isVerified: boolean };
  _count?: { acceptances?: number };
}

export function WatchlistPanel() {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: needs, isLoading } = useApi<WatchedNeed[]>("/api/v1/needs/watching");

  async function unwatch(need: WatchedNeed) {
    setBusyId(need.id);
    try {
      const response = await fetch(`/api/v1/needs/${need.id}/watch`, { method: "DELETE" });
      if (!response.ok) throw new Error("Watch removal failed");
      await mutate("/api/v1/needs/watching");
      toast(`Stopped watching ${need.title}`, "success");
    } catch {
      toast("Couldn't remove this need from your watchlist", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading && !needs) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading watchlist">
        {[0, 1].map((item) => (
          <div key={item} className="vessel h-36 animate-pulse bg-surface/50" />
        ))}
      </div>
    );
  }

  if (!needs?.length) {
    return (
      <EmptyState
        icon={<Bookmark className="h-8 w-8 text-sun" />}
        title="Your watchlist is clear"
        description="Use Watch on any need to keep it here and follow its activity without expressing interest."
        action={
          <Button asChild size="sm">
            <Link href="/needs">Browse needs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {needs.map((need) => (
        <article key={need.id} className="vessel flex flex-col rounded-lg p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant={statusBadgeVariant(need.status)}>{need.status}</Badge>
              <Link
                href={`/needs/${need.id}`}
                className="mt-3 block text-base font-medium text-gold hover:text-sun"
              >
                {need.title}
              </Link>
            </div>
            <Avatar src={need.poster.avatarUrl} name={need.poster.fullName} size="sm" />
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-parchment">{need.offerDescription}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ash">
            <span>{need.poster.fullName || "Antidosis member"}</span>
            {need.locationName && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {need.locationName}
              </span>
            )}
            <span>{need._count?.acceptances ?? 0} interested</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
            <button
              type="button"
              onClick={() => unwatch(need)}
              disabled={busyId === need.id}
              className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-xs text-ash hover:bg-raise hover:text-gold"
            >
              <BellOff className="h-3.5 w-3.5" /> Stop watching
            </button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/needs/${need.id}`}>
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
