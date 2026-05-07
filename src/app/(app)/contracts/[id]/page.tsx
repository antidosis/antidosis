"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EB_Garamond } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Send,
  Check,
  Shield,
  FileText,
  Lock,
  Unlock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Info,
  Printer,
} from "lucide-react";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-contract",
  display: "swap",
});

type ContractData = {
  id: string;
  status: string;
  terms: string;
  partyATerms: string | null;
  partyBTerms: string | null;
  deadlineTerms: string | null;
  completionMethodTerms: string | null;
  additionalTerms: string | null;
  partyAUseMessageTerms: boolean;
  partyBUseMessageTerms: boolean;
  pdfUrl: string | null;
  partyASubmittedAt: string | null;
  partyBSubmittedAt: string | null;
  partyAAgreedAt: string | null;
  partyBAgreedAt: string | null;
  termsLockedAt: string | null;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  partyASignature: string | null;
  partyBSignature: string | null;
  updatedAt: string;
  aMarkedComplete: boolean;
  bMarkedComplete: boolean;
  completedAt: string | null;
  need: {
    id: string;
    title: string;
    description: string;
    offerType: string;
    offerDescription: string;
    images: string[];
    poster: { fullName: string | null };
  };
  partyA: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    ratingAvg: number;
    ratingCount: number;
    locationName: string | null;
    isVerified: boolean;
    skills: { id: string; name: string }[];
  };
  partyB: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    ratingAvg: number;
    ratingCount: number;
    locationName: string | null;
    isVerified: boolean;
    skills: { id: string; name: string }[];
  };
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; fullName: string | null; avatarUrl: string | null };
  }[];
  reviews: {
    id: string;
    giverId: string;
    receiverId: string;
    rating: number;
    comment: string | null;
  }[];
  negotiationMessages: Array<{
    senderName: string | null;
    content: string;
    createdAt: string;
  }>;
};

