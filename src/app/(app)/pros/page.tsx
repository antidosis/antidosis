"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Star, MapPin, Briefcase, Shield, Phone, Award } from "lucide-react";

interface ProProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  publicPhone: string | null;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  skills: { name: string }[];
  credentials: { id: string }[];
}

export default function ProsDirectoryPage() {
  const [pros, setPros] = useState<ProProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/pros");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (Array.isArray(data)) setPros(data);
        else setError("Unexpected response");
      } catch {
        setError("Failed to load directory. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8">
      <div className="py-10">
        <p className="text-xs text-[#7a6b5a] mb-4">$ ls /pros</p>
        <h1 className="heading-display text-2xl text-[#e8d5a3]">
          pro <span className="text-[#f5a623]">directory</span>
        </h1>
        <p className="text-sm text-[#7a6b5a] max-w-lg mt-4">
          trusted traders who have committed to the pro standard. browse,
          connect, trade.
        </p>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-[#7a6b5a]">loading...</div>
      )}

      {error && (
        <div className="border border-[#ff5252]/20 bg-[#ff5252]/5 p-6 mb-8 text-center">
          <p className="text-sm text-[#ff5252]">{error}</p>
        </div>
      )}

      {!loading && !error && pros.length === 0 && (
        <EmptyState
          title="No pros in the directory yet."
          description="Claim pro and opt-in to public sharing to appear here."
          action={
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 text-sm text-[#f5a623] hover:underline"
            >
              go to pro page →
            </Link>
          }
        />
      )}

      {!loading && !error && pros.length > 0 && (
        <div className="space-y-4">
          {pros.map((pro) => (
            <Link
              key={pro.id}
              href={`/profile/${pro.id}`}
              className="block vessel p-6 hover:bg-[#1a1714] transition-colors"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={pro.avatarUrl}
                  name={pro.fullName}
                  size="lg"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#e8d5a3]">
                      {pro.fullName || "anonymous"}
                    </h3>
                    {pro.isVerified && (
                      <Shield className="h-4 w-4 text-[#00e676]" />
                    )}
                    <Badge variant="default">pro</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#b8a078] mt-1">
                    {pro.ratingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-[#f5a623] drop-shadow-[0_0_4px_rgba(245,166,35,0.5)]" />
                        {pro.ratingAvg.toFixed(1)} ({pro.ratingCount} reviews)
                      </span>
                    )}
                    {pro.jobsCompleted > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {pro.jobsCompleted} completed
                      </span>
                    )}
                    {pro.locationName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pro.locationName}
                      </span>
                    )}
                    {pro.publicPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {pro.publicPhone}
                      </span>
                    )}
                    {pro.credentials.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {pro.credentials.length} credential{pro.credentials.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {pro.bio && (
                    <p className="text-sm text-[#7a6b5a] mt-3 line-clamp-2">
                      {pro.bio}
                    </p>
                  )}

                  {pro.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pro.skills.slice(0, 5).map((s) => (
                        <span
                          key={s.name}
                          className="px-2 py-1 text-xs text-[#b8a078] bg-[#1a1714] border border-[#2a2420] rounded"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[#7a6b5a]/50 py-12">
        sorted by rating.
      </p>
    </div>
  );
}
