import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNeeds } from "@mobile/hooks/useApi";
import { useHaptics } from "@mobile/hooks/useNative";
import { usePullToRefresh } from "@mobile/hooks/usePullToRefresh";
import { mutate } from "swr";
import {
  Search,
  Plus,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  Wrench,
  Package,
  CircleDollarSign,
} from "lucide-react";
import { Vessel, Badge, Button, Input, Divider, Skeleton } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   NEEDS SCREEN — Terminal Directory
   $ ls ~/needs/ with filters, vessel cards, category colors.
   ═══════════════════════════════════════════════════════════════ */

const OFFER_TYPE_LABELS: Record<string, string> = {
  service: "Service",
  item: "Item",
  money: "Money",
};

const OFFER_TYPE_ICONS: Record<string, React.ReactNode> = {
  service: <Wrench size={12} />,
  item: <Package size={12} />,
  money: <CircleDollarSign size={12} />,
};

const OFFER_TYPE_COLORS: Record<string, string> = {
  service: "text-[var(--mercury)] border-[var(--mercury)]/30 bg-[var(--mercury)]/5",
  item: "text-[var(--quintessence)] border-[var(--quintessence)]/30 bg-[var(--quintessence)]/5",
  money: "text-[var(--sun)] border-[var(--sun)]/30 bg-[var(--sun)]/5",
};

const CATEGORY_COLORS: Record<string, string> = {
  goods: "text-[#35e87a] border-[#35e87a]/30 bg-[#35e87a]/5",
  skills: "text-[#33d4f5] border-[#33d4f5]/30 bg-[#33d4f5]/5",
  money: "text-[#f0cc33] border-[#f0cc33]/30 bg-[#f0cc33]/5",
  social: "text-[#f57633] border-[#f57633]/30 bg-[#f57633]/5",
  lifestyle: "text-[#d76bf5] border-[#d76bf5]/30 bg-[#d76bf5]/5",
  wildcard: "text-[#f54d99] border-[#f54d99]/30 bg-[#f54d99]/5",
};

