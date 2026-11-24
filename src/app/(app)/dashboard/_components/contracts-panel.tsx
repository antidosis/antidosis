"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, FilePlus2, Loader2, X } from "lucide-react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import { statusBadgeVariant } from "./dashboard-nav";
import type { DashboardContract } from "./dashboard-types";
import { DirectContractForm } from "./direct-contract-form";

export function ContractsPanel({
  profileId,
  contracts,
}: {
  profileId: string;
  contracts?: DashboardContract[];
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [creatingDirect, setCreatingDirect] = useState(false);

  async function handleCancelContract(contract: DashboardContract) {
    const consequence = contract.need
      ? " The need will be archived for you to re-post later."
      : " No Exchange listing is involved.";
    if (!confirm(`Cancel this contract?${consequence}`)) return;
    setCancellingId(contract.id);
    try {
      const response = await fetch(`/api/v1/contracts/${contract.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to cancel contract");
        return;
      }
      await mutate("/api/v1/contracts/mine");
      if (contract.need) await mutate("/api/v1/needs/mine");
    } catch {
      alert("Failed to cancel contract");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-gold">
            Need an agreement without a public need?
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ash">
            Create a direct agreement, invite someone privately, and use the same terms, signatures,
            messages, completion and reviews.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setCreatingDirect((current) => !current)}
          variant={creatingDirect ? "secondary" : "default"}
          className="w-full shrink-0 sm:w-auto"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          {creatingDirect ? "Close form" : "Create direct agreement"}
        </Button>
      </section>

      {creatingDirect && <DirectContractForm onClose={() => setCreatingDirect(false)} />}

      {!contracts ? (
        <div className="vessel h-32 animate-pulse bg-surface/40" aria-label="Loading agreements" />
      ) : contracts.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="Accept interest on a need, or create a direct agreement above without posting to the Exchange."
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/exchange">Browse needs</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const posterId = contract.partyAId ?? contract.partyA?.id;
            const isPoster = profileId === posterId;
            const fulfillerSigned = !!contract.partyBSignedAt;
            const canCancel =
              isPoster &&
              !fulfillerSigned &&
              (contract.status === "draft" ||
                contract.status === "pending_terms" ||
                contract.status === "active");
            const title =
              contract.kind === "direct"
                ? contract.title || "Direct agreement"
                : contract.need?.title || "Exchange contract";
            const waitingForInvite = contract.kind === "direct" && !contract.partyBId;

            return (
              <article
                key={contract.id}
                className={cn(
                  "vessel flex items-center justify-between gap-3 rounded-lg p-5 transition-colors hover:bg-raise/40",
                  contract.status === "active" || contract.status === "completed"
                    ? "border-l-2 border-l-ok/40"
                    : contract.status === "cancelled"
                      ? "border-l-2 border-l-bad/40"
                      : "border-l-2 border-l-sun/40"
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-medium text-gold">{title}</p>
                    {contract.kind === "direct" && <Badge variant="outline">Direct</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ash">
                    <Badge variant={statusBadgeVariant(contract.status)}>{contract.status}</Badge>
                    <span>
                      {contract.kind === "direct"
                        ? isPoster
                          ? "created by you"
                          : "invited agreement"
                        : isPoster
                          ? "you are the poster"
                          : "you are the fulfiller"}
                    </span>
                    {waitingForInvite && (
                      <span className="text-sun">waiting for invite acceptance</span>
                    )}
                    {canCancel && !waitingForInvite && <span>waiting for signature</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelContract(contract)}
                      disabled={cancellingId === contract.id}
                      className="text-bad hover:bg-bad/10 hover:text-bad"
                      aria-label={`Cancel ${title}`}
                    >
                      {cancellingId === contract.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/contracts/${contract.id}`} aria-label={`Open ${title}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
