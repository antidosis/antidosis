"use client";

import { useEffect, useState, useRef, useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Pencil, Trash2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

import { ConfirmDialog } from "./confirm-dialog";
import { InterestSection } from "./interest-section";
import { InterestedList } from "./interested-list";
import { MessageThread } from "./message-thread";
import { NeedContent } from "./need-content";
import { PosterProfileCard } from "./poster-profile-card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Poster = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ratingAvg: number;
  ratingCount: number;
  locationName: string | null;
  isVerified: boolean;
  isPro: boolean;
  jobsCompleted: number;
  skills: { id: string; name: string; isVerified: boolean }[];
  socialLinks: { id: string; platform: string; url: string }[];
};

export type NeedDetail = {
  id: string;
  title: string;
  description: string;
  needCategory: string | null;
  offerType: string;
  offerDescription: string;
  offerValue: number | null;
  isLocal: boolean;
  locationName: string | null;
  status: string;
  requiresContract: boolean;
  deadline: string | null;
  timeRange: string | null;
  images: string[];
  offerImages: string[];
  poster: Poster;
  requiredSkills: { id: string; name: string }[];
  acceptances: {
    id: string;
    userId: string;
    message: string | null;
    status: string;
    posterMarkedComplete: boolean;
    fulfillerMarkedComplete: boolean;
    user: {
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
    };
  }[];
  contracts: { id: string; status: string }[];
};

