import Link from "next/link";

import { Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Forward-thinking sponsored placements.
 *
 * Monetisation plan (Phase 2, product-decided): local businesses pay a monthly
 * subscription for featured placement — NOT third-party ad networks. These
 * slots reserve the layout positions now so future campaigns slot in without
 * redesigns.
 *
 * Enablement: set NEXT_PUBLIC_SPONSORED_PLACEMENTS to a comma-separated list
 * of placement ids, e.g. "blog-feed,directory-banner,needs-inline,dashboard-overview".
 * Until a placement id is listed, the slot renders nothing and takes no space.
 * When enabled without a campaign, it renders a labelled placeholder so the
 * reserved space is visible in staging.
 */

export type SponsoredPlacement =
  "blog-feed" | "directory-banner" | "needs-inline" | "dashboard-overview";

const ENABLED = new Set(
  (process.env.NEXT_PUBLIC_SPONSORED_PLACEMENTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

export function isPlacementEnabled(placement: SponsoredPlacement): boolean {
  return ENABLED.has(placement);
}

interface SponsoredSlotProps {
  placement: SponsoredPlacement;
  /** Live campaign content — wired when the billing/campaign API lands. */
  campaign?: { title: string; body: string; href: string; businessName: string } | null;
  className?: string;
}

export function SponsoredSlot({ placement, campaign, className }: SponsoredSlotProps) {
  if (!isPlacementEnabled(placement)) return null;

  // Placeholder state: reserved space, clearly labelled, linking to the
  // future self-serve placement flow.
  if (!campaign) {
    return (
      <aside
        aria-label="Sponsored placement (reserved)"
        className={cn(
          "flex flex-col justify-center gap-1 border border-dashed border-line bg-surface/30 p-4",
          className
        )}
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
          <Megaphone className="h-3 w-3" /> sponsored — reserved placement
        </p>
        <p className="text-xs text-ash">
          Local businesses will appear here via the featured-placement subscription.
        </p>
      </aside>
    );
  }

  return (
    <aside aria-label="Sponsored" className={cn("border border-sun/25 bg-surface/50", className)}>
      <p className="flex items-center gap-1.5 border-b border-line/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/70">
        <Megaphone className="h-3 w-3 text-sun" /> sponsored · {campaign.businessName}
      </p>
      <Link href={campaign.href} className="group block p-4">
        <p className="heading-display text-lg text-gold group-hover:text-sun">{campaign.title}</p>
        <p className="mt-1 text-sm text-ash">{campaign.body}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-sun">Learn more →</span>
      </Link>
    </aside>
  );
}
