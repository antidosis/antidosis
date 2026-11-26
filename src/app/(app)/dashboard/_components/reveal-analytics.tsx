"use client";

import { Eye } from "lucide-react";

import { useApi } from "@/lib/swr-config";

interface RevealAnalyticsData {
  total: number;
  last30d: number;
  byScope: { listing: number; personal: number };
  byField: { phone: number; email: number; website: number; socials: number };
  lastRevealAt: string | null;
}

const FIELD_LABELS: [keyof RevealAnalyticsData["byField"], string][] = [
  ["phone", "Phone"],
  ["email", "Email"],
  ["website", "Website"],
  ["socials", "Social links"],
];

/**
 * The owner's view of their own contact-reveal audit: how many logged-in
 * members revealed their details in the last 30 days, on this surface, and
 * which fields they took. Hidden until the first reveal — an empty counter
 * is noise, not information.
 */
export function RevealAnalytics({ scope }: { scope: "listing" | "personal" }) {
  const { data } = useApi<RevealAnalyticsData>("/api/v1/profiles/me/reveal-analytics");
  if (!data || data.byScope[scope] === 0) return null;

  const fields = FIELD_LABELS.filter(([key]) => data.byField[key] > 0);

  return (
    <div className="vessel rounded-lg border-line/70 p-4">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
        <Eye className="h-3.5 w-3.5 text-mercury" />
        Contact reveals — last 30 days
      </p>
      <p className="heading-display mt-2 text-2xl text-gold">{data.byScope[scope]}</p>
      <p className="mt-0.5 text-xs text-ash">
        logged-in member{data.byScope[scope] === 1 ? "" : "s"} revealed your{" "}
        {scope === "listing" ? "listing" : "profile"} contact details
      </p>
      {fields.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {fields.map(([key, label]) => (
            <span
              key={key}
              className="rounded border border-line bg-inset/60 px-2 py-0.5 text-[11px] text-parchment"
            >
              {label} · {data.byField[key]}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-ash/70">
        Every reveal is a logged-in member and is recorded — bulk harvesting is rate-limited and
        blocked.
      </p>
    </div>
  );
}
