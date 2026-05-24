import { useParams, useNavigate } from "react-router-dom";
import {
  useNeed,
  useCreateAcceptance,
  useProfile,
  useUpdateNeed,
  useDeleteNeed,
  useRepostNeed,
} from "@mobile/hooks/useApi";
import { useHaptics, useShare } from "@mobile/hooks/useNative";
import {
  ArrowLeft,
  MapPin,
  Star,
  Handshake,
  MessageCircle,
  Share2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { ImageLightbox } from "@mobile/components/ImageLightbox";
import { useState } from "react";
import { hapticImpact } from "@mobile/lib/native";
import { Vessel, Badge, Button, Textarea, Avatar, Divider } from "@mobile/components/ui";
import type { BadgeVariant } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   NEED DETAIL SCREEN — Terminal Vessel Detail
   $ cd ~/needs/ with meta strip, image gallery, exchange card,
   poster profile, interest form.
   ═══════════════════════════════════════════════════════════════ */

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: "success",
  completed: "quintessence",
  cancelled: "destructive",
  pending: "warning",
};

export function NeedDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, error, isLoading } = useNeed(id);
  const { data: profile } = useProfile();
  const { trigger: expressInterest, isMutating } = useCreateAcceptance();
  const { trigger: updateNeed, isMutating: updating } = useUpdateNeed();
  const { trigger: deleteNeed, isMutating: deleting } = useDeleteNeed();
  const { trigger: repostNeed, isMutating: reposting } = useRepostNeed();
  const { tap, success, error: hapticError } = useHaptics();
  const share = useShare();

  const [interestMsg, setInterestMsg] = useState("");
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const need = data?.need;

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
        <span className="font-mono text-xs text-[var(--leather)]">$ loading...</span>
      </div>
    );
  }

  if (error || !need) {
    return (
      <div className="min-h-full pb-6 pt-4 safe-top px-4">
        <button
          onClick={() => {
            tap("light");
            if (window.history.length > 1) navigate(-1);
            else navigate("/needs");
          }}
          className="p-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--parchment)] tap-highlight-none mb-4"
        >
          <ArrowLeft size={18} />
        </button>
        <Vessel className="p-4 text-center">
          <p className="font-mono text-sm text-[var(--ruby)]">
            $ error: {error?.message ?? "Need not found"}
          </p>
        </Vessel>
      </div>
    );
  }

  const handleExpressInterest = async () => {
    if (!id) return;
    tap("medium");
    setActionError(null);
    try {
      await expressInterest({ needId: id, message: interestMsg });
      setSuccessMsg("Interest expressed! The poster will be notified.");
      setShowInterestForm(false);
      success();
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to express interest");
    }
  };

  const isPoster = need?.posterId === profile?.id;

  const handleUpdate = async () => {
    if (!id) return;
    tap("medium");
    setActionError(null);
    try {
      await updateNeed({
        id,
        data: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
        },
      });
      setIsEditing(false);
      success();
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to update need");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    tap("medium");
    setActionError(null);
    try {
      await deleteNeed(id);
      success();
      navigate("/needs");
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to delete need");
    }
  };

  const handleRepost = async () => {
    if (!id) return;
    tap("medium");
    setActionError(null);
    try {
      const result = await repostNeed(id);
      if (result.need) {
        success();
        navigate(`/needs/${result.need.id}`);
      }
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to repost need");
    }
  };

  const handleShare = async () => {
    tap("light");
    const url = `${window.location.origin}/needs/${need.id}`;
    await share({
      title: need.title,
      text: need.description?.slice(0, 100) ?? "",
      url,
    });
  };

  const description = need.description ?? "";
  const descriptionLong = description.length > 500;
  const displayDescription = descExpanded ? description : description.slice(0, 500);

  return (
    <div className="min-h-full pb-6 pt-4 safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4 max-w-3xl mx-auto">
        <button
          onClick={() => {
            tap("light");
            if (window.history.length > 1) navigate(-1);
            else navigate("/needs");
          }}
          className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] text-[var(--leather)]">$ cd ~/needs/</p>
        </div>
        <button
          aria-label="Share need"
          onClick={handleShare}
          className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
        >
          <Share2 size={18} />
        </button>
      </div>

      <div className="px-4 space-y-4 max-w-3xl mx-auto">
        {/* Title + Status */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="heading-display text-xl text-[var(--gold)]">{need.title}</h1>
            {need.status && (
              <Badge variant={STATUS_VARIANTS[need.status] ?? "outline"}>{need.status}</Badge>
            )}
          </div>
          {need.contracts && need.contracts.length > 0 && (
            <Badge variant="quintessence" className="mb-2">
              Contract Required
            </Badge>
          )}
        </div>

        {/* Poster Actions */}
        {isPoster && (
          <>
            {isEditing ? (
              <Vessel variant="lit" className="p-4">
                <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
                  $ vim ~/needs/{need.id.slice(0, 8)}.md
                </p>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full h-10 px-3 py-2 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--gold)] text-sm font-mono rounded-md focus:outline-none focus:border-[var(--sun)] mb-3"
                  placeholder="Title"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--parchment)] text-sm font-mono rounded-md focus:outline-none focus:border-[var(--sun)] mb-3 resize-none"
                  rows={3}
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleUpdate}
                    disabled={updating || !editForm.title.trim()}
                  >
                    {updating ? "Saving..." : "Save"}
                  </Button>
                </div>
              </Vessel>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    tap("light");
                    setEditForm({ title: need.title, description: need.description });
                    setIsEditing(true);
                  }}
                >
                  Edit
                </Button>
                {need.status === "archived" || need.status === "cancelled" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={handleRepost}
                    disabled={reposting}
                  >
                    {reposting ? "..." : "Repost"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[var(--ruby)]/50 text-[var(--ruby)] hover:bg-[var(--ruby)]/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <Vessel variant="default" className="p-4 border-[var(--ruby)]/30">
                <p className="text-sm text-[var(--parchment)] mb-3">
                  Are you sure you want to delete this need? This cannot be undone.
                </p>
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
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </Vessel>
            )}
          </>
        )}

        {/* Meta Strip */}
        <div className="flex flex-wrap gap-1.5">
          {need.requiredSkills?.map((sk) => (
            <span
              key={sk.id}
              className="px-2 py-0.5 rounded bg-[var(--void-hover)] border border-[var(--bronze)] text-[10px] text-[var(--parchment)] uppercase tracking-wider"
            >
              {sk.name}
            </span>
          ))}

          {need.locationName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--void-hover)] border border-[var(--bronze)] text-[10px] text-[var(--leather)] uppercase tracking-wider">
              <MapPin size={8} />
              {need.locationName}
            </span>
          )}
          {need.deadline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--void-hover)] border border-[var(--bronze)] text-[10px] text-[var(--leather)] uppercase tracking-wider">
              <Clock size={8} />
              {new Date(need.deadline).toLocaleDateString()}
            </span>
          )}
          {need.timeRange && (
            <span className="px-2 py-0.5 rounded bg-[var(--void-hover)] border border-[var(--bronze)] text-[10px] text-[var(--leather)] uppercase tracking-wider">
              {need.timeRange}
            </span>
          )}
        </div>

        {/* Image Gallery */}
        {need.images?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto snap-x scrollbar-hide pb-1">
            {need.images.map((url: string, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  hapticImpact("light");
                  setLightboxIndex(idx);
                }}
                className="shrink-0 w-28 h-28 snap-start border border-[var(--bronze)] rounded-md overflow-hidden tap-highlight-none"
              >
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        {/* Description */}
        <Vessel className="p-4">
          <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
            $ cat description.txt
          </p>
          <p className="text-sm text-[var(--parchment)] leading-relaxed whitespace-pre-line">
            {displayDescription}
            {!descExpanded && descriptionLong && "..."}
          </p>
          {descriptionLong && (
            <button
              onClick={() => setDescExpanded((e) => !e)}
              className="mt-2 font-mono text-xs text-[var(--sun)] hover:underline"
            >
              {descExpanded ? "show less" : "show more"}
            </button>
          )}
        </Vessel>

        {/* Exchange Card */}
        <Vessel variant="offer" className="p-4">
          <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
            $ cat offering.txt
          </p>
          <div className="flex items-center gap-2 mb-2">
            <Handshake size={16} className="text-[var(--sun)]" />
            <span className="text-sm font-medium text-[var(--gold)]">Offering in exchange</span>
          </div>
          <p className="text-sm text-[var(--parchment)]">{need.offerDescription}</p>
          {need.offerValue && (
            <p className="font-mono text-xs text-[var(--leather)] mt-2">
              Estimated value: ${need.offerValue}
            </p>
          )}
        </Vessel>

        {/* Poster Profile */}
        {need.poster && (
          <Vessel
            variant="default"
            interactive
            className="p-4"
            onClick={() => need.poster?.id && navigate(`/profile/${need.poster.id}`)}
          >
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
              $ finger {need.poster.fullName?.toLowerCase().replace(/\s+/g, "_") ?? "anonymous"}
            </p>
            <div className="flex items-center gap-3">
              <Avatar src={need.poster.avatarUrl} alt={need.poster.fullName ?? ""} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[var(--gold)]">
                    {need.poster.fullName ?? "Anonymous"}
                  </span>
                  {need.poster.isVerified && (
                    <Badge variant="success" className="text-[8px]">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {need.poster.ratingAvg > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[var(--sun)] text-xs">
                      <Star size={10} fill="currentColor" />
                      {need.poster.ratingAvg.toFixed(1)}
                    </span>
                  )}
                  {need.poster.jobsCompleted > 0 && (
                    <span className="font-mono text-[10px] text-[var(--leather)]">
                      {need.poster.jobsCompleted} jobs
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--bronze)]" />
            </div>
          </Vessel>
        )}

        {/* Contract banner */}
        {need.contracts && need.contracts.length > 0 && (
          <button
            onClick={() => {
              tap("light");
              navigate(`/contracts/${need.contracts![0].id}`);
            }}
            className="w-full text-left p-3 rounded-md bg-[var(--emerald)]/5 border-l-2 border-[var(--emerald)] tap-highlight-none hover:bg-[var(--emerald)]/10 transition-colors"
          >
            <p className="font-mono text-xs text-[var(--emerald)]">
              Contract formed for this need.
            </p>
            <p className="font-mono text-[10px] text-[var(--leather)] mt-1">
              Tap to view contract →
            </p>
          </button>
        )}

        {/* Action feedback */}
        {successMsg && (
          <div className="p-3 rounded-md bg-[var(--emerald)]/5 border border-[var(--emerald)]/30">
            <p className="font-mono text-xs text-[var(--emerald)]">{successMsg}</p>
          </div>
        )}
        {actionError && (
          <div className="p-3 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30">
            <p className="font-mono text-xs text-[var(--ruby)]">$ error: {actionError}</p>
          </div>
        )}

        {/* Interest Form */}
        {showInterestForm && (
          <Vessel className="p-4">
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
              $ echo "message" &gt; interest.txt
            </p>
            <Textarea
              value={interestMsg}
              onChange={(e) => setInterestMsg(e.target.value)}
              placeholder="Add a message (optional)..."
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  tap("light");
                  setShowInterestForm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleExpressInterest}
                disabled={isMutating}
              >
                {isMutating ? "Sending..." : "Send Interest"}
              </Button>
            </div>
          </Vessel>
        )}

        {/* Actions */}
        {!showInterestForm && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                tap("medium");
                setShowInterestForm(true);
              }}
            >
              <Handshake size={16} />
              Express Interest
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                tap("light");
                if (need.poster?.id) navigate(`/chat/dm/${need.poster.id}`);
              }}
            >
              <MessageCircle size={16} />
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && need.images && (
        <ImageLightbox
          images={need.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
