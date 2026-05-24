"use client";

import { Check, X, Star, Loader2, Clock, MessageSquare, Handshake, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ReviewForm } from "./review-form";

interface MyAcceptance {
  id: string;
  status: string;
  message: string | null;
  posterMarkedComplete: boolean;
  fulfillerMarkedComplete: boolean;
}

interface InterestSectionProps {
  canExpressInterest: boolean;
  hasOffered: boolean;
  profileId: string | null;
  myAcceptance: MyAcceptance | undefined;
  needStatus: string;
  needRequiresContract: boolean;
  posterId: string;
  showInterestForm: boolean;
  onToggleInterestForm: () => void;
  offerMessage: string;
  onOfferMessageChange: (value: string) => void;
  submittingOffer: boolean;
  onSubmitOffer: (e: React.FormEvent) => void;
  markingComplete: boolean;
  onMarkComplete: (id: string) => void;
  showReviewForm: boolean;
  onShowReviewForm: () => void;
  onHideReviewForm: () => void;
  reviewRating: number;
  reviewComment: string;
  reviewPrivateFeedback: string;
  submittingReview: boolean;
  onReviewRatingChange: (r: number) => void;
  onReviewCommentChange: (c: string) => void;
  onReviewPrivateFeedbackChange: (p: string) => void;
  onSubmitReview: (acceptanceId: string, receiverId: string) => void;
  onScrollToMessages: () => void;
  onAuthRequired: (register?: boolean) => void;
}

export function InterestSection({
  canExpressInterest,
  hasOffered,
  profileId,
  myAcceptance,
  needStatus,
  needRequiresContract,
  posterId,
  showInterestForm,
  onToggleInterestForm,
  offerMessage,
  onOfferMessageChange,
  submittingOffer,
  onSubmitOffer,
  markingComplete,
  onMarkComplete,
  showReviewForm,
  onShowReviewForm,
  onHideReviewForm,
  reviewRating,
  reviewComment,
  reviewPrivateFeedback,
  submittingReview,
  onReviewRatingChange,
  onReviewCommentChange,
  onReviewPrivateFeedbackChange,
  onSubmitReview,
  onScrollToMessages,
  onAuthRequired,
}: InterestSectionProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Action bar — non-poster only */}
      {canExpressInterest && !hasOffered && (
        <div className="flex flex-wrap gap-2">
          {profileId ? (
            <>
              <Button variant="default" size="sm" onClick={onToggleInterestForm}>
                <Handshake className="h-4 w-4 mr-1.5" />
                {showInterestForm ? "Cancel" : "Express Interest"}
              </Button>
              <Button variant="secondary" size="sm" onClick={onScrollToMessages}>
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Message
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" onClick={() => onAuthRequired(false)}>
              <Lock className="h-4 w-4 mr-1.5" />
              Log in to Interact
            </Button>
          )}
        </div>
      )}

      {/* Interest form — non-poster only */}
      {canExpressInterest && showInterestForm && profileId && !hasOffered && (
        <div className="vessel p-4">
          <p className="text-xs text-[#7a6b5a] mb-3">
            tell the poster why you are a good fit. you can also message them below to ask questions
            first.
          </p>
          <form onSubmit={onSubmitOffer} className="space-y-3">
            <div>
              <Textarea
                placeholder="introduce yourself..."
                value={offerMessage}
                onChange={(e) => onOfferMessageChange(e.target.value)}
                rows={3}
                className="text-sm"
                maxLength={1000}
              />
              <p className="text-xs text-[#7a6b5a] mt-1 text-right">{offerMessage.length}/1000</p>
            </div>
            <Button type="submit" variant="default" size="sm" disabled={submittingOffer}>
              {submittingOffer ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  submitting...
                </>
              ) : (
                "Submit Interest"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Interest status — non-poster only */}
      {myAcceptance && (
        <div
          className={`p-3 rounded border ${
            myAcceptance.status === "accepted"
              ? "bg-[#00e676]/5 border-[#00e676]/30"
              : myAcceptance.status === "declined"
                ? "bg-[#ff5252]/5 border-[#ff5252]/30"
                : "bg-[#1a1714] border-[#2a2420]"
          }`}
        >
          <div className="flex items-center gap-2">
            {myAcceptance.status === "pending" && <Clock className="h-4 w-4 text-[#7a6b5a]" />}
            {myAcceptance.status === "accepted" && <Check className="h-4 w-4 text-[#00e676]" />}
            {myAcceptance.status === "declined" && <X className="h-4 w-4 text-[#ff5252]" />}
            <p
              className={`text-sm ${
                myAcceptance.status === "accepted"
                  ? "text-[#00e676]"
                  : myAcceptance.status === "declined"
                    ? "text-[#ff5252]"
                    : "text-[#7a6b5a]"
              }`}
            >
              {myAcceptance.status === "pending" && "your interest is pending review"}
              {myAcceptance.status === "accepted" &&
                (needRequiresContract
                  ? "poster accepted — ready to form contract"
                  : needStatus === "completed"
                    ? "deal completed"
                    : myAcceptance.posterMarkedComplete && !myAcceptance.fulfillerMarkedComplete
                      ? "poster marked complete — waiting for you"
                      : !myAcceptance.posterMarkedComplete && myAcceptance.fulfillerMarkedComplete
                        ? "you marked complete — waiting for poster"
                        : "poster accepted — deal confirmed")}
              {myAcceptance.status === "declined" && "your interest was declined"}
              {myAcceptance.status === "completed" && "deal completed — thank you!"}
            </p>
          </div>
          {myAcceptance.message && (
            <div className="mt-2 bg-[#0f0c0a] p-2.5 rounded text-xs text-[#b8a078]">
              <span className="text-[#7a6b5a] uppercase tracking-wider text-[9px]">
                your intro:{" "}
              </span>
              {myAcceptance.message}
            </div>
          )}
          {/* Free-form mark complete — non-poster */}
          {myAcceptance.status === "accepted" &&
            !needRequiresContract &&
            needStatus === "active" && (
              <div className="mt-3">
                {!myAcceptance.fulfillerMarkedComplete ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs"
                    onClick={() => onMarkComplete(myAcceptance.id)}
                    disabled={markingComplete}
                  >
                    {markingComplete ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Mark as complete
                  </Button>
                ) : (
                  <span className="text-xs text-[#00e676] flex items-center gap-1">
                    <Check className="h-3 w-3" /> you marked complete
                  </span>
                )}
                {myAcceptance.posterMarkedComplete && (
                  <span className="text-xs text-[#00e676] flex items-center gap-1 ml-3">
                    <Check className="h-3 w-3" /> poster marked complete
                  </span>
                )}
              </div>
            )}
          {/* Free-form review — non-poster */}
          {myAcceptance.status === "completed" && !needRequiresContract && (
            <div className="mt-3">
              {showReviewForm ? (
                <ReviewForm
                  rating={reviewRating}
                  comment={reviewComment}
                  privateFeedback={reviewPrivateFeedback}
                  submitting={submittingReview}
                  onRatingChange={onReviewRatingChange}
                  onCommentChange={onReviewCommentChange}
                  onPrivateFeedbackChange={onReviewPrivateFeedbackChange}
                  onSubmit={() => onSubmitReview(myAcceptance.id, posterId)}
                  onCancel={onHideReviewForm}
                />
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={onShowReviewForm}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Leave a review
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
