"use client";

import Link from "next/link";

import { Check, X, Star, Shield, Loader2, FileText, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { ReviewForm } from "./review-form";

interface AcceptanceUser {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string }[];
  credentials: { id: string; title: string; issuedBy: string | null; isVerified: boolean }[];
}

interface Acceptance {
  id: string;
  userId: string;
  message: string | null;
  status: string;
  posterMarkedComplete: boolean;
  fulfillerMarkedComplete: boolean;
  user: AcceptanceUser;
}

interface ConfirmDialogPayload {
  type: "contract";
  acceptanceId: string;
  userName: string;
}

interface InterestedListProps {
  acceptances: Acceptance[];
  needStatus: string;
  needRequiresContract: boolean;
  confirmingContract: string | null;
  markingComplete: boolean;
  posterReviewAcceptanceId: string | null;
  reviewRating: number;
  reviewComment: string;
  reviewPrivateFeedback: string;
  submittingReview: boolean;
  onAcceptance: (id: string, status: "accepted" | "declined" | "removed") => void;
  onMarkComplete: (id: string) => void;
  onSetConfirmDialog: (dialog: ConfirmDialogPayload | null) => void;
  onSetPosterReview: (acceptanceId: string | null) => void;
  onSetReviewRating: (r: number) => void;
  onSetReviewComment: (c: string) => void;
  onSetReviewPrivateFeedback: (p: string) => void;
  onSubmitReview: (acceptanceId: string, receiverId: string) => void;
}

export function InterestedList({
  acceptances,
  needStatus,
  needRequiresContract,
  confirmingContract,
  markingComplete,
  posterReviewAcceptanceId,
  reviewRating,
  reviewComment,
  reviewPrivateFeedback,
  submittingReview,
  onAcceptance,
  onMarkComplete,
  onSetConfirmDialog,
  onSetPosterReview,
  onSetReviewRating,
  onSetReviewComment,
  onSetReviewPrivateFeedback,
  onSubmitReview,
}: InterestedListProps) {
  const visible = acceptances.filter(
    (a) => a.status === "pending" || a.status === "accepted" || a.status === "declined"
  );

  if (visible.length === 0) return null;

  return (
    <div className="vessel p-4">
      <h2 className="text-sm font-medium text-[#e8d5a3] mb-4">Interested ({visible.length})</h2>
      <div className="space-y-3">
        {visible.map((a) => (
          <div
            key={a.id}
            className={`p-3 rounded ${
              a.status === "accepted"
                ? "border border-[#00e676]/20 bg-[#00e676]/5"
                : "bg-[#1a1714] border border-[#2a2420]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Avatar src={a.user.avatarUrl} name={a.user.fullName} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profile/${a.user.id}`}
                      className="text-sm font-medium text-[#e8d5a3] truncate hover:underline"
                    >
                      {a.user.fullName || "anonymous"}
                    </Link>
                    {a.user.isVerified && (
                      <span title="Verified">
                        <Shield className="h-3 w-3 text-[#00e676] shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#7a6b5a]">
                    {a.user.ratingAvg > 0 && (
                      <span>
                        {a.user.ratingAvg.toFixed(1)} ★ ({a.user.ratingCount})
                      </span>
                    )}
                    {a.user.jobsCompleted > 0 && <span>{a.user.jobsCompleted} jobs done</span>}
                    {a.user.locationName && <span>{a.user.locationName}</span>}
                  </div>
                  {a.user.bio && (
                    <p className="text-[10px] text-[#b8a078] mt-0.5 line-clamp-1">{a.user.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {a.user.skills.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a]"
                      >
                        {s.name}
                      </span>
                    ))}
                    {a.user.credentials.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-[#00e676]/30 text-[#00e676]">
                        {a.user.credentials.filter((c) => c.isVerified).length}/
                        {a.user.credentials.length} credentials
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {a.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs px-2"
                      onClick={() => onAcceptance(a.id, "accepted")}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-2"
                      onClick={() => onAcceptance(a.id, "declined")}
                    >
                      <X className="h-3 w-3 mr-1" />
                      decline
                    </Button>
                  </>
                )}
                {a.status === "accepted" && needRequiresContract && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs px-2"
                      onClick={() =>
                        onSetConfirmDialog({
                          type: "contract",
                          acceptanceId: a.id,
                          userName: a.user.fullName || "this user",
                        })
                      }
                      disabled={confirmingContract === a.id}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {confirmingContract === a.id ? "..." : "contract"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-2"
                      onClick={() => onAcceptance(a.id, "declined")}
                    >
                      <X className="h-3 w-3 mr-1" />
                      decline
                    </Button>
                  </>
                )}
                {a.status === "accepted" && !needRequiresContract && needStatus === "active" && (
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className="text-xs text-[#00e676] flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      deal confirmed
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!a.posterMarkedComplete ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-6 text-[10px] px-2"
                          onClick={() => onMarkComplete(a.id)}
                          disabled={markingComplete}
                        >
                          {markingComplete ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Mark complete
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[#00e676]">you marked complete</span>
                      )}
                      {a.fulfillerMarkedComplete && (
                        <span className="text-[10px] text-[#00e676]">
                          fulfiller marked complete
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {a.status === "completed" && !needRequiresContract && (
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className="text-xs text-[#00e676] flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      deal completed
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        onSetPosterReview(a.id);
                        onSetReviewRating(10);
                        onSetReviewComment("");
                        onSetReviewPrivateFeedback("");
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                  </div>
                )}
                {a.status === "declined" && (
                  <span className="text-xs text-[#ff5252] flex items-center gap-1">
                    <X className="h-3 w-3" />
                    declined
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 text-[#ff5252] hover:text-[#ff5252]"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${a.user.fullName || "this user"}? They won't be able to express interest again.`
                      )
                    ) {
                      onAcceptance(a.id, "removed");
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  remove
                </Button>
              </div>
            </div>
            {a.message && (
              <p className="text-xs text-[#b8a078] mt-2 bg-[#0f0c0a] p-2.5 rounded">{a.message}</p>
            )}
            {/* Poster review form inline */}
            {posterReviewAcceptanceId === a.id && (
              <div className="mt-3">
                <ReviewForm
                  title={`Leave a review for ${a.user.fullName || "this fulfiller"}`}
                  rating={reviewRating}
                  comment={reviewComment}
                  privateFeedback={reviewPrivateFeedback}
                  submitting={submittingReview}
                  onRatingChange={onSetReviewRating}
                  onCommentChange={onSetReviewComment}
                  onPrivateFeedbackChange={onSetReviewPrivateFeedback}
                  onSubmit={() => onSubmitReview(a.id, a.user.id)}
                  onCancel={() => onSetPosterReview(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