export function NeedsScreen() {
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("");
  const [page, setPage] = useState(1);

  const query = {
    q: searchQuery || undefined,
    type: activeType || undefined,
    page,
    limit: 20,
  };
  const { data, error, isLoading, isValidating } = useNeeds(query);

  const { containerRef, indicator, handlers } = usePullToRefresh({
    onRefresh: async () => {
      await mutate(["needs", query]);
    },
  });

  const needs = data?.needs ?? [];
  const hasMore = data ? page < data.totalPages : false;
  const availableTypes = data?.availableFilters?.offerTypes ?? [];

  const loadMore = useCallback(() => {
    if (hasMore && !isValidating) {
      tap("light");
      setPage((p) => p + 1);
    }
  }, [hasMore, isValidating, tap]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleTypeFilter = (type: string) => {
    tap("light");
    setActiveType(activeType === type ? "" : type);
    setPage(1);
  };

  return (
    <div
      ref={containerRef}
      {...handlers}
      className="min-h-full pb-24 pt-4 safe-top overflow-y-auto"
    >
      {indicator}
      {/* Header */}
      <div className="px-4 mb-4 max-w-3xl mx-auto">
        <p className="font-mono text-xs text-[var(--leather)] mb-1">$ ls ~/needs/</p>
        <h1 className="heading-display text-xl text-[var(--gold)] mb-4">Browse Needs</h1>

        <Input
          icon={<Search size={16} />}
          placeholder="Search needs..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          rightElement={
            searchQuery ? (
              <button
                onClick={() => handleSearch("")}
                className="text-[var(--leather)] hover:text-[var(--parchment)]"
              >
                ×
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Filter Vessel */}
      <div className="px-4 mb-4">
        <Vessel className="p-3">
          {/* Type toggles */}
          <div className="flex gap-1.5 mb-3">
            <FilterPill active={activeType === ""} onClick={() => handleTypeFilter("")}>
              All
            </FilterPill>
            {availableTypes.map((type) => (
              <FilterPill
                key={type}
                active={activeType === type}
                onClick={() => handleTypeFilter(type)}
              >
                {OFFER_TYPE_LABELS[type] ?? type}
              </FilterPill>
            ))}
          </div>

          {/* Active filters */}
          {(searchQuery || activeType) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider">
                Filters:
              </span>
              {searchQuery && (
                <Badge variant="mercury">
                  <Search size={10} className="mr-1" />
                  {searchQuery}
                </Badge>
              )}
              {activeType && <Badge variant="default">{OFFER_TYPE_LABELS[activeType]}</Badge>}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveType("");
                  setPage(1);
                }}
                className="font-mono text-[10px] text-[var(--ruby)] underline"
              >
                clear all
              </button>
            </div>
          )}
        </Vessel>
      </div>

      {/* Info banner */}
      <div className="px-4 mb-4 max-w-3xl mx-auto">
        <div className="flex items-start gap-2 p-3 rounded-md bg-[var(--mercury)]/5 border border-[var(--mercury)]/20">
          <Sparkles size={14} className="text-[var(--mercury)] shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-xs text-[var(--mercury)]">Exchange anything</p>
            <p className="font-mono text-[10px] text-[var(--leather)]">
              Goods, skills, money, social — post what you need.
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 max-w-3xl mx-auto space-y-3">
        {isLoading && needs.length === 0 && <NeedsSkeleton />}

        {error && (
          <Vessel variant="default" className="p-4 text-center">
            <p className="font-mono text-sm text-[var(--ruby)]">$ error: {error.message}</p>
          </Vessel>
        )}

        {!isLoading && needs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SlidersHorizontal size={24} className="text-[var(--leather)] mb-3" />
            <p className="font-mono text-sm text-[var(--parchment)]">No needs found</p>
            <p className="font-mono text-xs text-[var(--leather)] mt-1">
              Try adjusting your search
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {needs.map((need) => (
            <NeedCard
              key={need.id}
              need={need}
              onClick={() => {
                tap("light");
                navigate(`/needs/${need.id}`);
              }}
            />
          ))}
        </div>

        {hasMore && (
          <Button variant="secondary" className="w-full" onClick={loadMore} disabled={isValidating}>
            {isValidating ? (
              <>
                <span className="w-3 h-3 rounded-full border border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Load more
              </>
            )}
          </Button>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          tap("medium");
          navigate("/needs/new");
        }}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-[var(--sun)] text-[var(--void)] flex items-center justify-center shadow-[0_0_20px_rgba(245,166,35,0.3)] tap-highlight-none active:scale-90 transition-transform z-40"
        aria-label="Post new need"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-md font-mono text-[10px] font-medium uppercase tracking-wider
        border tap-highlight-none transition-all
        ${
          active
            ? "bg-[var(--void-hover)] border-[var(--sun)] text-[var(--sun)]"
            : "bg-transparent border-[var(--bronze)] text-[var(--leather)] hover:border-[var(--bronze-hover)] hover:text-[var(--parchment)]"
        }
      `}
    >
      {children}
    </button>
  );
}

function NeedCard({
  need,
  onClick,
}: {
  need: import("@mobile/types/api").Need;
  onClick: () => void;
}) {
  const typeStyle = OFFER_TYPE_COLORS[need.offerType] ?? OFFER_TYPE_COLORS.service;
  const catStyle = need.category?.slug ? CATEGORY_COLORS[need.category.slug] : undefined;

  return (
    <Vessel variant="default" interactive className="overflow-hidden" onClick={onClick}>
      {/* Image */}
      {need.images?.length > 0 && (
        <div className="h-28 bg-[var(--void-input)] border-b border-[var(--bronze)] flex items-center justify-center">
          <img src={need.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-[var(--gold)] group-hover:text-[var(--sun)] leading-snug">
            {need.title}
          </h3>
        </div>

        {/* Category + Type badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {need.category?.name && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide border ${catStyle ?? typeStyle}`}
            >
              {need.category.name}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide border ${typeStyle}`}
          >
            {OFFER_TYPE_ICONS[need.offerType]}
            {OFFER_TYPE_LABELS[need.offerType] ?? need.offerType}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--parchment)] mb-3 line-clamp-2 leading-relaxed">
          {need.offerDescription ?? need.description}
        </p>

        {/* Skills */}
        {need.requiredSkills && need.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {need.requiredSkills.slice(0, 3).map((sk) => (
              <span
                key={sk.id}
                className="px-1.5 py-0.5 rounded bg-[var(--void-hover)] border border-[var(--bronze)] text-[10px] text-[var(--leather)]"
              >
                {sk.name}
              </span>
            ))}
            {need.requiredSkills.length > 3 && (
              <span className="text-[10px] text-[var(--leather)]">
                +{need.requiredSkills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <Divider className="mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/20 flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold text-[var(--sun)]">
                {need.poster?.fullName?.charAt(0) ?? "?"}
              </span>
            </div>
            <span className="font-mono text-[11px] text-[var(--parchment)]">
              {need.poster?.fullName ?? "Anonymous"}
            </span>
            {need.poster && need.poster.ratingAvg > 0 && (
              <span className="font-mono text-[10px] text-[var(--sun)]">
                ★ {need.poster.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>
          {need.locationName && (
            <div className="flex items-center gap-1 text-[var(--leather)]">
              <MapPin size={10} />
              <span className="font-mono text-[10px]">{need.locationName}</span>
            </div>
          )}
        </div>
      </div>
    </Vessel>
  );
}

function NeedsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Vessel key={i} className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </Vessel>
      ))}
    </div>
  );
}
