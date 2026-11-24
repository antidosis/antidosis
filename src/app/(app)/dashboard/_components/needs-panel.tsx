"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Bookmark,
  ChevronDown,
  Eye,
  HandHelping,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import { statusBadgeVariant } from "./dashboard-nav";
import type { DashboardNeed } from "./dashboard-types";

export function NeedsPanel({
  isBusiness,
  needs,
}: {
  isBusiness: boolean;
  needs?: DashboardNeed[];
}) {
  const [view, setView] = useState<"active" | "archived">("active");
  const [performanceId, setPerformanceId] = useState<string | null>(null);

  async function handleRepostNeed(needId: string) {
    if (!confirm("Re-post this need? It will become visible to everyone again.")) return;
    try {
      const res = await fetch(`/api/v1/needs/${needId}/repost`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to re-post");
        return;
      }
      await mutate("/api/v1/needs/mine");
    } catch {
      alert("Failed to re-post");
    }
  }

  if (!needs) {
    return (
      <div className="space-y-3" aria-label="Loading your needs">
        {[0, 1, 2].map((item) => (
          <div key={item} className="vessel h-32 animate-pulse bg-surface/40" />
        ))}
      </div>
    );
  }

  const activeNeeds = needs.filter((need) => need.status !== "archived");
  const archivedNeeds = needs.filter((need) => need.status === "archived");
  const visibleNeeds = view === "active" ? activeNeeds : archivedNeeds;

  if (needs.length === 0) {
    return (
      <EmptyState
        title={isBusiness ? "No tasks posted" : "No needs posted"}
        description={
          isBusiness
            ? "Post a task and pick from locals who express interest."
            : "Post your first need to start exchanging. Views, watchers and interest will appear on the post here."
        }
        action={
          <Button asChild size="sm">
            <Link href="/needs/new">{isBusiness ? "Post a task" : "Post a need"}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-aero/20 bg-aero/[0.045] p-3">
        <div role="tablist" aria-label="Need status" className="flex gap-1">
          {(["active", "archived"] as const).map((folder) => (
            <button
              key={folder}
              type="button"
              role="tab"
              aria-selected={view === folder}
              onClick={() => setView(folder)}
              className={cn(
                "min-h-10 rounded px-3 py-2 text-sm capitalize transition-colors",
                view === folder ? "bg-surface text-gold shadow-sm" : "text-ash hover:text-parchment"
              )}
            >
              {folder} ({folder === "active" ? activeNeeds.length : archivedNeeds.length})
            </button>
          ))}
        </div>
        <Button asChild size="sm">
          <Link href="/needs/new">
            <Plus className="h-4 w-4" /> {isBusiness ? "Post task" : "Post need"}
          </Link>
        </Button>
      </div>

      {visibleNeeds.length === 0 ? (
        <EmptyState
          title={view === "active" ? "Nothing active" : "No archived needs"}
          description={
            view === "active"
              ? "Create a new need or re-post an archived one."
              : "Cancelled and archived posts will be kept here."
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleNeeds.map((need) => {
            const views = need._count?.views ?? 0;
            const watches = need._count?.watches ?? 0;
            const interest = need._count?.acceptances ?? 0;
            const ready = need.acceptances?.length ?? 0;
            const performanceOpen = performanceId === need.id;
            const responseRate =
              views > 0 ? Math.min(100, Math.round((interest / views) * 100)) : null;

            return (
              <article key={need.id} className="vessel overflow-hidden rounded-lg bg-surface/45">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadgeVariant(need.status)}>{need.status}</Badge>
                        <span className="text-xs text-ash">
                          {new Date(need.createdAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <Link
                        href={`/needs/${need.id}`}
                        className="mt-2 block text-base font-medium leading-snug text-gold transition-colors hover:text-sun sm:text-lg"
                      >
                        {need.title}
                      </Link>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {need.status === "archived" && (
                        <>
                          <Button size="sm" variant="ghost" asChild className="px-2 text-parchment">
                            <Link href={`/needs/${need.id}/edit`} aria-label={`Edit ${need.title}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRepostNeed(need.id)}
                            className="px-2 text-ok"
                            aria-label={`Re-post ${need.title}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" asChild className="px-2">
                        <Link href={`/needs/${need.id}`} aria-label={`Open ${need.title}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Views",
                        value: views,
                        icon: Eye,
                        tone: "text-aero border-aero/20 bg-aero/[0.05]",
                      },
                      {
                        label: "Watching",
                        value: watches,
                        icon: Bookmark,
                        tone: "text-mercury border-mercury/20 bg-mercury/[0.05]",
                      },
                      {
                        label: "Interested",
                        value: interest,
                        icon: HandHelping,
                        tone: "text-ok border-ok/20 bg-ok/[0.05]",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={cn("rounded-md border p-2.5 sm:p-3", stat.tone)}
                      >
                        <stat.icon className="mb-1 h-3.5 w-3.5 opacity-80" />
                        <p className="text-xl font-semibold leading-none">{stat.value}</p>
                        <p className="mt-1 text-[11px] opacity-90 sm:text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPerformanceId(performanceOpen ? null : need.id)}
                    aria-expanded={performanceOpen}
                    aria-controls={`need-performance-${need.id}`}
                    className="mt-3 flex min-h-9 w-full items-center justify-between rounded px-2 text-left text-xs text-ash transition-colors hover:bg-raise hover:text-gold"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" /> Post performance
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        performanceOpen && "rotate-180"
                      )}
                    />
                  </button>
                </div>

                {performanceOpen && (
                  <div
                    id={`need-performance-${need.id}`}
                    className="grid grid-cols-2 gap-3 border-t border-line/60 bg-inset/35 p-4 sm:grid-cols-4 sm:px-5"
                  >
                    <div>
                      <p className="text-xs text-ash">View → interest</p>
                      <p className="mt-1 text-lg text-gold">
                        {responseRate === null ? "—" : `${responseRate}%`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ash">Ready to contract</p>
                      <p className="mt-1 text-lg text-ok">{ready}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ash">Total signals</p>
                      <p className="mt-1 text-lg text-gold">{views + watches + interest}</p>
                    </div>
                    <div className="flex items-end">
                      <Button asChild variant="secondary" size="sm" className="w-full">
                        <Link href={`/needs/${need.id}`}>Manage responses</Link>
                      </Button>
                    </div>
                    <p className="col-span-2 text-xs leading-relaxed text-ash sm:col-span-4">
                      Views count visits to your post. Watching means a member follows its activity.
                      Interest is someone offering to help.
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
