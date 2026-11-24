"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import { statusBadgeVariant } from "./dashboard-nav";
import type { DashboardOffer } from "./dashboard-types";

export function OffersPanel({ offers }: { offers?: DashboardOffer[] }) {
  if (!offers) {
    return (
      <div className="vessel h-32 animate-pulse bg-surface/40" aria-label="Loading interests" />
    );
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        title="No interests expressed"
        description="Browse needs and put your hand up — your reputation does the talking."
        action={
          <Button asChild size="sm">
            <Link href="/needs">Browse needs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className={cn(
            "vessel flex items-center justify-between gap-3 rounded-lg p-4 transition-colors hover:bg-raise/40 sm:p-5",
            offer.status === "selected" || offer.status === "accepted"
              ? "border-l-2 border-l-ok/40"
              : offer.status === "declined"
                ? "border-l-2 border-l-bad/40"
                : "border-l-2 border-l-orchid/40"
          )}
        >
          <div className="min-w-0">
            <Link
              href={`/needs/${offer.need?.id}`}
              className="block truncate text-base font-medium text-gold transition-colors hover:text-sun"
            >
              {offer.need?.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ash">
              <Badge variant={statusBadgeVariant(offer.status)}>{offer.status}</Badge>
              {offer.status === "accepted" && (
                <span className="text-ok">poster accepted — contract pending</span>
              )}
              {offer.status === "pending" && <span>waiting for poster review</span>}
              {offer.status === "declined" && <span className="text-bad">declined</span>}
              {offer.status === "selected" && <span className="text-ok">contract formed</span>}
            </div>
            {offer.message && (
              <p className="mt-2 text-sm text-parchment">&ldquo;{offer.message}&rdquo;</p>
            )}
          </div>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/needs/${offer.need?.id}`} aria-label="Open need">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
