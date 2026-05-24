import { useParams, useNavigate } from "react-router-dom";
import { usePublicProfile } from "@mobile/hooks/useApi";
import { useHaptics } from "@mobile/hooks/useNative";
import {
  ArrowLeft,
  MapPin,
  Star,
  Briefcase,
  Shield,
  Award,
  FileCheck,
  MessageCircle,
  Globe,
  Calendar,
  Clock,
  ChevronRight,
  Verified,
} from "lucide-react";
import { useState } from "react";
import { hapticImpact } from "@mobile/lib/native";
import { Vessel, Badge, Avatar, Divider } from "@mobile/components/ui";
import type { BadgeVariant } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   PROFILE DETAIL SCREEN — Public Profile View
   $ finger {username} — view any user's public profile.
   ═══════════════════════════════════════════════════════════════ */

const NEED_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  open: "outline",
  contracted: "warning",
  completed: "success",
  cancelled: "destructive",
  archived: "mercury",
};

export function ProfileDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePublicProfile(id);
  const { tap } = useHaptics();
  const [activeTab, setActiveTab] = useState<"overview" | "needs" | "reviews">("overview");

  const profile = data;

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
        <span className="text-xs font-mono text-[var(--leather)]">$ fetching profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-4 px-6">
        <p className="font-mono text-xs text-[var(--leather)]">$ finger {id}</p>
        <p className="text-sm text-[var(--leather)] text-center">Profile not found.</p>
        <button
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/discover");
          }}
          className="text-xs font-mono text-[var(--sun)]"
        >
          $ cd ..
        </button>
      </div>
    );
  }

  const firstName = profile.fullName?.split(" ")[0] ?? "User";

  const publicLinks = profile.socialLinks?.filter((l) => l.isPublic) ?? [];
  const publicCredentials = profile.credentials?.filter((c) => c.isPublic) ?? [];

  return (
    <div className="min-h-full pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--void)]/90 backdrop-blur-md border-b border-[var(--bronze)]/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            tap();
            if (window.history.length > 1) navigate(-1);
            else navigate("/discover");
          }}
          className="p-2 -ml-2 rounded-md active:bg-[var(--void-raised)]"
        >
          <ArrowLeft size={20} className="text-[var(--leather)]" />
        </button>
        <p className="font-mono text-xs text-[var(--leather)] flex-1 truncate">
          $ finger {firstName.toLowerCase()}
        </p>
        <button
          onClick={() => {
            tap();
            navigate(`/chat/dm/${profile.userId}`);
          }}
          className="p-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)]/30 active:scale-95 transition-transform"
        >
          <MessageCircle size={16} className="text-[var(--sun)]" />
        </button>
      </div>

      {/* Profile Hero */}
      <div className="px-4 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          <Avatar
            src={profile.avatarUrl ?? undefined}
            alt={profile.fullName ?? ""}
            size="xl"
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="heading-display text-xl text-[var(--gold)] truncate">
                {profile.fullName ?? "Anonymous"}
              </h1>
              {profile.isVerified && (
                <Shield size={16} className="text-[var(--emerald)] shrink-0" />
              )}
              {profile.isPro && (
                <Badge variant="quintessence" className="text-[10px] shrink-0">
                  PRO
                </Badge>
              )}
            </div>

            {profile.locationName && (
              <p className="flex items-center gap-1 text-xs text-[var(--leather)] mt-1">
                <MapPin size={12} />
                {profile.locationName}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-[var(--sun)]" />
                <span className="text-sm font-mono text-[var(--gold)]">
                  {profile.ratingAvg?.toFixed(1) ?? "0.0"}
                </span>
                <span className="text-xs text-[var(--leather)]">({profile.ratingCount ?? 0})</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase size={14} className="text-[var(--mercury)]" />
                <span className="text-xs text-[var(--leather)]">
                  {profile.jobsCompleted ?? 0} jobs
                </span>
              </div>
              {profile.mobileVerified && (
                <div className="flex items-center gap-1">
                  <Verified size={14} className="text-[var(--emerald)]" />
                  <span className="text-xs text-[var(--emerald)]">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-[var(--leather)] mt-4 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="px-4 mb-4 max-w-3xl mx-auto">
        <div className="flex border border-[var(--bronze)]/30 rounded-md overflow-hidden">
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "needs", label: `Needs (${profile.needsPosted?.length ?? 0})` },
              { key: "reviews", label: `Reviews (${profile.reviewsReceived?.length ?? 0})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                tap();
                setActiveTab(tab.key);
              }}
              className={`flex-1 py-2 text-xs font-mono text-center transition-colors ${
                activeTab === tab.key
                  ? "bg-[var(--sun)]/10 text-[var(--sun)] border-b-2 border-[var(--sun)]"
                  : "text-[var(--leather)] hover:bg-[var(--void-raised)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 max-w-3xl mx-auto">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Vessel variant="default">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} className="text-[var(--sun)]" />
                  <h3 className="text-sm font-semibold text-[var(--gold)]">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant={skill.isVerified ? "success" : "outline"}
                      className="text-xs"
                    >
                      {skill.name}
                      {skill.isVerified && <Verified size={10} className="ml-1" />}
                    </Badge>
                  ))}
                </div>
              </Vessel>
            )}

            {/* Credentials */}
            {publicCredentials.length > 0 && (
              <Vessel variant="default">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck size={16} className="text-[var(--sun)]" />
                  <h3 className="text-sm font-semibold text-[var(--gold)]">Credentials</h3>
                </div>
                <div className="space-y-2">
                  {publicCredentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between p-2 rounded bg-[var(--void)] border border-[var(--bronze)]/20"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--mercury)] truncate">
                          {cred.title}
                        </p>
                        <p className="text-[10px] text-[var(--leather)]">
                          {cred.type}
                          {cred.issuedBy ? ` · ${cred.issuedBy}` : ""}
                        </p>
                      </div>
                      {cred.isVerified ? (
                        <Badge variant="success" className="text-[10px] shrink-0">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          Pending
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Vessel>
            )}

            {/* Social Links */}
            {publicLinks.length > 0 && (
              <Vessel variant="default">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-[var(--sun)]" />
                  <h3 className="text-sm font-semibold text-[var(--gold)]">Links</h3>
                </div>
                <div className="space-y-2">
                  {publicLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => hapticImpact("light")}
                      className="flex items-center gap-2 p-2 rounded bg-[var(--void)] border border-[var(--bronze)]/20 text-xs text-[var(--mercury)] hover:text-[var(--sun)] transition-colors"
                    >
                      <Globe size={12} />
                      <span className="capitalize">{link.platform}</span>
                      <ChevronRight size={12} className="ml-auto text-[var(--leather)]" />
                    </a>
                  ))}
                </div>
              </Vessel>
            )}

            {/* Member Since */}
            <p className="text-center text-[10px] font-mono text-[var(--leather)]/50 pt-2">
              <Calendar size={10} className="inline mr-1" />
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {activeTab === "needs" && (
          <div className="space-y-3">
            {profile.needsPosted && profile.needsPosted.length > 0 ? (
              profile.needsPosted.map((need) => (
                <button
                  key={need.id}
                  onClick={() => {
                    tap();
                    navigate(`/needs/${need.id}`);
                  }}
                  className="w-full text-left"
                >
                  <Vessel variant="need" interactive>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--mercury)] truncate pr-2">
                        {need.title}
                      </p>
                      <Badge
                        variant={NEED_STATUS_VARIANTS[need.status] ?? "outline"}
                        className="text-[10px] shrink-0"
                      >
                        {need.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--leather)]">
                      <span className="capitalize">{need.offerType}</span>
                      <span>·</span>
                      <span>{new Date(need.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Vessel>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <Briefcase size={32} className="text-[var(--bronze)] mx-auto mb-3" />
                <p className="text-sm text-[var(--leather)]">No needs posted yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3">
            {profile.reviewsReceived && profile.reviewsReceived.length > 0 ? (
              profile.reviewsReceived.map((review) => (
                <Vessel key={review.id} variant="default">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={review.giver.avatarUrl ?? undefined}
                      alt={review.giver.fullName ?? ""}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--mercury)]">
                          {review.giver.fullName ?? "Anonymous"}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-[var(--sun)]" />
                          <span className="text-xs text-[var(--gold)]">{review.rating}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-[var(--leather)] mt-1 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--leather)]/50 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Vessel>
              ))
            ) : (
              <div className="text-center py-12">
                <Star size={32} className="text-[var(--bronze)] mx-auto mb-3" />
                <p className="text-sm text-[var(--leather)]">No reviews yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
