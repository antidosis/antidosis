import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Star, MapPin, Briefcase, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

async function fetchPros() {
  return prisma.profile.findMany({
    where: { isPro: true, showInDirectory: true },
    orderBy: { ratingAvg: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
      locationName: true,
      ratingAvg: true,
      ratingCount: true,
      jobsCompleted: true,
      isVerified: true,
      skills: { select: { name: true } },
    },
  });
}

export default async function ProsDirectoryPage() {
  let pros: Awaited<ReturnType<typeof fetchPros>> = [];
  let error: string | null = null;

  try {
    pros = await fetchPros();
  } catch {
    error = "Failed to load directory. Please try again later.";
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-10">
        <p className="text-[12px] text-[#7a6b4a] mb-4">$ ls /pros</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          pro <span className="text-[#f5b800]">directory</span>
        </h1>
        <p className="text-[15px] text-[#7a6b4a] max-w-lg mt-4">
          trusted traders who have committed to the pro standard. browse,
          connect, trade.
        </p>
      </div>

      {error && (
        <div className="border border-[#c97c7c]/20 bg-[#c97c7c]/5 p-6 mb-8 text-center">
          <p className="text-[13px] text-[#c97c7c]">{error}</p>
        </div>
      )}

      {!error && pros.length === 0 ? (
        <div className="border border-[#2a2a2a] p-12 text-center">
          <p className="text-[13px] text-[#7a6b4a]">
            no pros in the directory yet.
          </p>
          <p className="text-[12px] text-[#7a6b4a]/60 mt-2">
            claim pro and opt-in to public sharing to appear here.
          </p>
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 mt-6 text-[13px] text-[#f5b800] hover:underline"
          >
            go to pro page →
          </Link>
        </div>
      ) : (
        <div className="space-y-px bg-[#2a2a2a]">
          {pros.map((pro) => (
            <Link
              key={pro.id}
              href={`/profile/${pro.id}`}
              className="block bg-[#0c0c0c] p-6 hover:bg-[#111111] transition-colors"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={pro.avatarUrl}
                  name={pro.fullName}
                  size="md"
                  className="h-12 w-12 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold">
                      {pro.fullName || "anonymous"}
                    </h3>
                    {pro.isVerified && (
                      <Shield className="h-4 w-4 text-[#7cb87c]" />
                    )}
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border border-[#f5b800]/30 text-[#f5b800]">
                      pro
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#7a6b4a] mt-1">
                    {pro.ratingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
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
                  </div>

                  {pro.bio && (
                    <p className="text-[13px] text-[#7a6b4a] mt-3 line-clamp-2">
                      {pro.bio}
                    </p>
                  )}

                  {pro.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pro.skills.slice(0, 5).map((s) => (
                        <span
                          key={s.name}
                          className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]"
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

      <p className="text-center text-[12px] text-[#7a6b4a]/50 py-12">
        sorted by rating.
      </p>
    </div>
  );
}