export default function ContractPage() {
  const params = useParams();
  const contractId = params.id as string;
  const supabase = createClient();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTerms, setSavingTerms] = useState(false);
  const [submittingTerms, setSubmittingTerms] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [signing, setSigning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureInput, setSignatureInput] = useState("");
  const [agreedToTermsCheck, setAgreedToTermsCheck] = useState(false);
  const { toast } = useToast();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [rating, setRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showNeedDetails, setShowNeedDetails] = useState(true);
  const [reminding, setReminding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local term state
  const [myTerms, setMyTerms] = useState("");
  const [useMessageTerms, setUseMessageTerms] = useState(false);

  useEffect(() => {
    async function init() {
      let currentProfileId: string | null = null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          const res = await fetch("/api/v1/profiles/me");
          if (res.ok) {
            const profile = await res.json();
            setProfileId(profile.id);
            currentProfileId = profile.id;
          }
        } catch {
          /* ignore */
        }
      }
      fetchContract(currentProfileId);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contract?.messages]);

  useEffect(() => {
    if (!contractId) return;
    const msgChannel = supabase
      .channel(`contract_messages:${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          fetchContract();
        }
      )
      .subscribe();
    const contractChannel = supabase
      .channel(`contract_updates:${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contractId}`,
        },
        () => {
          fetchContract();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(contractChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  async function fetchContract(currentProfileId?: string | null) {
    try {
      const res = await fetch(`/api/v1/contracts/${contractId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setContract(data.contract);

      const pid = currentProfileId ?? profileId;
      const isA = data.contract.partyA.id === pid;
      setMyTerms(
        isA
          ? data.contract.partyATerms || ""
          : data.contract.partyBTerms || ""
      );
      setUseMessageTerms(
        isA
          ? data.contract.partyAUseMessageTerms
          : data.contract.partyBUseMessageTerms
      );

    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  async function saveTerms() {
    if (!contract) return;
    setSavingTerms(true);
    const isA = contract.partyA.id === profileId;
    const body: Record<string, unknown> = {};
    if (isA) {
      body.partyATerms = useMessageTerms ? null : myTerms;
      body.partyAUseMessageTerms = useMessageTerms;
    } else {
      body.partyBTerms = useMessageTerms ? null : myTerms;
      body.partyBUseMessageTerms = useMessageTerms;
    }
    const res = await fetch(`/api/v1/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to save terms" }));
      toast(data.error || "Failed to save terms", "error");
    } else {
      toast("Terms saved", "success");
    }
    await fetchContract();
    setSavingTerms(false);
  }

  async function submitTerms() {
    if (!contract) return;
    setSubmittingTerms(true);
    const res = await fetch(`/api/v1/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submitTerms: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to submit terms" }));
      toast(data.error || "Failed to submit terms", "error");
    } else {
      toast("Terms submitted for review", "success");
    }
    await fetchContract();
    setSubmittingTerms(false);
  }

  async function agreeToTerms() {
    if (!contract) return;
    setAgreeing(true);
    const res = await fetch(`/api/v1/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agree: true, updatedAt: contract.updatedAt }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to agree" }));
      if (res.status === 409 && data.code === "TERMS_CHANGED") {
        toast("Terms were updated by the other party. Please review the latest terms before accepting.", "error");
      } else {
        toast(data.error || "Failed to agree to terms", "error");
      }
    } else {
      toast("You have agreed to the terms", "success");
    }
    await fetchContract();
    setAgreeing(false);
  }

  async function generatePdf() {
    setGeneratingPdf(true);
    await fetch(`/api/v1/contracts/${contractId}/pdf`, { method: "POST" });
    fetchContract();
    setGeneratingPdf(false);
  }

  async function signContract(signature: string) {
    setSigning(true);
    const res = await fetch(`/api/v1/contracts/${contractId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to sign" }));
      toast(data.error || "Failed to sign contract", "error");
    } else {
      toast("Contract signed", "success");
      setShowSignModal(false);
      setSignatureInput("");
      setAgreedToTermsCheck(false);
    }
    await fetchContract();
    setSigning(false);
  }

  async function remindToSign() {
    setReminding(true);
    const res = await fetch(`/api/v1/contracts/${contractId}/remind-sign`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to send reminder" }));
      toast(data.error || "Failed to send reminder", "error");
    } else {
      toast("Reminder sent to the other party", "success");
    }
    setReminding(false);
  }

  async function markComplete() {
    setCompleting(true);
    const res = await fetch(`/api/v1/contracts/${contractId}/complete`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to mark complete" }));
      toast(data.error || "Failed to mark complete", "error");
    } else {
      toast("Marked as complete", "success");
    }
    await fetchContract();
    setCompleting(false);
    setShowCompleteConfirm(false);
  }

  async function cancelContract() {
    setCancelling(true);
    const res = await fetch(`/api/v1/contracts/${contractId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to cancel" }));
      toast(data.error || "Failed to cancel contract", "error");
    } else {
      toast("Contract cancelled", "info");
    }
    await fetchContract();
    setCancelling(false);
    setShowCancelConfirm(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setSendingMsg(true);
    const res = await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId, content: messageInput }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to send message" }));
      toast(data.error || "Failed to send message", "error");
    }
    setMessageInput("");
    await fetchContract();
    setSendingMsg(false);
  }

  async function submitReview() {
    if (!contract) return;
    setSubmittingReview(true);
    const isPartyA = contract.partyA.id === profileId;
    const receiverId = isPartyA ? contract.partyB.id : contract.partyA.id;
    const res = await fetch("/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId,
        receiverId,
        rating,
        comment: reviewComment,
        privateFeedback,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to submit review" }));
      toast(data.error || "Failed to submit review", "error");
    } else {
      toast("Review submitted", "success");
      setReviewComment("");
      setPrivateFeedback("");
    }
    await fetchContract();
    setSubmittingReview(false);
  }

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-[#7a6b5a]">
        loading contract...
      </div>
    );
  if (!contract)
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-[#ff5252]">
        error: contract not found
      </div>
    );

  const isPartyA = contract.partyA.id === profileId;
  const isPartyB = contract.partyB.id === profileId;
  const otherParty = isPartyA ? contract.partyB : contract.partyA;
  const bothSigned = contract.partyASignedAt && contract.partyBSignedAt;
  const iSigned = isPartyA ? !!contract.partyASignedAt : !!contract.partyBSignedAt;
  const iMarkedComplete = isPartyA
    ? contract.aMarkedComplete
    : contract.bMarkedComplete;
  const otherMarkedComplete = isPartyA
    ? contract.bMarkedComplete
    : contract.aMarkedComplete;
  const hasReviewed = contract.reviews.some((r) => r.giverId === profileId);
  const otherReview = contract.reviews.find((r) => r.receiverId === profileId);

  const aAgreed = !!contract.partyAAgreedAt;
  const bAgreed = !!contract.partyBAgreedAt;
  const iAgreed = isPartyA ? aAgreed : bAgreed;
  const termsLocked = !!contract.termsLockedAt;

  const aSubmitted = !!contract.partyASubmittedAt;
  const bSubmitted = !!contract.partyBSubmittedAt;
  const iSubmitted = isPartyA ? aSubmitted : bSubmitted;
  const bothSubmitted = aSubmitted && bSubmitted;

  const statusLabels: Record<string, string> = {
    draft: "draft",
    pending_terms: "pending_signatures",
    active: "active",
    pending_completion: "pending_completion",
    completed: "completed",
    cancelled: "cancelled",
  };

  // Write phase: can edit terms until submitted (and not locked)
  const canEditTerms =
    !termsLocked &&
    !iSubmitted &&
    (contract.status === "draft" || contract.status === "pending_terms");
  // Review phase: both submitted, not yet locked, can accept
  const canReview =
    bothSubmitted && !termsLocked;
  const canSign =
    termsLocked &&
    !iSigned &&
    (contract.status === "draft" || contract.status === "pending_terms");

  const theirTerms = isPartyA ? contract.partyBTerms : contract.partyATerms;
  const theyUseMessageTerms = isPartyA
    ? contract.partyBUseMessageTerms
    : contract.partyAUseMessageTerms;

  return (
    <div className={`${ebGaramond.variable} min-h-screen contract-parchment`}>
      {/* Top nav bar — dark strip for UI chrome */}
      <div className="print-hidden bg-[#0a0806] border-b border-[#2a2420]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link
            href={`/needs/${contract.need.id}`}
            className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Need
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Contract
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-8 pb-12 pt-8">
      {/* Contract Document Header */}
      <div className="text-center pb-6 border-b border-[#d4b896]">
        <div className="contract-seal mb-4">Antidosis</div>
        <h1 className="contract-heading text-3xl md:text-4xl mb-2">
          Binding Exchange Contract
        </h1>
        <p className="contract-body text-sm text-[#5a4a3a]">
          Contract Reference: <span className="font-mono text-xs">{contract.id.slice(0, 8).toUpperCase()}</span>
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge
            variant={
              contract.status === "active" || contract.status === "completed"
                ? "quintessence"
                : "outline"
            }
            className="text-[10px]"
          >
            {statusLabels[contract.status] || contract.status}
          </Badge>
        </div>
      </div>

      {/* Contract Lifecycle Stepper */}
      <div className="contract-page p-5 print-hidden">
        <div className="flex items-center justify-between gap-1">
          {[
            { label: "Write Terms", active: !bothSubmitted && !termsLocked, done: bothSubmitted || termsLocked },
            { label: "Review & Accept", active: bothSubmitted && !termsLocked, done: termsLocked },
            { label: "Sign", active: termsLocked && !bothSigned, done: bothSigned || contract.status === "completed" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 h-1.5 rounded-full transition-colors ${
                step.done ? "bg-emerald-600" : step.active ? "bg-amber-600" : "bg-[#d4c4a8]"
              }`} />
              <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${
                step.done ? "text-emerald-700" : step.active ? "text-amber-700" : "text-[#8a7a60]"
              }`}>
                {step.label}
              </span>
              {i < arr.length - 1 && <div className={`flex-1 h-1.5 rounded-full ${step.done ? "bg-emerald-600" : "bg-[#d4c4a8]"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Poster cancel notice — shown when fulfiller hasn't signed yet */}
      {isPartyA &&
        !contract.partyBSignedAt &&
        (contract.status === "draft" || contract.status === "pending_terms") && (
          <div className="contract-page p-4 print-hidden border-l-2 border-l-[#ff5252]/40 bg-[#ff5252]/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#e8d5a3]">
                  Waiting for {contract.partyB.fullName || "the fulfiller"} to sign
                </p>
                <p className="text-xs text-[#7a6b5a] mt-0.5">
                  You can cancel this contract at any time before both parties sign. The need will be archived so you can edit and re-post it.
                </p>
              </div>
              <Button
                onClick={() => setShowCancelConfirm(true)}
                variant="outline"
                size="sm"
                className="text-[#ff5252] border-[#ff5252]/30 hover:border-[#ff5252]/60 hover:bg-[#ff5252]/10 shrink-0"
              >
                Cancel Contract
              </Button>
            </div>
          </div>
        )}

      {/* Original Need Post — Collapsible */}
      <div className="contract-page p-5 print-hidden">
        <button
          onClick={() => setShowNeedDetails(!showNeedDetails)}
          className="w-full flex items-center justify-between text-left hover:bg-[#1a1714] transition-colors"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a]">
            Original Need Post
          </span>
          {showNeedDetails ? (
            <ChevronUp className="h-4 w-4 text-[#7a6b5a]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#7a6b5a]" />
          )}
        </button>
        {showNeedDetails && (
          <div className="pt-4 space-y-4">
            <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">
              {contract.need.description}
            </p>
            <div className="flex items-start gap-3">
              <div className="text-sm text-[#b8a078]">
                <span className="text-xs uppercase tracking-wide text-[#7a6b5a] block mb-1">
                  Offering In Exchange
                </span>
                {contract.need.offerDescription}
              </div>
            </div>
            {contract.need.images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {contract.need.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-24 w-24 object-cover border border-[#2a2420]"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parties */}
      <div className="contract-page p-6">
        <p className="contract-label mb-4">Parties to this Agreement</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <PartySection party={contract.partyA} label="Party A — Need Poster" isMe={isPartyA} />
          <PartySection party={contract.partyB} label="Party B — Fulfiller" isMe={isPartyB} />
        </div>
      </div>

      {/* Negotiation Transcript */}
      {contract.negotiationMessages.length > 0 && (
        <div className="contract-page p-5">
          <h2 className="text-lg heading-display text-[#e8d5a3] mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Negotiation Transcript
          </h2>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {contract.negotiationMessages.map((msg, idx) => (
              <div key={idx} className="border-l-2 border-l-[#2a2420] pl-3">
                <p className="text-xs text-[#7a6b5a]">
                  {msg.senderName || "anonymous"} —{" "}
                  {new Date(msg.createdAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-[#b8a078] mt-1">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms Section */}
      <div className="contract-page p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#d4b896] pb-4">
          <h2 className="contract-heading text-xl">
            1. Terms of Agreement
          </h2>
          {termsLocked ? (
            <span className="text-xs font-medium uppercase tracking-wide text-[#00e676] flex items-center gap-1">
              <Lock className="h-3 w-3" />
              locked
            </span>
          ) : bothSubmitted ? (
            <span className="text-xs font-medium uppercase tracking-wide text-[#f5a623] flex items-center gap-1">
              <Info className="h-3 w-3" />
              review phase
            </span>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide text-[#ff5252] flex items-center gap-1">
              <Unlock className="h-3 w-3" />
              writing terms
            </span>
          )}
        </div>

        {/* Phase 1: Write Terms */}
        {!bothSubmitted && !termsLocked && (
          <>
            <div className="bg-[#f0dfc0] border border-[#d4b896] rounded-sm p-4 print-hidden">
              <p className="text-sm text-[#5a4a3a] font-medium mb-1">
                Phase 1: Write Your Terms
              </p>
              <p className="text-xs text-[#7a6b5a]">
                Both parties must write and submit their own terms before review can begin.
                You can edit your terms until you submit them.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 print-hidden">
              {/* My Terms — Write Mode */}
              <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a]">
                    Your Terms
                  </p>
                  {iSubmitted && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[#00e676] flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      submitted
                    </span>
                  )}
                </div>
                {canEditTerms ? (
                  <>
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMessageTerms}
                        onChange={(e) => setUseMessageTerms(e.target.checked)}
                        className="accent-[#f5a623]"
                      />
                      <span className="text-sm text-[#5a4a3a]">
                        use message thread as my terms
                      </span>
                    </label>
                    {useMessageTerms ? (
                      <p className="text-sm text-[#7a6b5a] italic">
                        your terms will be derived from the message thread.
                      </p>
                    ) : (
                      <Textarea
                        value={myTerms}
                        onChange={(e) => setMyTerms(e.target.value)}
                        placeholder="describe your terms, expectations, requirements..."
                        rows={4}
                      />
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button onClick={saveTerms} disabled={savingTerms} size="sm">
                        {savingTerms ? "Saving..." : "Save Terms"}
                      </Button>
                      <Button
                        onClick={submitTerms}
                        disabled={submittingTerms || (!useMessageTerms && !myTerms.trim())}
                        size="sm"
                        className="bg-[#ff3333] hover:bg-[#ff5555] text-white border-[#ff3333]"
                      >
                        {submittingTerms ? "Submitting..." : "Submit for Review"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {(isPartyA ? contract.partyAUseMessageTerms : contract.partyBUseMessageTerms) ? (
                      <p className="text-sm text-[#7a6b5a] italic">
                        using message thread as terms
                      </p>
                    ) : (
                      <p className="text-sm text-[#b8a078] whitespace-pre-line">
                        {myTerms || "no terms provided."}
                      </p>
                    )}
                    <p className="text-xs text-[#7a6b5a] mt-3 italic">
                      your terms have been submitted and cannot be edited until the other party submits theirs or terms are rejected.
                    </p>
                  </>
                )}
              </div>

              {/* Their Terms — Write Mode (waiting) */}
              <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a]">
                    {otherParty.fullName || "Other Party"}&apos;s Terms
                  </p>
                  {(isPartyA ? bSubmitted : aSubmitted) ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[#00e676] flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      submitted
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[#ff5252]">
                      waiting...
                    </span>
                  )}
                </div>
                {(isPartyA ? bSubmitted : aSubmitted) ? (
                  theyUseMessageTerms ? (
                    <p className="text-sm text-[#7a6b5a] italic">
                      {otherParty.fullName || "the other party"} is using the message thread as their terms.
                    </p>
                  ) : (
                    <p className="text-sm text-[#b8a078] whitespace-pre-line">
                      {theirTerms || "no terms provided."}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-[#7a6b5a] italic">
                    waiting for {otherParty.fullName || "the other party"} to submit their terms...
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Phase 2: Review & Accept */}
        {(bothSubmitted || termsLocked) && (
          <>
            {!termsLocked && (
              <div className="bg-[#f0dfc0] border border-[#d4b896] rounded-sm p-4 print-hidden">
                <p className="text-sm text-[#5a4a3a] font-medium mb-1">
                  Phase 2: Review & Accept
                </p>
                <p className="text-xs text-[#7a6b5a]">
                  Both parties have submitted their terms. Review them carefully before accepting.
                  Once both parties accept, terms will be locked and the contract moves to signing.
                </p>
              </div>
            )}

            {/* Both parties' terms side by side — readonly */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-3">
                  {contract.partyA.fullName || "Party A"}&apos;s Terms
                </p>
                {contract.partyAUseMessageTerms ? (
                  <p className="text-sm text-[#7a6b5a] italic">
                    using message thread as terms
                  </p>
                ) : (
                  <p className="text-sm text-[#2c1810] whitespace-pre-line leading-relaxed">
                    {contract.partyATerms || "no terms provided."}
                  </p>
                )}
              </div>
              <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-3">
                  {contract.partyB.fullName || "Party B"}&apos;s Terms
                </p>
                {contract.partyBUseMessageTerms ? (
                  <p className="text-sm text-[#7a6b5a] italic">
                    using message thread as terms
                  </p>
                ) : (
                  <p className="text-sm text-[#2c1810] whitespace-pre-line leading-relaxed">
                    {contract.partyBTerms || "no terms provided."}
                  </p>
                )}
              </div>
            </div>

            {/* Agreement status + Accept button */}
            {!termsLocked && (
              <div className="border border-[#d4b896] p-5 bg-[#f0dfc0] print-hidden">
                <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-4">
                  Acceptance Status
                </p>
                <div className="space-y-3">
                  <AgreementRow name={contract.partyA.fullName} agreed={aAgreed} />
                  <AgreementRow name={contract.partyB.fullName} agreed={bAgreed} />
                </div>
                {!iAgreed && (
                  <div className="mt-5 space-y-3">
                    <Button
                      onClick={agreeToTerms}
                      disabled={agreeing}
                      className="w-full"
                      style={{ background: '#1a0f08', color: '#f5e6c8', border: '1px solid #2c1810' }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {agreeing ? "Accepting..." : "I Accept These Terms"}
                    </Button>
                    <p className="text-center text-xs text-[#7a6b5a]">
                      By clicking accept, you agree to be bound by both parties&apos; terms as shown above.
                    </p>
                  </div>
                )}
                {iAgreed && !termsLocked && (
                  <div className="mt-5 text-center">
                    <p className="text-sm text-[#5a4a3a] font-medium">
                      You have accepted these terms
                    </p>
                    <p className="text-xs text-[#7a6b5a] mt-1">
                      waiting for the other party to accept...
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* PDF Section */}
      {termsLocked && (
        <div className="contract-page p-5 print-hidden">
          <h2 className="text-lg heading-display text-[#e8d5a3] mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contract Document
          </h2>
          {contract.pdfUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-[#00e676]">
                contract pdf generated and ready for signing
              </p>
              <Button size="sm" variant="mercury" asChild>
                <a
                  href={contract.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Download PDF
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#b8a078]">
                terms are locked. generate the contract document to proceed.
              </p>
              <Button size="sm" onClick={generatePdf} disabled={generatingPdf}>
                {generatingPdf ? "generating..." : "Generate Contract PDF"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      {termsLocked && (
        <div className="contract-page p-6">
          <h2 className="contract-heading text-xl mb-4 border-b border-[#d4b896] pb-2">
            2. Digital Signatures
          </h2>
          <div className="space-y-4">
            <SignatureRow
              name={contract.partyA.fullName}
              signed={!!contract.partyASignedAt}
              signedAt={contract.partyASignedAt}
              signatureText={contract.partyASignature}
            />
            <div className="border-t border-[#2a2420]" />
            <SignatureRow
              name={contract.partyB.fullName}
              signed={!!contract.partyBSignedAt}
              signedAt={contract.partyBSignedAt}
              signatureText={contract.partyBSignature}
            />
            {canSign && (
              <Button onClick={() => setShowSignModal(true)} className="w-full mt-4">
                <FileText className="h-3.5 w-3.5 mr-2" />
                Sign Contract
              </Button>
            )}
            {iSigned && !bothSigned && (
              <div className="space-y-3 mt-4">
                <p className="text-center text-sm text-[#7a6b5a]">
                  waiting for {otherParty.fullName || "the other party"} to
                  sign...
                </p>
                <Button
                  onClick={remindToSign}
                  disabled={reminding}
                  variant="mercury"
                  className="w-full"
                >
                  {reminding ? "sending reminder..." : "Remind to Sign"}
                </Button>
              </div>
            )}
            {bothSigned && contract.status !== "completed" && contract.status !== "cancelled" && (
              <p className="text-center text-sm text-[#b24bf5] mt-4">
                contract is active — both parties have digitally signed
              </p>
            )}
            {contract.status === "completed" && (
              <p className="text-center text-sm text-[#00e676] mt-4">
                contract complete — both parties fulfilled their obligations
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active / Completion */}
      {(contract.status === "active" ||
        contract.status === "pending_completion") && (
        <div className="contract-page p-5 print-hidden">
          <h2 className="text-lg heading-display text-[#e8d5a3] mb-4">
            Completion
          </h2>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#b8a078]">
                {contract.partyA.fullName || "party_a"}
              </span>
              {contract.aMarkedComplete ? (
                <Badge variant="success">done</Badge>
              ) : (
                <span className="text-xs text-[#7a6b5a] uppercase tracking-wide">
                  pending
                </span>
              )}
            </div>
            <div className="border-t border-[#2a2420]" />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#b8a078]">
                {contract.partyB.fullName || "party_b"}
              </span>
              {contract.bMarkedComplete ? (
                <Badge variant="success">done</Badge>
              ) : (
                <span className="text-xs text-[#7a6b5a] uppercase tracking-wide">
                  pending
                </span>
              )}
            </div>
          </div>
          {!iMarkedComplete && (
            <Button onClick={() => setShowCompleteConfirm(true)} className="w-full mt-4">
              Mark Complete
            </Button>
          )}
          {iMarkedComplete && !otherMarkedComplete && (
            <p className="text-center text-sm text-[#7a6b5a] mt-4">
              waiting for the other party...
            </p>
          )}
          {iMarkedComplete && otherMarkedComplete && (
            <p className="text-center text-sm text-[#00e676] mt-4">
              contract complete
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="contract-page p-5 print-hidden">
        <h2 className="text-lg heading-display text-[#e8d5a3] mb-2">
          Messages
        </h2>
        <p className="text-xs text-[#7a6b5a] mb-4">
          messages in this thread are part of the contract record.
          {(contract.status === "completed" || contract.status === "cancelled") && (
            <span className="text-[#f5a623] ml-1">(read-only)</span>
          )}
        </p>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {contract.messages.length === 0 && (
            <p className="text-sm text-[#7a6b5a] text-center py-4">
              no messages yet
            </p>
          )}
          {contract.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender.id === profileId ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar
                src={msg.sender.avatarUrl}
                name={msg.sender.fullName}
                size="sm"
              />
              <div
                className={`max-w-lg px-4 py-2.5 text-sm ${
                  msg.sender.id === profileId
                    ? "bg-[#1a1714] text-[#e8d5a3] border-l-2 border-l-[#f5a623]"
                    : "bg-[#12100e] text-[#b8a078] border border-[#2a2420]"
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs text-[#7a6b5a] mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {contract.status !== "completed" && contract.status !== "cancelled" && (
          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <Input
              placeholder="type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sendingMsg}
            />
            <Button type="submit" size="icon" disabled={sendingMsg}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>

      {/* Reviews */}
      {contract.status === "completed" && (
        <div className="contract-page p-5 print-hidden">
          <h2 className="text-lg heading-display text-[#e8d5a3] mb-4">
            Reviews
          </h2>
          <div className="space-y-6">
            {!hasReviewed && (
              <div className="space-y-4">
                {/* Rating Guidance */}
                <div className="vessel-lit p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-[#f5a623]" />
                    <p className="text-sm font-medium text-[#e8d5a3]">
                      Rating Guide
                    </p>
                  </div>
                  <p className="text-sm text-[#b8a078] mb-2">
                    Default excellence. Unless there was a significant problem, keep it at 10.
                    Constructive feedback is more valuable than a low score.
                  </p>
                  <div className="text-xs text-[#7a6b5a] space-y-1">
                    <p>• 10: default — everything went well, no change needed</p>
                    <p>• 8-9: good — minor suggestions go in private feedback</p>
                    <p>• 5-7: average — explain what was missing in your review</p>
                    <p>• 1-4: poor — only for significant problems</p>
                  </div>
                </div>

                <p className="text-sm text-[#b8a078]">
                  rate {otherParty.fullName || "the other party"}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className={`flex-1 transition-all duration-300 ${rating === 10 ? "accent-[#00e676]" : "accent-[#f5a623]"}`}
                  />
                  <span className={`text-lg font-bold w-12 text-center transition-colors duration-300 ${rating === 10 ? "text-[#00e676]" : "text-[#e8d5a3]"}`}>
                    {rating}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>
                    Public Review (shown on their profile)
                  </Label>
                  <Textarea
                    placeholder="share your experience publicly..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Private Feedback (only visible to{" "}
                    {otherParty.fullName || "them"}, not on their public
                    profile)
                  </Label>
                  <Textarea
                    placeholder="share constructive criticism privately..."
                    value={privateFeedback}
                    onChange={(e) => setPrivateFeedback(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={submitReview} disabled={submittingReview} className="w-full">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            )}
            {hasReviewed && (
              <p className="text-center text-sm text-[#7a6b5a]">
                you have submitted your review
              </p>
            )}
            {otherReview && (
              <div className="vessel p-4 mt-4">
                <p className="text-xs text-[#7a6b5a] uppercase tracking-wide mb-2">
                  {otherParty.fullName || "the other party"} reviewed you
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-[#f5a623]">{otherReview.rating}</span>
                  <span className="text-xs text-[#7a6b5a]">/ 10</span>
                </div>
                {otherReview.comment && (
                  <p className="text-sm text-[#b8a078]">{otherReview.comment}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel */}
      {(contract.status === "draft" ||
        contract.status === "pending_terms" ||
        contract.status === "active") && (
        <div className="text-center py-12">
          <Button
            onClick={() => setShowCancelConfirm(true)}
            variant="ghost"
            className="text-[#ff5252]"
          >
            Cancel Contract
          </Button>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12100e] border border-[#2a2420] p-6 rounded-md max-w-sm w-full mx-4">
            <p className="text-sm text-[#e8d5a3] mb-4">Cancel this contract? The need will be archived so you can edit and re-post it later.</p>
            <div className="flex gap-3">
              <Button onClick={cancelContract} disabled={cancelling} variant="ghost" className="flex-1 text-[#ff5252]">
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
              <Button onClick={() => setShowCancelConfirm(false)} variant="secondary" className="flex-1">
                Keep Contract
              </Button>
            </div>
          </div>
        </div>
      )}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12100e] border border-[#2a2420] p-6 rounded-md max-w-sm w-full mx-4">
            <p className="text-sm text-[#e8d5a3] mb-4">Are you sure both parties have fulfilled their obligations?</p>
            <div className="flex gap-3">
              <Button onClick={markComplete} disabled={completing} variant="secondary" className="flex-1">
                {completing ? "Marking..." : "Yes, Complete"}
              </Button>
              <Button onClick={() => setShowCompleteConfirm(false)} variant="outline" className="flex-1">
                Not Yet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignModal && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#f5e6c8] border border-[#d4b896] p-6 rounded-sm max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-5">
              <div className="contract-seal text-lg mb-2">Antidosis</div>
              <h3 className="contract-heading text-xl text-[#1a0f08]">Digital Signature</h3>
              <p className="text-xs text-[#5a4a3a] mt-1">You are about to sign a legally binding contract</p>
            </div>

            <div className="bg-[#f0dfc0] border border-[#d4b896] p-3 mb-4 text-xs text-[#5a4a3a]">
              <p className="font-medium mb-1">Contract Summary:</p>
              <p><strong>Need:</strong> {contract.need.title}</p>
              <p><strong>Party A:</strong> {contract.partyA.fullName}</p>
              <p><strong>Party B:</strong> {contract.partyB.fullName}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#5a4a3a] uppercase tracking-wider mb-1.5 block">
                  Type your full name as your signature
                </Label>
                <Input
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  placeholder={`e.g. ${isPartyA ? contract.partyA.fullName : contract.partyB.fullName}`}
                  className="bg-[#f0dfc0] border-[#d4b896] text-[#2c1810] placeholder:text-[#8a7a60]"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTermsCheck}
                  onChange={(e) => setAgreedToTermsCheck(e.target.checked)}
                  className="accent-[#f5a623] mt-0.5"
                />
                <span className="text-xs text-[#5a4a3a] leading-relaxed">
                  I have read and understood the terms of this contract. I agree to be legally bound by both parties&apos; terms as shown above. I understand this constitutes a digital signature under the <em>Electronic Transactions Act 1999</em> (Cth).
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                onClick={() => signContract(signatureInput.trim())}
                disabled={signing || !signatureInput.trim() || !agreedToTermsCheck}
                className="flex-1"
                style={{ background: '#1a0f08', color: '#f5e6c8', border: '1px solid #2c1810' }}
              >
                {signing ? "Signing..." : "Sign Contract"}
              </Button>
              <Button
                onClick={() => { setShowSignModal(false); setSignatureInput(""); setAgreedToTermsCheck(false); }}
                variant="outline"
                className="flex-1 border-[#d4b896] text-[#5a4a3a] hover:bg-[#f0dfc0]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function PartySection({
  party,
  label,
  isMe,
}: {
  party: ContractData["partyA"];
  label: string;
  isMe: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="contract-label">{label}</span>
        {isMe && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a7a60]">you</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/profile/${party.id}`} className="print-hidden">
          <Avatar src={party.avatarUrl} name={party.fullName} size="md" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${party.id}`}
              className="text-base font-semibold truncate text-[#1a0f08] hover:text-[#5a4a3a] transition-colors print:hidden"
            >
              {party.fullName || "anonymous"}
            </Link>
            <span className="text-base font-semibold text-[#1a0f08] hidden print:inline">
              {party.fullName || "anonymous"}
            </span>
            {party.isVerified && (
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
            )}
          </div>
          <div className="text-sm text-[#5a4a3a] mt-0.5">
            {party.ratingCount > 0 && (
              <span>{party.ratingAvg.toFixed(1)} ★</span>
            )}
            {party.locationName && (
              <span className="ml-2">{party.locationName}</span>
            )}
          </div>
        </div>
      </div>
      {party.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {party.skills.map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#c4b496] text-[#5a4a3a]"
            >
              {skill.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SignatureRow({
  name,
  signed,
  signedAt,
  signatureText,
}: {
  name: string | null;
  signed: boolean;
  signedAt?: string | null;
  signatureText?: string | null;
}) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="contract-body font-semibold">
          {name || "anonymous"}
        </span>
        {signed ? (
          <Badge variant="success" className="gap-1 print-hidden">
            <Check className="h-3 w-3" />
            signed
          </Badge>
        ) : (
          <span className="text-xs text-[#8a7a60] uppercase tracking-wide print-hidden">
            pending
          </span>
        )}
      </div>
      {signed && signedAt && (
        <p className="text-xs text-[#5a4a3a] mb-2 print-hidden">
          digitally signed on{" "}
          {new Date(signedAt).toLocaleString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      <div className="signature-line" />
      {signed && signatureText ? (
        <p className="text-sm text-[#2c1810] mt-1 font-serif italic" style={{ fontFamily: "'Georgia', serif" }}>
          {signatureText}
        </p>
      ) : (
        <p className="text-[10px] text-[#8a7a60] mt-1 uppercase tracking-wider">Signature</p>
      )}
    </div>
  );
}

function AgreementRow({
  name,
  agreed,
}: {
  name: string | null;
  agreed: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="contract-body font-medium">{name || "anonymous"}</span>
      {agreed ? (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-600" />
          <Badge variant="success" className="gap-1 print-hidden">
            <Check className="h-3 w-3" />
            agreed
          </Badge>
          <span className="text-xs text-emerald-700 uppercase tracking-wide hidden print:inline">agreed</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 print-hidden">
          <div className="h-2 w-2 rounded-full bg-[#8a7a60]" />
          <span className="text-xs text-[#8a7a60] uppercase tracking-wide">
            pending agreement
          </span>
        </div>
      )}
    </div>
  );
}
