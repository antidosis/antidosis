import { useParams, useNavigate } from "react-router-dom";
import {
  useNeed,
  useCreateAcceptance,
  useProfile,
  useUpdateNeed,
  useDeleteNeed,
  useRepostNeed,
  useMarkAcceptanceComplete,
  useCreateReview,
  useUpdateAcceptance,
  useNeedMessages,
  useSendNeedMessage,
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
  CheckCircle,
  FileText,
  Send,
  X,
  Award,
  Globe,
} from "lucide-react";
import { ImageLightbox } from "@mobile/components/ImageLightbox";
import { useState } from "react";
import { hapticImpact } from "@mobile/lib/native";
import { getExchangeMode } from "@/lib/categories";
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
  const { trigger: markComplete, isMutating: markingComplete } = useMarkAcceptanceComplete();
  const { trigger: createReview, isMutating: submittingReview } = useCreateReview();
  const { trigger: updateAcceptance, isMutating: updatingAcceptance } = useUpdateAcceptance();
  const { data: messagesData } = useNeedMessages(id);
  const { trigger: sendMessage } = useSendNeedMessage();
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

  // Free-form review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPrivateFeedback, setReviewPrivateFeedback] = useState("");

  // Need messages state
  const [messageInput, setMessageInput] = useState("");
  const [activeThread, setActiveThread] = useState<string | null>(null); // null = public, acceptanceId = private

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
  const myAcceptance = need?.acceptances?.find((a) => a.userId === profile?.id);
  const canMarkComplete =
    !need?.requiresContract &&
    myAcceptance?.status === "accepted" &&
    ((isPoster && !myAcceptance.posterMarkedComplete) ||
      (!isPoster && !myAcceptance.fulfillerMarkedComplete));
  const isFreeFormCompleted = !need?.requiresContract && myAcceptance?.status === "completed";

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

  const handleMarkComplete = async () => {
    if (!myAcceptance?.id) return;
    tap("medium");
    setActionError(null);
    try {
      const result = await markComplete(myAcceptance.id);
      setSuccessMsg(
        result.bothComplete
          ? "Both parties marked complete! You can now leave a review."
          : "Marked complete. Waiting for the other party."
      );
      success();
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to mark complete");
    }
  };

  const handleSubmitReview = async () => {
    if (!myAcceptance?.id || !need?.posterId) return;
    tap("medium");
    setActionError(null);
    try {
      const receiverId = isPoster ? myAcceptance.userId : need.posterId;
      await createReview({
        acceptanceId: myAcceptance.id,
        receiverId,
        rating,
        comment: reviewComment.trim(),
        privateFeedback: reviewPrivateFeedback.trim() || undefined,
      });
      setShowReviewForm(false);
      setRating(10);
      setReviewComment("");
      setReviewPrivateFeedback("");
      setSuccessMsg("Review submitted!");
      success();
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  const handleAcceptanceAction = async (acceptanceId: string, status: string) => {
    tap("medium");
    setActionError(null);
    try {
      const result = await updateAcceptance({ id: acceptanceId, status });
      if (status === "selected" && result.contract) {
        setSuccessMsg("Contract formed! Redirecting...");
        navigate(`/contracts/${result.contract.id}`);
      } else {
        setSuccessMsg(
          status === "accepted"
            ? "Interest accepted."
            : status === "declined"
              ? "Interest declined."
              : status === "removed"
                ? "Interest removed."
                : "Updated."
        );
      }
      success();
    } catch (err) {
      hapticError();
      setActionError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleSendNeedMessage = async () => {
    if (!id || !messageInput.trim()) return;
    tap("light");
    setActionError(null);
    try {
      await sendMessage({
        needId: id,
        content: messageInput.trim(),
        acceptanceId: activeThread ?? undefined,
      });
      setMessageInput("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send message");
    }
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
                    haptic={false}
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
                  haptic={false}
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
                    haptic={false}
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
                    haptic={false}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </Vessel>
            )}
          </>
        )}

        {/* Poster — Interested Users */}
        {isPoster && need.acceptances && need.acceptances.length > 0 && (
          <section>
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
              $ ls ~/needs/{need.id.slice(0, 8)}/interested/
            </p>
            <div className="space-y-3">
              {need.acceptances
                .filter((a) => ["pending", "accepted", "declined"].includes(a.status))
                .map((acc) => (
                  <Vessel key={acc.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={acc.user?.avatarUrl} alt={acc.user?.fullName ?? ""} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm font-medium text-[var(--gold)]">
                            {acc.user?.fullName ?? "Anonymous"}
                          </span>
                          {acc.user?.isVerified && (
                            <Badge variant="success" className="text-[8px]">
                              ✓
                            </Badge>
                          )}
                          <Badge
                            variant={
                              acc.status === "accepted"
                                ? "success"
                                : acc.status === "declined"
                                  ? "outline"
                                  : "warning"
                            }
                            className="text-[8px]"
                          >
                            {acc.status}
                          </Badge>
                        </div>
                        {acc.user?.ratingAvg && acc.user.ratingAvg > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-[var(--leather)] mb-1">
                            <Star size={10} className="text-[var(--sun)]" fill="currentColor" />
                            {acc.user.ratingAvg.toFixed(1)} · {acc.user.jobsCompleted} jobs
                          </div>
                        )}
                        {acc.message && (
                          <p className="text-xs text-[var(--parchment)] italic mb-2">
                            "{acc.message}"
                          </p>
                        )}
                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5">
                          {acc.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptanceAction(acc.id, "accepted")}
                                disabled={updatingAcceptance}
                                haptic={false}
                              >
                                <CheckCircle size={12} />
                                Accept
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAcceptanceAction(acc.id, "declined")}
                                disabled={updatingAcceptance}
                                haptic={false}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {acc.status === "accepted" && need.requiresContract && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptanceAction(acc.id, "selected")}
                                disabled={updatingAcceptance}
                                haptic={false}
                              >
                                <FileText size={12} />
                                Form Contract
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAcceptanceAction(acc.id, "declined")}
                                disabled={updatingAcceptance}
                                haptic={false}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {acc.status === "accepted" &&
                            !need.requiresContract &&
                            need.status === "active" && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptanceAction(acc.id, "accepted")}
                                disabled={updatingAcceptance}
                                haptic={false}
                              >
                                <CheckCircle size={12} />
                                Mark Complete
                              </Button>
                            )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[var(--ruby)]/50 text-[var(--ruby)]"
                            onClick={() => handleAcceptanceAction(acc.id, "removed")}
                            disabled={updatingAcceptance}
                            haptic={false}
                          >
                            <X size={12} />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Vessel>
                ))}
            </div>
          </section>
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
          {need.needCategory && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${(() => {
                const mode = getExchangeMode(need.needCategory);
                return mode
                  ? `${mode.twText} ${mode.twBorder} ${mode.twBg}`
                  : "bg-[var(--void-hover)] border-[var(--bronze)] text-[var(--parchment)]";
              })()}`}
            >
              {(() => {
                const mode = getExchangeMode(need.needCategory);
                return mode?.label ?? need.needCategory;
              })()}
            </span>
          )}
          {need.isLocal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--emerald)]/5 border border-[var(--emerald)]/30 text-[10px] text-[var(--emerald)] uppercase tracking-wider">
              <Globe size={8} />
              Local
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
          {/* Offer Images */}
          {need.offerImages && need.offerImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto snap-x scrollbar-hide mt-3 pb-1">
              {need.offerImages.map((url: string, idx: number) => (
                <div
                  key={idx}
                  className="shrink-0 w-20 h-20 snap-start border border-[var(--bronze)] rounded-md overflow-hidden"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
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
                {/* Poster credentials */}
                {need.poster.credentials && need.poster.credentials.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Award size={10} className="text-[var(--sun)]" />
                    <span className="font-mono text-[10px] text-[var(--leather)]">
                      {need.poster.credentials.filter((c) => c.isVerified).length}/
                      {need.poster.credentials.length} credentials verified
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="text-[var(--bronze)]" />
            </div>
          </Vessel>
        )}

        {/* Contract banners */}
        {need.contracts &&
          need.contracts.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                tap("light");
                navigate(`/contracts/${c.id}`);
              }}
              className="w-full text-left p-3 rounded-md bg-[var(--emerald)]/5 border-l-2 border-[var(--emerald)] tap-highlight-none hover:bg-[var(--emerald)]/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-[var(--emerald)]">Contract</p>
                <Badge variant={STATUS_VARIANTS[c.status] ?? "outline"} className="text-[8px]">
                  {c.status}
                </Badge>
              </div>
              <p className="font-mono text-[10px] text-[var(--leather)] mt-1">
                Tap to view contract →
              </p>
            </button>
          ))}

        {/* Need Messages */}
        {messagesData?.messages && messagesData.messages.length >= 0 && (
          <Vessel className="p-4">
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-3">
              $ tail ~/needs/{need.id.slice(0, 8)}/messages.log
            </p>

            {/* Thread tabs (poster only) */}
            {isPoster && need.acceptances && need.acceptances.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3 pb-1">
                <button
                  onClick={() => setActiveThread(null)}
                  className={`shrink-0 px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                    activeThread === null
                      ? "bg-[var(--sun)]/10 border-[var(--sun)] text-[var(--sun)]"
                      : "bg-transparent border-[var(--bronze)] text-[var(--leather)]"
                  }`}
                >
                  Public
                </button>
                {need.acceptances
                  .filter((a) => ["pending", "accepted"].includes(a.status))
                  .map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setActiveThread(acc.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                        activeThread === acc.id
                          ? "bg-[var(--sun)]/10 border-[var(--sun)] text-[var(--sun)]"
                          : "bg-transparent border-[var(--bronze)] text-[var(--leather)]"
                      }`}
                    >
                      {acc.user?.fullName ?? "Anonymous"}
                    </button>
                  ))}
              </div>
            )}

            {/* Messages */}
            <div className="space-y-3 mb-3 max-h-64 overflow-y-auto scrollbar-hide">
              {messagesData.messages
                .filter((msg) => {
                  if (!isPoster) {
                    // Non-poster: public messages + their own thread
                    const myAcc = need.acceptances?.find((a) => a.userId === profile?.id);
                    return msg.acceptanceId === null || msg.acceptanceId === myAcc?.id;
                  }
                  // Poster: filter by active thread
                  return activeThread === null
                    ? msg.acceptanceId === null
                    : msg.acceptanceId === activeThread;
                })
                .map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <Avatar src={msg.sender.avatarUrl} alt={msg.sender.fullName ?? ""} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--gold)]">
                          {msg.sender.fullName ?? "Anonymous"}
                        </span>
                        <span className="font-mono text-[9px] text-[var(--leather)]">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--parchment)] leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              {messagesData.messages.filter((msg) => {
                if (!isPoster) {
                  const myAcc = need.acceptances?.find((a) => a.userId === profile?.id);
                  return msg.acceptanceId === null || msg.acceptanceId === myAcc?.id;
                }
                return activeThread === null
                  ? msg.acceptanceId === null
                  : msg.acceptanceId === activeThread;
              }).length === 0 && (
                <p className="font-mono text-[10px] text-[var(--leather)] text-center py-2">
                  No messages yet.
                </p>
              )}
            </div>

            {/* Send */}
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendNeedMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 h-9 px-3 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--parchment)] text-xs font-mono rounded-md focus:outline-none focus:border-[var(--sun)]"
              />
              <button
                onClick={handleSendNeedMessage}
                disabled={!messageInput.trim()}
                className="px-3 h-9 rounded-md bg-[var(--sun)] text-[var(--void)] flex items-center justify-center tap-highlight-none active:scale-95 transition-transform disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </Vessel>
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
                haptic={false}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleExpressInterest}
                disabled={isMutating}
                haptic={false}
              >
                {isMutating ? "Sending..." : "Send Interest"}
              </Button>
            </div>
          </Vessel>
        )}

        {/* Acceptance Status (free-form) */}
        {myAcceptance && !need.requiresContract && (
          <Vessel variant="lit" className="p-4">
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
              $ status --acceptance
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={myAcceptance.status === "completed" ? "success" : "warning"}>
                {myAcceptance.status}
              </Badge>
              {myAcceptance.posterMarkedComplete && (
                <span className="font-mono text-[10px] text-[var(--emerald)]">Poster ✓</span>
              )}
              {myAcceptance.fulfillerMarkedComplete && (
                <span className="font-mono text-[10px] text-[var(--emerald)]">Fulfiller ✓</span>
              )}
            </div>
            {canMarkComplete && (
              <Button
                className="w-full"
                onClick={handleMarkComplete}
                disabled={markingComplete}
                haptic={false}
              >
                <CheckCircle size={16} />
                {markingComplete ? "Marking..." : "Mark Complete"}
              </Button>
            )}
          </Vessel>
        )}

        {/* Free-form Review Form */}
        {showReviewForm && isFreeFormCompleted && (
          <Vessel variant="lit" className="p-4">
            <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
              $ nano ~/review.md
            </p>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="range"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="flex-1 accent-[var(--sun)]"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Star size={14} className="text-[var(--sun)]" fill="currentColor" />
                <span className="font-sans font-bold text-lg text-[var(--gold)]">{rating}</span>
                <span className="font-mono text-xs text-[var(--leather)]">/10</span>
              </div>
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="What went well? (optional)"
              rows={3}
              className="mb-3"
            />
            <Textarea
              value={reviewPrivateFeedback}
              onChange={(e) => setReviewPrivateFeedback(e.target.value)}
              placeholder="Private feedback — only visible to moderators (optional)"
              rows={2}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  tap("light");
                  setShowReviewForm(false);
                  setRating(10);
                  setReviewComment("");
                  setReviewPrivateFeedback("");
                }}
                haptic={false}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                haptic={false}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </Vessel>
        )}

        {/* Leave Review Button (free-form) */}
        {!showReviewForm && isFreeFormCompleted && (
          <Button
            className="w-full"
            onClick={() => {
              tap("medium");
              setShowReviewForm(true);
            }}
            haptic={false}
          >
            <Star size={16} />
            Leave a Review
          </Button>
        )}

        {/* Actions */}
        {!showInterestForm && !myAcceptance && !isPoster && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                tap("medium");
                setShowInterestForm(true);
              }}
              haptic={false}
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
              haptic={false}
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
