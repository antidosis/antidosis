"use client";

import Link from "next/link";

import { ArrowRight, Pencil, RotateCcw } from "lucide-react";
import { mutate } from "swr";

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
  _count?: { acceptances?: number };
  acceptances?: unknown[];
}

export function NeedsPanel({ isBusiness }: { isBusiness: boolean }) {
  const { data: needs } = useApi<NeedItem[]>("/api/v1/needs/mine");

  async function handleRepostNeed(needId: string) {
    if (!confirm("Re-post this need? It will become visible to everyone again.")) return;
    try {
      const res = await fetch(`/api/v1/needs/${needId}/repost`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to re-post");
        return;
      }
      mutate("/api/v1/needs/mine");
    } catch {
      alert("Failed to re-post");
    }
  }

  if (!needs || needs.length === 0) {
    return (
      <EmptyState
        title={isBusiness ? "No tasks posted" : "No needs posted"}
        description={
          isBusiness
            ? "Post a task and pick from verified locals who express interest."
            : "Post your first need to start exchanging."
        }
        action={
          <Button asChild size="sm">
            <Link href="/needs/new">{isBusiness ? "Post a task" : "Post a need"}</Link>
          </Button>
        }
      />
    );
  }

  const activeNeeds = needs.filter((n) => n.status !== "archived");
  const archivedNeeds = needs.filter((n) => n.status === "archived");

  return (
    <div className="space-y-8">
      {activeNeeds.length === 0 ? (
        <EmptyState
          title="Nothing active"
          description="All your posts are archived. Re-post one below or create a new one."
          action={
            <Button asChild size="sm">
              <Link href="/needs/new">{isBusiness ? "Post a task" : "Post a need"}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {activeNeeds.map((need) => (
            <div
              key={need.id}
              className="vessel group flex items-center justify-between gap-3 p-5 transition-colors hover:bg-raise/40"
            >
              <div className="min-w-0">
                <Link
                  href={`/needs/${need.id}`}
                  className="block truncate text-base font-medium text-gold transition-colors hover:text-sun"
                >
                  {need.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ash">
                  <Badge variant={statusBadgeVariant(need.status)}>{need.status}</Badge>
                  <span>{need._count?.acceptances || 0} interested</span>
                  {need.acceptances && need.acceptances.length > 0 && (
                    <span className="text-ok">{need.acceptances.length} ready to contract</span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/needs/${need.id}`} aria-label={`Open ${need.title}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {archivedNeeds.length > 0 && (
        <section>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
            archived — cancelled contracts
          </p>
          <div className="space-y-3">
            {archivedNeeds.map((need) => (
              <div
                key={need.id}
                className="vessel flex items-center justify-between gap-3 border-l-2 border-l-leather/40 p-4 opacity-80"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-parchment">{need.title}</p>
                  <Badge variant="outline" className="mt-1">
                    archived
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" asChild className="text-parchment">
                    <Link href={`/needs/${need.id}/edit`} aria-label={`Edit ${need.title}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRepostNeed(need.id)}
                    className={cn("text-ok")}
                    aria-label={`Re-post ${need.title}`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
