"use client";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  HandHelping,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import { statusBadgeVariant } from "./dashboard-nav";

interface NeedItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { acceptances?: number };
  acceptances?: unknown[];
}

interface ContractItem {
  id: string;
  status: string;
}

interface OfferItem {
  id: string;
  status: string;
  need?: { id: string; title: string };
}

interface AnalyticsProfile {
  id: string;
  accountType: "individual" | "business";
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function AnalyticsPanel({ profile }: { profile: AnalyticsProfile }) {
  const { data: needs } = useApi<NeedItem[]>("/api/v1/needs/mine");
  const { data: contracts } = useApi<ContractItem[]>("/api/v1/contracts/mine");
  const { data: offers } = useApi<OfferItem[]>("/api/v1/acceptances/mine");

  const isBusiness = profile.accountType === "business";
  const allNeeds = needs ?? [];
  const activeNeeds = allNeeds.filter((n) => n.status !== "archived");

  const interestReceived = allNeeds.reduce((sum, n) => sum + (n._count?.acceptances ?? 0), 0);
  const needsWithInterest = allNeeds.filter((n) => (n._count?.acceptances ?? 0) > 0).length;
  const responseRate = allNeeds.length > 0 ? (needsWithInterest / allNeeds.length) * 100 : null;
  const readyToContract = allNeeds.reduce((sum, n) => sum + (n.acceptances?.length ?? 0), 0);
  const contracted = allNeeds.filter((n) => n.status === "contracted").length;
  const completedPosted = allNeeds.filter((n) => n.status === "completed").length;

  const contractsList = contracts ?? [];
  const contractsCompleted = contractsList.filter((c) => c.status === "completed").length;
  const contractsActive = contractsList.filter((c) => c.status === "active").length;

  const offersList = offers ?? [];
  const offersAccepted = offersList.filter(
    (o) => o.status === "accepted" || o.status === "selected"
  ).length;
  const offersPending = offersList.filter((o) => o.status === "pending").length;

  const funnel = [
    {
      label: isBusiness ? "Tasks posted" : "Needs posted",
      value: allNeeds.length,
      hint: `${activeNeeds.length} currently active`,
    },
    {
      label: "Interest received",
      value: interestReceived,
      hint:
        responseRate === null
          ? "post something to start"
          : `${Math.round(responseRate)}% of posts got a response`,
    },
    {
      label: "Ready to contract",
      value: readyToContract,
      hint: "interests you accepted",
    },
    {
      label: "Contracted",
      value: contracted,
      hint: "agreement in force",
    },
    {
      label: "Completed",
      value: completedPosted,
      hint: "posted needs fulfilled",
    },
  ];

  const hasAnyActivity = allNeeds.length > 0 || contractsList.length > 0 || offersList.length > 0;

  return (
    <div className="space-y-6">
      {!hasAnyActivity && (
        <EmptyState
          title="No activity to analyse yet"
          description="Post a need, express interest, or form a contract — your funnel builds from there."
          action={
            <Button asChild size="sm">
              <Link href="/needs/new">{isBusiness ? "Post a task" : "Post a need"}</Link>
            </Button>
          }
        />
      )}

      {/* Reputation row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Rating",
            value: profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—",
            sub: profile.ratingCount > 0 ? `${profile.ratingCount} reviews` : "no reviews yet",
            icon: Star,
            cls: "text-sun border-sun/20 bg-sun/5",
          },
          {
            label: "Jobs completed",
            value: String(profile.jobsCompleted),
            sub: "both sides of the deal",
            icon: CheckCircle2,
            cls: "text-ok border-ok/20 bg-ok/5",
          },
          {
            label: "Contracts",
            value: String(contractsList.length),
            sub: `${contractsActive} active · ${contractsCompleted} completed`,
            icon: FileText,
            cls: "text-mercury border-mercury/20 bg-mercury/5",
          },
          {
            label: "Offers made",
            value: String(offersList.length),
            sub: `${offersAccepted} accepted · ${offersPending} pending`,
            icon: HandHelping,
            cls: "text-orchid border-orchid/20 bg-orchid/5",
          },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded border p-3.5", stat.cls)}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider opacity-90">{stat.label}</p>
              <stat.icon className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            <p className="text-xs opacity-80">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Posting funnel */}
      {allNeeds.length > 0 && (
        <section className="vessel p-5">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
            {isBusiness ? "task funnel" : "posting funnel"}
          </p>
          <div className="grid gap-2 sm:grid-cols-5">
            {funnel.map((step, i) => (
              <div key={step.label} className="relative rounded border border-line bg-raise/40 p-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-ash/60">
                  stage {i + 1}
                </p>
                <p className="mt-1 text-xl font-bold text-gold">{step.value}</p>
                <p className="text-[11px] text-parchment">{step.label}</p>
                <p className="mt-0.5 text-xs text-ash">{step.hint}</p>
                {i < funnel.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ash sm:block"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-post table */}
      {allNeeds.length > 0 && (
        <section className="vessel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
              per-post performance
            </p>
            <BarChart3 className="h-3.5 w-3.5 text-ash" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line/60 text-xs uppercase tracking-wider text-ash">
                  <th className="px-5 py-2.5 font-medium">post</th>
                  <th className="px-3 py-2.5 font-medium">status</th>
                  <th className="px-3 py-2.5 text-right font-medium">interested</th>
                  <th className="px-3 py-2.5 text-right font-medium">ready</th>
                  <th className="px-3 py-2.5 text-right font-medium">age</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {allNeeds.map((need) => (
                  <tr key={need.id} className="transition-colors hover:bg-raise/30">
                    <td className="max-w-[240px] truncate px-5 py-3 text-parchment">
                      {need.title}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={statusBadgeVariant(need.status)}>{need.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ash">
                      {need._count?.acceptances ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ok">
                      {need.acceptances?.length ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ash">
                      {daysSince(need.createdAt)}d
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/needs/${need.id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-mercury hover:underline"
                      >
                        view <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fulfilment side */}
      {offersList.length > 0 && (
        <section className="vessel p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
            fulfilment side — offers you made
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "pending", value: offersPending, cls: "text-ash border-line" },
              {
                label: "accepted / contracted",
                value: offersAccepted,
                cls: "text-ok border-ok/30 bg-ok/5",
              },
              {
                label: "declined",
                value: offersList.filter((o) => o.status === "declined").length,
                cls: "text-bad border-bad/30 bg-bad/5",
              },
            ].map((row) => (
              <div key={row.label} className={cn("rounded border p-3", row.cls)}>
                <p className="text-xl font-bold">{row.value}</p>
                <p className="text-xs opacity-80">{row.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ash">
            <Users className="mr-1 inline h-3 w-3" />
            Acceptance rate:{" "}
            {offersList.length > 0
              ? `${Math.round((offersAccepted / offersList.length) * 100)}%`
              : "—"}
            {offersAccepted < offersList.length &&
              offersList.length >= 3 &&
              " — a complete profile and credentials lift this number"}
          </p>
        </section>
      )}
    </div>
  );
}
