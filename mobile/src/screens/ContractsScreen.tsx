import { useNavigate } from "react-router-dom";
import { useMyContracts } from "@mobile/hooks/useApi";
import { usePullToRefresh } from "@mobile/hooks/usePullToRefresh";
import { mutate } from "swr";
import { FileText, ArrowLeft, Lock, Unlock, CheckCircle } from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Vessel, Badge, Skeleton } from "@mobile/components/ui";
import type { BadgeVariant } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   CONTRACTS SCREEN — Terminal Contract Directory
   $ ls ~/contracts/ with status-colored vessel borders.
   ═══════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, { border: string; badge: BadgeVariant; label: string }> = {
  draft: { border: "border-l-[var(--leather)]/40", badge: "outline", label: "Draft" },
  pending_terms: {
    border: "border-l-[var(--amber-alert)]/40",
    badge: "warning",
    label: "Pending Terms",
  },
  active: { border: "border-l-[var(--emerald)]/40", badge: "success", label: "Active" },
  pending_completion: {
    border: "border-l-[var(--mercury)]/40",
    badge: "mercury",
    label: "Pending Completion",
  },
  completed: {
    border: "border-l-[var(--quintessence)]/40",
    badge: "quintessence",
    label: "Completed",
  },
  cancelled: { border: "border-l-[var(--ruby)]/40", badge: "destructive", label: "Cancelled" },
};

export function ContractsScreen() {
  const navigate = useNavigate();
  const { data: contracts, isLoading } = useMyContracts();

  const { containerRef, indicator, handlers } = usePullToRefresh({
    onRefresh: async () => {
      await mutate("my-contracts");
    },
  });

  return (
    <div ref={containerRef} {...handlers} className="min-h-full pb-6 pt-4 safe-top overflow-y-auto">
      {indicator}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4 max-w-3xl mx-auto">
        <button
          onClick={() => {
            hapticImpact("light");
            if (window.history.length > 1) navigate(-1);
            else navigate("/");
          }}
          className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-mono text-[10px] text-[var(--leather)]">$ ls ~/contracts/</p>
          <h1 className="heading-display text-xl text-[var(--gold)]">My Contracts</h1>
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 max-w-3xl mx-auto">
        {isLoading && <ContractsSkeleton />}

        {!isLoading && (!contracts || contracts.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={24} className="text-[var(--leather)] mb-3" />
            <p className="font-mono text-sm text-[var(--parchment)]">No contracts yet</p>
            <p className="font-mono text-xs text-[var(--leather)] mt-1">
              Find a need and express interest to start a deal
            </p>
          </div>
        )}

        {contracts?.map((contract) => {
          const status = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.draft;
          const bothSigned = contract.partyASignedAt && contract.partyBSignedAt;

          return (
            <Vessel
              key={contract.id}
              variant="default"
              interactive
              className={`p-4 border-l-2 ${status.border}`}
              onClick={() => {
                hapticImpact("light");
                navigate(`/contracts/${contract.id}`);
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-[var(--gold)] leading-snug">
                  {contract.need?.title ?? "Untitled Contract"}
                </h3>
                <Badge variant={status.badge} className="shrink-0">
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-[var(--leather)] mb-2">
                <FileText size={12} />
                <span className="font-mono text-[11px]">
                  {contract.partyA?.fullName ?? "Party A"} ↔{" "}
                  {contract.partyB?.fullName ?? "Party B"}
                </span>
              </div>

              {/* Signature status */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                  {contract.partyASignedAt ? (
                    <>
                      <CheckCircle size={10} className="text-[var(--emerald)]" />
                      <span className="text-[var(--emerald)]">A signed</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={10} className="text-[var(--leather)]" />
                      <span className="text-[var(--leather)]">A pending</span>
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                  {contract.partyBSignedAt ? (
                    <>
                      <CheckCircle size={10} className="text-[var(--emerald)]" />
                      <span className="text-[var(--emerald)]">B signed</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={10} className="text-[var(--leather)]" />
                      <span className="text-[var(--leather)]">B pending</span>
                    </>
                  )}
                </span>
                {bothSigned && <Lock size={10} className="text-[var(--sun)]" />}
              </div>
            </Vessel>
          );
        })}
      </div>
    </div>
  );
}

function ContractsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Vessel key={i} className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </Vessel>
      ))}
    </div>
  );
}