export type NeedMessage = {
  id: string;
  content: string;
  createdAt: string;
  acceptanceId: string | null;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export type Credential = {
  id: string;
  title: string;
  type: string;
  documentNumber: string | null;
  description: string | null;
  issuedBy: string | null;
  expiresAt: string | null;
  isVerified: boolean;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NeedDetailClient({ needId }: { needId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const messagesRef = useRef<HTMLDivElement>(null);

  /* -- state -- */
  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [messages, setMessages] = useState<NeedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  /* interest form */
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const { toast } = useToast();
  const [showInterestForm, setShowInterestForm] = useState(false);

  /* messaging */
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeMessageThread, setActiveMessageThread] = useState<string | null>(null);

  /* poster profile expand */
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credLoading, setCredLoading] = useState(false);

  /* description expand */
  const [descExpanded, setDescExpanded] = useState(false);

  /* contract / dialog */
  const [confirmingContract, setConfirmingContract] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "delete" | "contract";
    acceptanceId?: string;
    userName?: string;
  } | null>(null);

  /* free-form completion */
  const [markingComplete, setMarkingComplete] = useState(false);

  /* review form */
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [posterReviewAcceptanceId, setPosterReviewAcceptanceId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPrivateFeedback, setReviewPrivateFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* -- init -- */
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          const res = await fetch("/api/v1/profiles/me");
          if (res.ok) {
            const profile = await res.json();
            setProfileId(profile.id);
          }
        } catch {
          /* ignore */
        }
      }
      await Promise.all([fetchNeed(), fetchMessages()]);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!needId) return;
    const channel = supabase
      .channel(`need_messages:${needId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "need_messages",
          filter: `need_id=eq.${needId}`,
        },
        () => fetchMessages()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needId]);

  /* -- lazy credentials -- */
  const fetchCredentials = useCallback(
    async (posterId: string) => {
      if (credentials.length > 0 || credLoading) return;
      setCredLoading(true);
      try {
        const res = await fetch(`/api/v1/profiles/${posterId}/credentials`);
        if (res.ok) {
          const data = await res.json();
          setCredentials(data.credentials ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch credentials:", err);
      } finally {
        setCredLoading(false);
      }
    },
    [credentials.length, credLoading]
  );

  useEffect(() => {
    if (profileExpanded && need && profileId) {
      fetchCredentials(need.poster.id);
    }
  }, [profileExpanded, need, profileId, fetchCredentials]);

  /* -- data fetchers -- */
  async function fetchNeed() {
    try {
      const res = await fetch(`/api/v1/needs/${needId}`);
      if (res.ok) {
        const data = await res.json();
        const normalized = data.need
          ? {
              ...data.need,
              acceptances: data.need.acceptances ?? [],
              contracts: data.need.contracts ?? [],
              requiredSkills: data.need.requiredSkills ?? [],
              images: data.need.images ?? [],
              offerImages: data.need.offerImages ?? [],
              poster: data.need.poster
                ? {
                    ...data.need.poster,
                    skills: data.need.poster.skills ?? [],
                    socialLinks: data.need.poster.socialLinks ?? [],
                  }
                : data.need.poster,
            }
          : null;
        setNeed(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch need:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/v1/needs/${needId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }

  /* -- handlers -- */
  function handleAuthRequired(register = false) {
    router.push(`/${register ? "register" : "login"}?redirect=/needs/${needId}`);
  }

  function handleEmailNotVerified() {
    router.push(`/verify-email?redirect=/needs/${needId}`);
  }

  function scrollToMessages() {
    messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) {
      handleAuthRequired();
      return;
    }
    setSubmittingOffer(true);
    const res = await fetch("/api/v1/acceptances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needId, message: offerMessage }),
    });
    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      if (data.code === "EMAIL_NOT_VERIFIED") {
        handleEmailNotVerified();
        setSubmittingOffer(false);
        return;
      }
    }
    if (res.ok) {
      setOfferMessage("");
      setShowInterestForm(false);
      toast("Your interest has been sent to the poster", "success");
      await fetchNeed();
      await fetchMessages();
    } else {
      const data = await res.json().catch(() => ({ error: "Failed to submit interest" }));
      toast(data.error || "Failed to submit interest", "error");
    }
    setSubmittingOffer(false);
  }

  async function handleAcceptance(id: string, status: "accepted" | "declined" | "removed") {
    const res = await fetch(`/api/v1/acceptances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchNeed();
  }

  async function executeConfirm() {
    if (!confirmDialog || !need) return;
    if (confirmDialog.type === "delete") {
      const res = await fetch(`/api/v1/needs/${need.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } else if (confirmDialog.type === "contract" && confirmDialog.acceptanceId) {
      setConfirmingContract(confirmDialog.acceptanceId);
      const res = await fetch(`/api/v1/acceptances/${confirmDialog.acceptanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "selected" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contract) {
          router.push(`/contracts/${data.contract.id}`);
          return;
        }
        fetchNeed();
      }
      setConfirmingContract(null);
    }
    setConfirmDialog(null);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    if (!profileId) {
      handleAuthRequired();
      return;
    }
    setSendingMessage(true);
    const body: Record<string, unknown> = { content: messageInput };
    if (activeMessageThread) {
      body.acceptanceId = activeMessageThread;
    }
    const res = await fetch(`/api/v1/needs/${needId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      if (data.code === "EMAIL_NOT_VERIFIED") {
        handleEmailNotVerified();
        setSendingMessage(false);
        return;
      }
    }
    if (res.ok) {
      setMessageInput("");
      fetchMessages();
    }
    setSendingMessage(false);
  }

  async function handleMarkComplete(acceptanceId: string) {
    setMarkingComplete(true);
    const res = await fetch(`/api/v1/acceptances/${acceptanceId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      toast(
        data.bothComplete
          ? "Deal completed! Leave a review."
          : "Marked as complete. Waiting for the other party.",
        "success"
      );
      fetchNeed();
    } else {
      const data = await res.json().catch(() => ({ error: "Failed to mark complete" }));
      toast(data.error || "Failed to mark complete", "error");
    }
    setMarkingComplete(false);
  }

  async function submitReview(acceptanceId: string, receiverId: string) {
    if (!reviewRating || reviewRating < 1 || reviewRating > 10) {
      toast("Rating must be between 1 and 10", "error");
      return;
    }
    setSubmittingReview(true);
    const res = await fetch("/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acceptanceId,
        receiverId,
        rating: reviewRating,
        comment: reviewComment,
        privateFeedback: reviewPrivateFeedback,
      }),
    });
    if (res.ok) {
      toast("Review submitted!", "success");
      setShowReviewForm(false);
      setReviewRating(10);
      setReviewComment("");
      setReviewPrivateFeedback("");
      fetchNeed();
    } else {
      const data = await res.json().catch(() => ({ error: "Failed to submit review" }));
      toast(data.error || "Failed to submit review", "error");
    }
    setSubmittingReview(false);
  }

  /* -- render guards -- */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7a6b5a]" />
        <p className="text-sm text-[#7a6b5a] mt-3">loading...</p>
      </div>
    );
  }
  if (!need) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
        <p className="text-sm text-[#ff5252]">error: need not found</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href="/needs">Browse Needs</Link>
        </Button>
      </div>
    );
  }

  const isPoster = need.poster.id === profileId;
  const myAcceptance = need.acceptances.find((a) => a.userId === profileId);
  const hasOffered = !!myAcceptance;
  const canMessage = isPoster || hasOffered || need.status === "open";
  const canExpressInterest = need.status === "open" && !isPoster;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <NeedContent
          need={need}
          descExpanded={descExpanded}
          onToggleDesc={() => setDescExpanded(!descExpanded)}
        />

        {/* ========== POSTER PROFILE (collapsible) ========== */}
        <PosterProfileCard
          poster={need.poster}
          profileId={profileId}
          profileExpanded={profileExpanded}
          onToggleExpand={() => setProfileExpanded(!profileExpanded)}
          credentials={credentials}
          credLoading={credLoading}
          onAuthRequired={handleAuthRequired}
        />

        {/* ========== CONTRACT BANNERS ========== */}
        {need.contracts.length > 0 && (
          <div className="mb-6 space-y-2">
            {need.contracts.map((c) => (
              <div
                key={c.id}
                className="bg-[#00e676]/5 border-l-2 border-[#00e676] p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[#00e676]">contract formed</p>
                  <Badge variant="success" className="mt-1 capitalize text-[10px]">
                    {c.status}
                  </Badge>
                </div>
                <Button size="sm" variant="default" asChild>
                  <Link href={`/contracts/${c.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ========== ACTIONS ========== */}
        {(canMessage || canExpressInterest || messages.length > 0 || isPoster) && (
          <div className="space-y-4 mb-6">
            <InterestSection
              canExpressInterest={canExpressInterest}
              hasOffered={hasOffered}
              profileId={profileId}
              myAcceptance={myAcceptance}
              needStatus={need.status}
              needRequiresContract={need.requiresContract}
              posterId={need.poster.id}
              showInterestForm={showInterestForm}
              onToggleInterestForm={() => setShowInterestForm(!showInterestForm)}
              offerMessage={offerMessage}
              onOfferMessageChange={setOfferMessage}
              submittingOffer={submittingOffer}
              onSubmitOffer={submitOffer}
              markingComplete={markingComplete}
              onMarkComplete={handleMarkComplete}
              showReviewForm={showReviewForm}
              onShowReviewForm={() => setShowReviewForm(true)}
              onHideReviewForm={() => setShowReviewForm(false)}
              reviewRating={reviewRating}
              reviewComment={reviewComment}
              reviewPrivateFeedback={reviewPrivateFeedback}
              submittingReview={submittingReview}
              onReviewRatingChange={setReviewRating}
              onReviewCommentChange={setReviewComment}
              onReviewPrivateFeedbackChange={setReviewPrivateFeedback}
              onSubmitReview={submitReview}
              onScrollToMessages={scrollToMessages}
              onAuthRequired={handleAuthRequired}
            />

            {/* Message thread */}
            <MessageThread
              messages={messages}
              profileId={profileId}
              isPoster={isPoster}
              hasOffered={hasOffered}
              needStatus={need.status}
              acceptances={need.acceptances}
              activeMessageThread={activeMessageThread}
              onSetActiveThread={setActiveMessageThread}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              sendingMessage={sendingMessage}
              onSendMessage={sendMessage}
              messagesRef={messagesRef}
              messagesEndRef={messagesEndRef}
              onAuthRequired={handleAuthRequired}
            />
          </div>
        )}

        {/* ========== POSTER MANAGEMENT ========== */}
        {isPoster && need.status === "open" && (
          <div className="flex items-center gap-2 mb-6">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/needs/${need.id}/edit`}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> edit
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDialog({ type: "delete" })}
              className="text-[#7a6b5a] hover:text-[#ff5252]"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> delete
            </Button>
          </div>
        )}

        {/* Interested list — poster only */}
        {isPoster &&
          (need.status === "open" || need.status === "negotiating" || need.status === "active") && (
            <InterestedList
              acceptances={need.acceptances}
              needStatus={need.status}
              needRequiresContract={need.requiresContract}
              confirmingContract={confirmingContract}
              markingComplete={markingComplete}
              posterReviewAcceptanceId={posterReviewAcceptanceId}
              reviewRating={reviewRating}
              reviewComment={reviewComment}
              reviewPrivateFeedback={reviewPrivateFeedback}
              submittingReview={submittingReview}
              onAcceptance={handleAcceptance}
              onMarkComplete={handleMarkComplete}
              onSetConfirmDialog={(dialog) =>
                dialog
                  ? setConfirmDialog({
                      type: dialog.type,
                      acceptanceId: dialog.acceptanceId,
                      userName: dialog.userName,
                    })
                  : setConfirmDialog(null)
              }
              onSetPosterReview={setPosterReviewAcceptanceId}
              onSetReviewRating={setReviewRating}
              onSetReviewComment={setReviewComment}
              onSetReviewPrivateFeedback={setReviewPrivateFeedback}
              onSubmitReview={submitReview}
            />
          )}
      </div>

      {/* ========== CONFIRM DIALOG ========== */}
      {confirmDialog && (
        <ConfirmDialog
          type={confirmDialog.type}
          userName={confirmDialog.userName}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={executeConfirm}
        />
      )}
    </>
  );
}
