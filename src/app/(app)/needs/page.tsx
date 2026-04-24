"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
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
  { value: "", label: "all" },
  { value: "service", label: "service" },
  { value: "item", label: "item" },
  { value: "money", label: "money" },
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
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-10">
        <div>
          <p className="text-[12px] text-[#7a6b4a] mb-3">$ ls ~/needs/</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">browse_needs</h1>
          <p className="text-[13px] text-[#7a6b4a] mt-2">find opportunities to exchange your skills</p>
        </div>
        <Button asChild>
          <Link href="/needs/new">$ post_need <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="divider mb-8" />

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a6b4a]" />
          <Input placeholder="search_needs..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-6" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#7a6b4a] hover:text-[#e8c97c]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {offerTypes.map((type) => (
            <button key={type.value} onClick={() => setTypeFilter(type.value)}
              className={`px-3 py-2 text-[11px] font-medium uppercase tracking-wide border transition-colors ${
                typeFilter === type.value
                  ? "border-[#f5b800] text-[#f5b800] bg-[#f5b800]/5"
                  : "border-[#2a2a2a] text-[#7a6b4a] hover:text-[#e8c97c]"
              }`}>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7a6b4a]" /></div>
      ) : needs.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <p className="text-[#7a6b4a] text-lg">no needs found</p>
          <p className="text-[13px] text-[#7a6b4a]/50">{query || typeFilter ? "try adjusting your filters." : "be the first to create an exchange."}</p>
          {!query && !typeFilter && <Button asChild><Link href="/needs/new">$ post_need</Link></Button>}
        </div>
      ) : (
        <div>
          {needs.map((need, i) => (
            <div key={need.id}>
              <Link href={`/needs/${need.id}`} className="block py-7 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold group-hover:text-[#f5b800] transition-colors">{need.title}</h3>
                    <p className="text-[13px] text-[#7a6b4a] mt-1 line-clamp-2">{need.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {need.requiredSkills.map((skill) => (
                        <span key={skill.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]">{skill.name}</span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-[#7a6b4a] uppercase tracking-wide">{need._count.acceptances} offer{need._count.acceptances !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a1a1a]">
                  <Link href={`/profile/${need.poster.id}`} className="flex items-center gap-3 group">
                    <Avatar src={need.poster.avatarUrl} name={need.poster.fullName} size="sm" />
                    <div className="text-[13px] text-[#7a6b4a]">
                      <span className="text-[#e8c97c] group-hover:text-[#f5b800] transition-colors">{need.poster.fullName || "anonymous"}</span>
                      {need.poster.ratingCount > 0 && <span className="ml-2">{need.poster.ratingAvg.toFixed(1)}</span>}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#7a6b4a]">
                    {offerIcons[need.offerType as keyof typeof offerIcons]}
                    <span className="truncate max-w-[140px]">{need.offerDescription}</span>
                  </div>
                </div>
              </Link>
              {i < needs.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
