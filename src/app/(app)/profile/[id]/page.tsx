import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Briefcase, Shield, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      skills: true,
      socialLinks: true,
      needsPosted: { where: { status: "open" }, orderBy: { createdAt: "desc" }, include: { requiredSkills: true, _count: { select: { acceptances: true } } }, take: 10 },
      reviewsReceived: { orderBy: { createdAt: "desc" }, include: { giver: { select: { fullName: true, avatarUrl: true } }, contract: { select: { need: { select: { title: true } } } } }, take: 10 },
    },
  });

  if (!profile) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link href="/needs" className="inline-flex items-center text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors"><ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/</Link>
      </div>

      <p className="text-[12px] text-[#7a6b4a] mb-4">$ finger {profile.fullName?.toLowerCase().replace(/\s/g, "_") || "user"}</p>

      <div className="flex flex-col sm:flex-row items-start gap-6 pb-10">
        <Avatar src={profile.avatarUrl} name={profile.fullName} size="lg" className="h-16 w-16" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{profile.fullName || "anonymous"}</h1>
            {profile.isVerified && <Shield className="h-5 w-5 text-[#7cb87c]" />}
            {profile.isPro && <Badge variant="default">pro</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#7a6b4a] mt-2">
            {profile.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4" />{profile.ratingAvg.toFixed(1)} ({profile.ratingCount} reviews)</span>}
            {profile.jobsCompleted > 0 && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{profile.jobsCompleted} completed</span>}
            {profile.locationName && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.locationName}</span>}
          </div>
          {profile.bio && <p className="text-[#7a6b4a] mt-4 leading-relaxed">{profile.bio}</p>}
          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {profile.skills.map((skill) => <span key={skill.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]">{skill.name}{skill.isVerified && <span className="ml-1 text-[#7cb87c]">✓</span>}</span>)}
            </div>
          )}
          {profile.socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-6">
              {profile.socialLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#7a6b4a]/50 hover:text-[#e8c97c] transition-colors capitalize">{link.platform}</a>)}
            </div>
          )}
        </div>
      </div>

      {profile.needsPosted.length > 0 && (
        <div>
          <div className="divider mb-8" />
          <p className="text-[12px] text-[#7a6b4a] mb-6">$ ls ~{profile.fullName?.toLowerCase().replace(/\s/g, "_") || "user"}/needs/</p>
          {profile.needsPosted.map((need, i) => (
            <div key={need.id}>
              <Link href={`/needs/${need.id}`} className="block py-5 group">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium group-hover:text-[#f5b800] transition-colors">{need.title}</h3>
                    <p className="text-[13px] text-[#7a6b4a] mt-1 line-clamp-1">{need.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {need.requiredSkills.map((skill) => <span key={skill.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]/50">{skill.name}</span>)}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-[#7a6b4a] uppercase tracking-wide">{need._count.acceptances} offer{need._count.acceptances !== 1 ? "s" : ""}</span>
                </div>
              </Link>
              {i < profile.needsPosted.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      )}

      {profile.reviewsReceived.length > 0 && (
        <div>
          <div className="divider mb-8" />
          <p className="text-[12px] text-[#7a6b4a] mb-6">$ cat ~{profile.fullName?.toLowerCase().replace(/\s/g, "_") || "user"}/reviews.log</p>
          {profile.reviewsReceived.map((review, i) => (
            <div key={review.id}>
              <div className="py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={review.giver.avatarUrl} name={review.giver.fullName} size="sm" />
                    <div>
                      <p className="text-[13px] font-medium">{review.giver.fullName || "anonymous"}</p>
                      {review.contract?.need?.title && <p className="text-[11px] text-[#7a6b4a]/50">{review.contract.need.title}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#e8c97c]">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-[13px] font-bold">{review.rating}/10</span>
                  </div>
                </div>
                {review.comment && <p className="text-[13px] text-[#7a6b4a] mt-4 leading-relaxed">{review.comment}</p>}
              </div>
              {i < profile.reviewsReceived.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
