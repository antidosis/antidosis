"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, Loader2, X } from "lucide-react";
import { mutate } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

import { statusBadgeVariant } from "./dashboard-nav";

interface ContractItem {
  id: string;
  status: string;
  partyAId?: string;
  partyA?: { id: string };
  partyBSignedAt?: string | null;
  need?: { title: string };
}

export function ContractsPanel({ profileId }: { profileId: string }) {
  const { data: contracts } = useApi<ContractItem[]>("/api/v1/contracts/mine");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancelContract(contractId: string) {
    if (!confirm("Cancel this contract? The need will be archived for you to re-post later."))
      return;
    setCancellingId(contractId);
    try {
      const res = await fetch(`/api/v1/contracts/${contractId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to cancel contract");
        return;
      }
      mutate("/api/v1/contracts/mine");
      mutate("/api/v1/needs/mine");
    } catch {
      alert("Failed to cancel contract");
    } finally {
      setCancellingId(null);
    }
  }

  if (!contracts || contracts.length === 0) {
    return (
      <EmptyState
        title="No contracts yet"
        description="Accept interest from someone on one of your needs to form a binding contract."
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
        return (
          <div
            key={contract.id}
            className={cn(
              "vessel flex items-center justify-between gap-3 p-5 transition-colors hover:bg-raise/40",
              contract.status === "active" || contract.status === "completed"
                ? "border-l-2 border-l-ok/40"
                : contract.status === "cancelled"
                  ? "border-l-2 border-l-bad/40"
                  : "border-l-2 border-l-sun/40"
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-gold">
                {contract.need?.title || "contract"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ash">
                <Badge variant={statusBadgeVariant(contract.status)}>{contract.status}</Badge>
                <span>{isPoster ? "you are the poster" : "you are the fulfiller"}</span>
                {canCancel && (
                  <span className="text-sun">waiting for signature — you can cancel</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {canCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancelContract(contract.id)}
                  disabled={cancellingId === contract.id}
                  className="text-bad hover:bg-bad/10 hover:text-bad"
                  aria-label="Cancel contract"
                >
                  {cancellingId === contract.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/contracts/${contract.id}`} aria-label="Open contract">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
