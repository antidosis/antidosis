"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { searchSkills } from "@/lib/skills-taxonomy";
import { useApi } from "@/lib/swr-config";
import { MapPin, ArrowRight, CircleDollarSign, Wrench, Package, Search, Loader2, X, Info, ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react";
import { EXCHANGE_MODES, INCOMPATIBLE_EXCHANGE_MODES, getExchangeMode } from "@/lib/categories";

type NeedItem = {
  id: string;
  title: string;
  description: string;
  needCategory: string | null;
  offerType: string;
  offerDescription: string;
  isLocal: boolean;
  locationName: string | null;
  poster: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    locationName: string | null;
  };
  requiredSkills: { id: string; name: string }[];
  _count: { acceptances: number };
};

const offerTypes = [
  { value: "", label: "All" },
  { value: "service", label: "Service" },
  { value: "item", label: "Item" },
  { value: "money", label: "Money" },
];

const PAGE_SIZE = 12;

export default function NeedsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page when filters change + clear category if incompatible with new type
  useEffect(() => {
    setPage(1);
    if (categoryFilter && typeFilter) {
      const incompatible = INCOMPATIBLE_EXCHANGE_MODES[typeFilter] || [];
      if (incompatible.includes(categoryFilter)) {
        setCategoryFilter("");
      }
    }
  }, [typeFilter, categoryFilter]);

  // Build SWR key from filters
  const needsKey = (() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (typeFilter) params.set("type", typeFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (skillFilter) params.set("skill", skillFilter);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    return `/api/v1/needs?${params.toString()}`;
  })();

  const { data: needsData, isLoading: loading } = useApi<{
    needs: NeedItem[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
    availableFilters: {
      offerTypes: string[];
      categories: string[];
      skills: string[];
    };
  }>(needsKey);

  const { data: recData } = useApi<{
    needs: NeedItem[];
    matchInfo: { needId: string; matchCount: number; matchingSkillNames: string[] }[];
  }>("/api/v1/needs/recommended");

  const needs = needsData?.needs || [];
  const total = needsData?.total || 0;
  const totalPages = needsData?.totalPages || 1;
  const availableCategories = needsData?.availableFilters?.categories || [];
  const availableSkills = needsData?.availableFilters?.skills || [];

  // Skill input suggestions — only suggest skills that exist in real posts
  useEffect(() => {
    const skillsPool = needsData?.availableFilters?.skills || [];
    if (skillInput.trim()) {
      const matches = searchSkills(skillInput);
      setSkillSuggestions(
        skillsPool.length > 0
          ? matches.filter((s) => skillsPool.includes(s))
          : matches
      );
      setShowSkillDropdown(true);
    } else {
      setSkillSuggestions([]);
      setShowSkillDropdown(false);
    }
  }, [skillInput, needsData?.availableFilters?.skills]);

  const recMatchInfo: Record<string, { matchCount: number; matchingSkillNames: string[] }> = {};
  (recData?.matchInfo || []).forEach((m) => {
    recMatchInfo[m.needId] = { matchCount: m.matchCount, matchingSkillNames: m.matchingSkillNames };
  });

  const offerIcons = {
    service: <Wrench className="h-3 w-3" />,
    item: <Package className="h-3 w-3" />,
    money: <CircleDollarSign className="h-3 w-3" />,
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const activeFiltersCount = [
    debouncedQuery,
    typeFilter,
    categoryFilter,
    skillFilter,
  ].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-10">
        <div>
          <h1 className="heading-display text-2xl text-[#e8d5a3]">Browse Needs</h1>
          <p className="text-xs text-[#7a6b5a] mt-3">$ ls ~/needs/</p>
          <p className="text-sm text-[#b8a078] mt-2">find needs you can fulfill — for services, items, or money in return</p>
        </div>
        <Button asChild variant="default">
          <Link href="/needs/new">Post Need <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-[#00e5ff] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-[#e8d5a3] font-medium">Central Coast NSW pilot</p>
            <p className="text-xs text-[#7a6b5a] mt-1">all needs are local to the Central Coast region during the trial. remote exchanges will be available soon.</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recData && recData.needs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#f5a623]" />
            <h2 className="text-sm font-medium text-[#e8d5a3]">Recommended for you</h2>
            <span className="text-[10px] text-[#7a6b5a] uppercase tracking-wider">
              based on your skills
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recData.needs.slice(0, 4).map((need) => {
              const match = recMatchInfo[need.id];
              return (
                <Link
                  key={need.id}
                  href={`/needs/${need.id}`}
                  className="vessel p-4 hover:bg-[#1a1714] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors line-clamp-1">
                        {need.title}
                      </h3>
                      <p className="text-xs text-[#b8a078] mt-1 line-clamp-1">
                        {need.description}
                      </p>
                      {match && match.matchingSkillNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {match.matchingSkillNames.map((name) => (
                            <span
                              key={name}
                              className="px-1.5 py-0.5 text-[10px] text-[#f5a623] bg-[#f5a623]/10 border border-[#f5a623]/20 rounded"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-[#7a6b5a] uppercase tracking-wide">
                      {need._count.acceptances} interested
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#2a2420]">
                    <Avatar src={need.poster.avatarUrl} name={need.poster.fullName} size="sm" />
                    <span className="text-xs text-[#b8a078]">
                      {need.poster.fullName || "anonymous"}
                    </span>
                    <span className="text-[10px] text-[#7a6b5a] ml-auto flex items-center gap-1">
                      {offerIcons[need.offerType as keyof typeof offerIcons]}
                      {need.offerType}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="vessel p-5 mb-8">
        {/* Search + type + skill row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a6b5a]" />
            <Input placeholder="search_needs..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            {query && (
              <Button variant="ghost" size="icon" onClick={() => setQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-[#7a6b5a] hover:text-[#e8d5a3]">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Skill filter */}
          <div className="relative sm:w-56">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#f5a623]" />
            <Input
              placeholder="filter by skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && skillInput.trim()) {
                  setSkillFilter(skillInput.trim());
                  setSkillInput("");
                  setShowSkillDropdown(false);
                }
              }}
              onFocus={() => { if (skillSuggestions.length > 0) setShowSkillDropdown(true); }}
              className="pl-9"
            />
            {skillFilter && (
              <button
                onClick={() => { setSkillFilter(""); setSkillInput(""); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7a6b5a] hover:text-[#ff5252] uppercase tracking-wider"
              >
                clear
              </button>
            )}
            {/* Skill dropdown */}
            {showSkillDropdown && skillSuggestions.length > 0 && !skillFilter && (
              <div className="absolute z-50 mt-1 w-full rounded border border-[#2a2420] bg-[#14110e] shadow-lg max-h-48 overflow-y-auto">
                {skillSuggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setSkillFilter(skill);
                      setSkillInput("");
                      setShowSkillDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#b8a078] hover:bg-[#2a2420] hover:text-[#e8d5a3] transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="h-3 w-3 text-[#f5a623] opacity-60" />
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {offerTypes.map((type) => (
              <Button
                key={type.value}
                variant={typeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Active filters bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#2a2420]">
            <span className="text-[10px] uppercase tracking-wider text-[#7a6b5a]">active filters:</span>
            {debouncedQuery && (
              <span className="inline-flex items-center gap-1 text-xs text-[#e8d5a3] bg-[#1a1714] border border-[#2a2420] rounded px-2 py-0.5">
                search: {debouncedQuery}
                <button onClick={() => setQuery("")} className="text-[#7a6b5a] hover:text-[#ff5252]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {skillFilter && (
              <span className="inline-flex items-center gap-1 text-xs text-[#f5a623] bg-[#1a1714] border border-[#f5a623]/30 rounded px-2 py-0.5">
                <Sparkles className="h-3 w-3" />
                {skillFilter}
                <button onClick={() => { setSkillFilter(""); setSkillInput(""); }} className="text-[#7a6b5a] hover:text-[#ff5252]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 text-xs text-[#e8d5a3] bg-[#1a1714] border border-[#2a2420] rounded px-2 py-0.5">
                type: {typeFilter}
                <button onClick={() => setTypeFilter("")} className="text-[#7a6b5a] hover:text-[#ff5252]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1 text-xs text-[#e8d5a3] bg-[#1a1714] border border-[#2a2420] rounded px-2 py-0.5">
                category: {categoryFilter}
                <button onClick={() => setCategoryFilter("")} className="text-[#7a6b5a] hover:text-[#ff5252]"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); setTypeFilter(""); setCategoryFilter(""); setSkillFilter(""); setSkillInput(""); }}
              className="text-[10px] uppercase tracking-wider text-[#7a6b5a] hover:text-[#ff5252] ml-1"
            >
              clear all
            </button>
          </div>
        )}

        {/* Category chips — only show categories that have real posts */}
        <div className="flex flex-wrap gap-2 mt-3">
          {EXCHANGE_MODES.filter((mode) => {
            // Hide if no real post exists in this category
            if (!availableCategories.includes(mode.value)) return false;
            // Hide if incompatible with selected offer type
            if (!typeFilter) return true;
            const incompatible = INCOMPATIBLE_EXCHANGE_MODES[typeFilter] || [];
            return !incompatible.includes(mode.value);
          }).map((mode) => {
            const active = categoryFilter === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setCategoryFilter(active ? "" : mode.value)}
                className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded border transition-colors ${mode.twText} ${
                  active
                    ? `${mode.twBorder} ${mode.twBg} border-current`
                    : "border-[#2a2420] hover:border-current"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && !needsData ? (
        <div className="py-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7a6b5a]" /></div>
      ) : needs.length === 0 ? (
        <EmptyState
          title="No needs found"
          description={activeFiltersCount > 0 ? "try adjusting your filters." : "be the first to create an exchange."}
          action={activeFiltersCount === 0 ? (
            <Button asChild variant="default"><Link href="/needs/new">Post Need</Link></Button>
          ) : undefined}
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#7a6b5a]">
              showing {startItem}–{endItem} of {total}
            </p>
          </div>
          {needs.map((need) => (
            <div key={need.id} className="vessel p-5 mb-4">
              <Link href={`/needs/${need.id}`} className="block group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-medium text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">{need.title}</h3>
                      {need.needCategory && (() => {
                        const mode = getExchangeMode(need.needCategory);
                        if (!mode) return null;
                        return (
                          <span className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${mode.twText} ${mode.twBorder} ${mode.twBg}`}>
                            {mode.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-[#b8a078] mt-1 line-clamp-2">{need.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {need.requiredSkills.map((skill) => (
                        <span key={skill.id} className="px-2 py-0.5 text-xs text-[#7a6b5a] bg-[#1a1714] border border-[#2a2420] rounded">{skill.name}</span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#7a6b5a] uppercase tracking-wide ml-2">{need._count.acceptances} interested</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2420]">
                  <Link href={`/profile/${need.poster.id}`} className="flex items-center gap-3 group" onClick={(e) => e.stopPropagation()}>
                    <Avatar src={need.poster.avatarUrl} name={need.poster.fullName} size="sm" />
                    <div className="text-sm text-[#b8a078]">
                      <span className="text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">{need.poster.fullName || "anonymous"}</span>
                      {need.poster.ratingCount > 0 && <span className="ml-2">{need.poster.ratingAvg.toFixed(1)}</span>}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-[#7a6b5a]">
                    {offerIcons[need.offerType as keyof typeof offerIcons]}
                    <span className="truncate max-w-xs">{need.offerDescription}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-[#7a6b5a] px-2">
                page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
