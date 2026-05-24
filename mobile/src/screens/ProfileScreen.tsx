import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@mobile/hooks/useAuth";
import { useProfile, useDeleteAccount, useClaimFreePro } from "@mobile/hooks/useApi";
import {
  Star,
  Award,
  Shield,
  Settings,
  LogOut,
  MapPin,
  Briefcase,
  Check,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Zap,
  RotateCcw,
} from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import {
  Vessel,
  Badge,
  Avatar,
  Button,
  Divider,
  Skeleton,
  SkeletonCard,
} from "@mobile/components/ui";
import { usePlayStoreBilling } from "@mobile/hooks/usePlayStoreBilling";

/* ═══════════════════════════════════════════════════════════════
   PROFILE SCREEN — Terminal Identity
   $ finger {username}, $ ls ~user/needs/, $ cat reviews.log
   ═══════════════════════════════════════════════════════════════ */

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-full pb-20 pt-4 safe-top px-4 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton circle className="w-16 h-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  const displayName = profile?.fullName ?? user?.email?.split("@")[0] ?? "User";
  const handle = displayName.toLowerCase().replace(/\s+/g, "_");

  const { trigger: deleteAccount, isMutating: deleting } = useDeleteAccount();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    hapticImpact("medium");
    try {
      await deleteAccount();
      await signOut();
    } catch {
      /* error handled by hook */
    }
  };

  return (
    <div className="min-h-full pb-20 pt-4 safe-top">
      <div className="px-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-xs text-[var(--leather)]">$ finger {handle}</p>
          <button
            onClick={() => navigate("/profile/edit")}
            className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Profile Header Vessel */}
        <Vessel className="p-5 mb-6">
          <div className="flex items-start gap-4">
            <Avatar src={profile?.avatarUrl} alt={displayName} size="xl" />
            <div className="flex-1 min-w-0">
              <h1 className="heading-display text-xl text-[var(--gold)] mb-1">{displayName}</h1>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {profile?.isVerified && <Badge variant="success">Verified</Badge>}
                {profile?.isPro && <Badge variant="default">Pro</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs">
                {profile?.ratingAvg ? (
                  <span className="inline-flex items-center gap-1 text-[var(--sun)]">
                    <Star size={12} fill="currentColor" />
                    <span className="font-sans font-bold">{profile.ratingAvg.toFixed(1)}</span>
                  </span>
                ) : null}
                {profile?.jobsCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[var(--parchment)]">
                    <Briefcase size={12} />
                    <span className="font-mono">{profile.jobsCompleted} jobs</span>
                  </span>
                ) : null}
                {profile?.locationName && (
                  <span className="inline-flex items-center gap-1 text-[var(--leather)]">
                    <MapPin size={12} />
                    <span className="font-mono">{profile.locationName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-sm text-[var(--parchment)] leading-relaxed mt-4">{profile.bio}</p>
          )}
        </Vessel>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
          <Vessel variant="lit" className="p-3 text-center">
            <Star size={14} className="text-[var(--sun)] mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--gold)] font-sans">
              {profile?.ratingAvg ? profile.ratingAvg.toFixed(1) : "—"}
            </p>
            <p className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider">
              Rating
            </p>
          </Vessel>
          <Vessel variant="lit" className="p-3 text-center">
            <Award size={14} className="text-[var(--quintessence)] mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--gold)] font-sans">
              {String(profile?.jobsCompleted ?? 0)}
            </p>
            <p className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider">
              Jobs
            </p>
          </Vessel>
          <Vessel variant="lit" className="p-3 text-center">
            <Star size={14} className="text-[var(--mercury)] mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--gold)] font-sans">
              {String(profile?.ratingCount ?? 0)}
            </p>
            <p className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider">
              Reviews
            </p>
          </Vessel>
        </div>

        {/* Pro Status */}
        <ProSection profile={profile} />

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <section className="mb-6">
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
              $ ls ~{handle}/skills/
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--void-hover)] border border-[var(--bronze)] text-xs text-[var(--parchment)]"
                >
                  {skill.isVerified && <Check size={10} className="text-[var(--emerald)]" />}
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Credentials */}
        {profile?.credentials && profile.credentials.length > 0 && (
          <section className="mb-6">
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
              $ ls ~{handle}/credentials/
            </p>
            <div className="space-y-2">
              {profile.credentials.map((cred) => (
                <Vessel key={cred.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/20 flex items-center justify-center shrink-0">
                      <Award size={16} className="text-[var(--sun)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--gold)]">{cred.title}</p>
                      <p className="font-mono text-[10px] text-[var(--leather)]">
                        {cred.issuedBy ?? cred.type}
                      </p>
                    </div>
                    {cred.isVerified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </Vessel>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="mb-6">
          <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
            $ cat ~{handle}/reviews.log
          </p>
          {profile?.reviewsReceived && profile.reviewsReceived.length > 0 ? (
            <div className="space-y-3">
              {profile.reviewsReceived.map((review) => (
                <Vessel key={review.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[var(--sun)]">
                          <Star size={12} fill="currentColor" />
                          <span className="font-sans font-bold text-sm">{review.rating}/10</span>
                        </span>
                        <span className="font-mono text-[10px] text-[var(--leather)]">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.contract?.need?.title && (
                        <p className="font-mono text-[10px] text-[var(--bronze)] mb-1">
                          via «{review.contract.need.title}»
                        </p>
                      )}
                      {review.comment && (
                        <p className="text-sm text-[var(--parchment)] leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-[var(--leather)] mt-1">
                        — {review.giver.fullName || "Anonymous"}
                      </p>
                    </div>
                  </div>
                </Vessel>
              ))}
            </div>
          ) : (
            <Vessel className="p-4 text-center">
              <p className="font-mono text-xs text-[var(--leather)]">
                No reviews yet. Complete exchanges to build reputation.
              </p>
            </Vessel>
          )}
        </section>

        <Divider className="my-6" />

        {/* Legal */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => window.open("https://www.antidosis.com/privacy", "_blank")}
            className="font-mono text-[10px] text-[var(--leather)] hover:text-[var(--sun)] transition-colors tap-highlight-none"
          >
            Privacy Policy
          </button>
          <span className="text-[var(--bronze)] text-[10px]">|</span>
          <button
            type="button"
            onClick={() => window.open("https://www.antidosis.com/terms", "_blank")}
            className="font-mono text-[10px] text-[var(--leather)] hover:text-[var(--sun)] transition-colors tap-highlight-none"
          >
            Terms of Service
          </button>
        </div>

        {/* Delete Account */}
        <div className="mt-4">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => {
                hapticImpact("light");
                setShowDeleteConfirm(true);
              }}
              className="w-full py-2 text-center font-mono text-xs text-[var(--ruby)] hover:text-[var(--ruby)]/80 transition-colors tap-highlight-none"
            >
              <Trash2 size={12} className="inline mr-1" />
              Delete Account
            </button>
          ) : (
            <Vessel variant="default" className="p-4 border-[var(--ruby)]/30">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle size={16} className="text-[var(--ruby)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[var(--parchment)] font-medium">
                    Delete your account?
                  </p>
                  <p className="text-xs text-[var(--leather)] mt-1">
                    This will permanently delete your profile, needs, contracts, messages, and all
                    associated data. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-[var(--ruby)] hover:bg-[var(--ruby)]/80"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </Button>
              </div>
            </Vessel>
          )}
        </div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full mt-4"
          onClick={() => {
            hapticImpact("medium");
            signOut();
          }}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

/* ─── Pro Section ─────────────────────────────────────────────── */

function ProSection({ profile }: { profile: import("@mobile/types/api").Profile | undefined }) {
  const { initialized, products, error, purchase, restore } = usePlayStoreBilling();
  const { trigger: claimPro, isMutating: claimingPro } = useClaimFreePro();

  const canClaimFree = profile && profile.isVerified && profile.mobileVerified && !profile.isPro;

  if (!profile) return null;

  // Already Pro — show status
  if (profile.isPro) {
    return (
      <section className="mb-6">
        <Vessel variant="lit" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/20 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-[var(--sun)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--gold)]">Pro Member</p>
              <p className="font-mono text-[10px] text-[var(--leather)]">
                {profile.proSource === "play_store"
                  ? "Managed by Google Play"
                  : profile.proSource === "free_verified"
                    ? "Free Verified Pro"
                    : profile.proSource === "stripe"
                      ? "Web Subscription"
                      : "Active"}
                {profile.proExpiresAt && (
                  <span> · Expires {new Date(profile.proExpiresAt).toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </div>
        </Vessel>
      </section>
    );
  }

  // Not Pro — show upgrade options
  return (
    <section className="mb-6">
      <Vessel variant="lit" className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/20 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-[var(--sun)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--gold)]">Upgrade to Pro</p>
            <p className="font-mono text-[10px] text-[var(--leather)]">
              Get listed in the Pro directory and unlock premium features.
            </p>
          </div>
        </div>

        {/* Free Pro claim */}
        {canClaimFree && (
          <Button
            size="sm"
            className="w-full mb-2"
            onClick={() => claimPro()}
            disabled={claimingPro}
          >
            <Shield size={14} className="mr-1.5" />
            {claimingPro ? "Activating..." : "Claim Free Pro"}
          </Button>
        )}

        {/* Paid subscription options */}
        {initialized && products.length > 0 && (
          <div className="space-y-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => purchase(product.id)}
                className="w-full flex items-center justify-between p-3 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] hover:border-[var(--sun)] transition-colors tap-highlight-none"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--parchment)]">
                    {product.id === "pro_monthly" ? "Monthly" : "Yearly"}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--leather)]">
                    {product.description || "Pro subscription"}
                  </p>
                </div>
                <span className="text-sm font-bold text-[var(--gold)]">{product.price || "—"}</span>
              </button>
            ))}
          </div>
        )}

        {initialized && products.length === 0 && (
          <p className="font-mono text-[10px] text-[var(--leather)] text-center py-2">
            Loading subscription options...
          </p>
        )}

        {error && (
          <p className="font-mono text-[10px] text-[var(--ruby)] text-center mt-2">{error}</p>
        )}

        {/* Restore purchases */}
        <button
          onClick={restore}
          className="w-full mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] text-[var(--leather)] hover:text-[var(--sun)] transition-colors tap-highlight-none"
        >
          <RotateCcw size={12} />
          Restore Purchases
        </button>
      </Vessel>
    </section>
  );
}
