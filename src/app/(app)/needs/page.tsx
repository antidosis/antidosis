"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { MapPin, ArrowRight, CircleDollarSign, Wrench, Package, Search, Loader2, X } from "lucide-react";

export const dynamic = "force-dynamic";

type NeedItem = {
  id: string;
  title: string;
  description: string;
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

export default function NeedsPage() {
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchNeeds = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/v1/needs?${params.toString()}`);
    const data = await res.json();
    setNeeds(data.needs || []);
    setLoading(false);
  }, [query, typeFilter]);

  useEffect(() => { fetchNeeds(); }, [fetchNeeds]);

  const offerIcons = {
    service: <Wrench className="h-3 w-3" />,
    item: <Package className="h-3 w-3" />,
    money: <CircleDollarSign className="h-3 w-3" />,
  };

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

      <div className="vessel p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a6b5a]" />
            <Input placeholder="search_needs..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            {query && (
              <Button variant="ghost" size="icon" onClick={() => setQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-[#7a6b5a] hover:text-[#e8d5a3]">
                <X className="h-4 w-4" />
              </Button>
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
      </div>

      {loading ? (
        <div className="py-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7a6b5a]" /></div>
      ) : needs.length === 0 ? (
        <EmptyState
          title="No needs found"
          description={query || typeFilter ? "try adjusting your filters." : "be the first to create an exchange."}
          action={!query && !typeFilter ? (
            <Button asChild variant="default"><Link href="/needs/new">Post Need</Link></Button>
          ) : undefined}
        />
      ) : (
        <div>
          {needs.map((need) => (
            <div key={need.id} className="vessel p-5 mb-4">
              <Link href={`/needs/${need.id}`} className="block group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-[#e8d5a3] group-hover:text-[#f5a623] transition-colors">{need.title}</h3>
                    <p className="text-sm text-[#b8a078] mt-1 line-clamp-2">{need.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {need.requiredSkills.map((skill) => (
                        <span key={skill.id} className="px-2 py-0.5 text-xs text-[#7a6b5a] bg-[#1a1714] border border-[#2a2420] rounded">{skill.name}</span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#7a6b5a] uppercase tracking-wide">{need._count.acceptances} interested</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2420]">
                  <Link href={`/profile/${need.poster.id}`} className="flex items-center gap-3 group">
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
        </div>
      )}
    </div>
  );
}
