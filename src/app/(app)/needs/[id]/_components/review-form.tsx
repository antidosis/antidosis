"use client";

import { Star, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  title?: string;
  rating: number;
  comment: string;
  privateFeedback: string;
  submitting: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onPrivateFeedbackChange: (feedback: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ReviewForm({
  title,
  rating,
  comment,
  privateFeedback,
  submitting,
  onRatingChange,
  onCommentChange,
  onPrivateFeedbackChange,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  return (
    <div className="bg-[#1a1714] border border-[#2a2420] p-3 rounded space-y-3">
      <p className="text-xs text-[#e8d5a3] font-medium">{title || "Leave a review"}</p>
      <div>
        <label className="text-xs text-[#7a6b5a] block mb-1">Rating (1–10)</label>
        <input
          type="range"
          min={1}
          max={10}
          value={rating}
          onChange={(e) => onRatingChange(parseInt(e.target.value))}
          className="w-full accent-[#f5a623]"
        />
        <div className="flex justify-between text-xs text-[#7a6b5a] mt-1">
          <span>1</span>
          <span className="text-[#f5a623] font-medium">{rating}</span>
          <span>10</span>
        </div>
      </div>
      <Textarea
        placeholder="What went well?"
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={2}
        className="text-sm"
        maxLength={2000}
      />
      <Textarea
        placeholder="Private feedback (only visible to moderators)"
        value={privateFeedback}
        onChange={(e) => onPrivateFeedbackChange(e.target.value)}
        rows={2}
        className="text-sm"
        maxLength={2000}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Star className="h-3 w-3 mr-1" />
          )}
          Submit Review
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
