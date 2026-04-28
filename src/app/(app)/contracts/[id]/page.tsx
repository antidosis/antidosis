"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

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
  partyAAgreedAt: string | null;
  partyBAgreedAt: string | null;
  termsLockedAt: string | null;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
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
  const [sharedDeadline, setSharedDeadline] = useState("");
  const [sharedCompletion, setSharedCompletion] = useState("");
  const [sharedAdditional, setSharedAdditional] = useState("");

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
      setSharedDeadline(data.contract.deadlineTerms || "");
      setSharedCompletion(data.contract.completionMethodTerms || "");
      setSharedAdditional(data.contract.additionalTerms || "");
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  async function saveTerms() {
    if (!contract) return;
    const isA = contract.partyA.id === profileId;
    const body: Record<string, unknown> = {
      deadlineTerms: sharedDeadline || null,
      completionMethodTerms: sharedCompletion || null,
      additionalTerms: sharedAdditional || null,
    };
    if (isA) {
      body.partyATerms = useMessageTerms ? null : myTerms;
      body.partyAUseMessageTerms = useMessageTerms;
    } else {
      body.partyBTerms = useMessageTerms ? null : myTerms;
      body.partyBUseMessageTerms = useMessageTerms;
    }
    await fetch(`/api/v1/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchContract();
  }

  async function agreeToTerms() {
    await fetch(`/api/v1/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agree: true }),
    });
    fetchContract();
  }

  async function generatePdf() {
    setGeneratingPdf(true);
    await fetch(`/api/v1/contracts/${contractId}/pdf`, { method: "POST" });
    fetchContract();
    setGeneratingPdf(false);
  }

  async function signContract() {
    await fetch(`/api/v1/contracts/${contractId}/sign`, { method: "POST" });
    fetchContract();
  }

  async function remindToSign() {
    setReminding(true);
    await fetch(`/api/v1/contracts/${contractId}/remind-sign`, {
      method: "POST",
    });
    setReminding(false);
    alert("reminder sent to the other party.");
  }

  async function markComplete() {
    await fetch(`/api/v1/contracts/${contractId}/complete`, {
      method: "POST",
    });
    fetchContract();
  }

  async function cancelContract() {
    if (!confirm("cancel this contract? the need will be re-opened.")) return;
    await fetch(`/api/v1/contracts/${contractId}/cancel`, {
      method: "POST",
    });
    fetchContract();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId, content: messageInput }),
    });
    setMessageInput("");
    fetchContract();
  }

  async function submitReview() {
    if (!contract) return;
    const isPartyA = contract.partyA.id === profileId;
    const receiverId = isPartyA ? contract.partyB.id : contract.partyA.id;
    await fetch("/api/v1/reviews", {
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
    fetchContract();
    setReviewComment("");
    setPrivateFeedback("");
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

  const aAgreed = !!contract.partyAAgreedAt;
  const bAgreed = !!contract.partyBAgreedAt;
  const iAgreed = isPartyA ? aAgreed : bAgreed;
  const termsLocked = !!contract.termsLockedAt;

  const statusLabels: Record<string, string> = {
    draft: "draft",
    pending_terms: "pending_signatures",
    active: "active",
    pending_completion: "pending_completion",
    completed: "completed",
    cancelled: "cancelled",
  };

  const canEditTerms =
    !termsLocked &&
    (contract.status === "draft" || contract.status === "pending_terms");
  const canSign =
    termsLocked &&
    !iSigned &&
    (contract.status === "draft" || contract.status === "pending_terms");

  const theirTerms = isPartyA ? contract.partyBTerms : contract.partyATerms;
  const theyUseMessageTerms = isPartyA
    ? contract.partyBUseMessageTerms
    : contract.partyAUseMessageTerms;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-10 pb-12">
      {/* Breadcrumb */}
      <div className="py-6">
        <Link
          href={`/needs/${contract.need.id}`}
          className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          $ cd ~/needs/
        </Link>
      </div>

      {/* Header */}
      <div>
        <p className="text-xs text-[#7a6b5a] mb-4">
          $ cat contract_{contract.id.slice(0, 8)}.sh
        </p>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="heading-display text-2xl text-[#e8d5a3]">
            {contract.need.title}
          </h1>
          <Badge
            variant={
              contract.status === "active" || contract.status === "completed"
                ? "quintessence"
                : "outline"
            }
          >
            {statusLabels[contract.status] || contract.status}
          </Badge>
        </div>
        <p className="text-xs text-[#7a6b5a] uppercase tracking-wide">
          contract #{contract.id.slice(0, 8)}
        </p>
      </div>

      {/* Original Need Post — Collapsible */}
      <div className="vessel-lit p-5">
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
      <div className="grid sm:grid-cols-2 gap-4">
        <PartySection party={contract.partyA} label="Need Poster" isMe={isPartyA} />
        <PartySection party={contract.partyB} label="Fulfiller" isMe={isPartyB} />
      </div>

      {/* Negotiation Transcript */}
      {contract.negotiationMessages.length > 0 && (
        <div className="vessel p-5">
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg heading-display text-[#e8d5a3]">
            Contract Terms
          </h2>
          {termsLocked ? (
            <span className="text-xs font-medium uppercase tracking-wide text-[#00e676] flex items-center gap-1">
              <Lock className="h-3 w-3" />
              locked
            </span>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide text-[#ff5252] flex items-center gap-1">
              <Unlock className="h-3 w-3" />
              negotiating
            </span>
          )}
        </div>

        {/* Two-column: My Terms / Their Terms */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* My Terms */}
          <div className="vessel p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-4">
              Your Terms
            </p>
            {canEditTerms ? (
              <>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMessageTerms}
                    onChange={(e) => setUseMessageTerms(e.target.checked)}
                    className="accent-[#f5a623]"
                  />
                  <span className="text-sm text-[#b8a078]">
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
              </>
            ) : (
              <>
                {useMessageTerms ||
                (isPartyA
                  ? contract.partyAUseMessageTerms
                  : contract.partyBUseMessageTerms) ? (
                  <p className="text-sm text-[#7a6b5a] italic">
                    using message thread as terms
                  </p>
                ) : (
                  <p className="text-sm text-[#b8a078] whitespace-pre-line">
                    {myTerms || "no terms provided."}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Their Terms */}
          <div className="vessel p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-4">
              Their Terms
            </p>
            {theyUseMessageTerms ? (
              <p className="text-sm text-[#7a6b5a] italic">
                {otherParty.fullName || "the other party"} is using the message
                thread as their terms.
              </p>
            ) : (
              <p className="text-sm text-[#b8a078] whitespace-pre-line">
                {theirTerms || "no terms provided yet."}
              </p>
            )}
          </div>
        </div>

        {/* Shared Optional Terms */}
        <div className="vessel p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-4">
            Shared Terms (Optional)
          </p>
          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Deadline Terms</Label>
              <Input
                value={sharedDeadline}
                onChange={(e) => setSharedDeadline(e.target.value)}
                placeholder="e.g. must be completed by Friday"
                disabled={!canEditTerms}
              />
            </div>
            <div className="space-y-2">
              <Label>Completion Method</Label>
              <Input
                value={sharedCompletion}
                onChange={(e) => setSharedCompletion(e.target.value)}
                placeholder="e.g. in-person handover, digital delivery"
                disabled={!canEditTerms}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Terms</Label>
              <Textarea
                value={sharedAdditional}
                onChange={(e) => setSharedAdditional(e.target.value)}
                placeholder="any other conditions, requirements, or notes..."
                rows={2}
                disabled={!canEditTerms}
              />
            </div>
            {canEditTerms && <Button onClick={saveTerms}>Update Terms</Button>}
          </div>
        </div>

        {/* Agreement status */}
        {!termsLocked && (
          <div className="vessel p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] mb-4">
              Party Agreements
            </p>
            <div className="space-y-3">
              <AgreementRow name={contract.partyA.fullName} agreed={aAgreed} />
              <AgreementRow name={contract.partyB.fullName} agreed={bAgreed} />
            </div>
            {!iAgreed && canEditTerms && (
              <Button
                onClick={agreeToTerms}
                className="w-full mt-4"
                variant="secondary"
              >
                <Check className="h-3.5 w-3.5 mr-2" />
                Agree to Terms
              </Button>
            )}
            {iAgreed && !termsLocked && (
              <p className="text-center text-sm text-[#7a6b5a] mt-4">
                waiting for the other party to agree...
              </p>
            )}
          </div>
        )}
      </div>

      {/* PDF Section */}
      {termsLocked && (
        <div className="vessel p-5">
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
        <div
          className={`p-5 ${
            bothSigned
              ? "vessel-sacred glow-quintessence"
              : "vessel"
          }`}
        >
          <h2 className="text-lg heading-display text-[#e8d5a3] mb-4">
            Signatures
          </h2>
          <div className="space-y-4">
            <SignatureRow
              name={contract.partyA.fullName}
              signed={!!contract.partyASignedAt}
              signedAt={contract.partyASignedAt}
            />
            <div className="border-t border-[#2a2420]" />
            <SignatureRow
              name={contract.partyB.fullName}
              signed={!!contract.partyBSignedAt}
              signedAt={contract.partyBSignedAt}
            />
            {canSign && (
              <Button onClick={signContract} className="w-full mt-4">
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
            {bothSigned && (
              <p className="text-center text-sm text-[#b24bf5] mt-4">
                contract is active — both parties have digitally signed
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active / Completion */}
      {(contract.status === "active" ||
        contract.status === "pending_completion") && (
        <div className="vessel p-5">
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
            <Button onClick={markComplete} className="w-full mt-4">
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
      {contract.status !== "completed" && contract.status !== "cancelled" && (
        <div className="vessel p-5">
          <h2 className="text-lg heading-display text-[#e8d5a3] mb-2">
            Messages
          </h2>
          <p className="text-xs text-[#7a6b5a] mb-4">
            messages in this thread are part of the contract record.
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
          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <Input
              placeholder="type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Reviews */}
      {contract.status === "completed" && (
        <div
          className={`p-5 ${
            contract.status === "completed"
              ? "vessel-sacred glow-quintessence"
              : "vessel"
          }`}
        >
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
                    ratings help build trust. a high rating with constructive
                    feedback is more valuable than a low rating for minor
                    issues.
                  </p>
                  <div className="text-xs text-[#7a6b5a] space-y-1">
                    <p>• 9-10: excellent — minor suggestions welcome</p>
                    <p>• 7-8: good — note areas for improvement</p>
                    <p>• 5-6: average — explain what was missing</p>
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
                    className="flex-1 accent-[#f5a623]"
                  />
                  <span className="text-lg font-bold w-12 text-center text-[#e8d5a3]">
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

                <Button onClick={submitReview} className="w-full">
                  Submit Review
                </Button>
              </div>
            )}
            {hasReviewed && (
              <p className="text-center text-sm text-[#7a6b5a]">
                you have submitted your review
              </p>
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
            onClick={cancelContract}
            variant="ghost"
            className="text-[#ff5252]"
          >
            Cancel Contract
          </Button>
        </div>
      )}
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
    <div className="vessel p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-[#7a6b5a]">
          {label}
        </span>
        {isMe && (
          <span className="text-xs font-medium uppercase tracking-wider text-[#7a6b5a]">
            you
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/profile/${party.id}`}>
          <Avatar src={party.avatarUrl} name={party.fullName} size="md" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${party.id}`}
              className="text-sm font-medium truncate text-[#e8d5a3] hover:text-[#f5a623] transition-colors"
            >
              {party.fullName || "anonymous"}
            </Link>
            {party.isVerified && (
              <Shield className="h-3.5 w-3.5 text-[#00e676]" />
            )}
          </div>
          <div className="text-xs text-[#7a6b5a] mt-0.5">
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
        <div className="flex flex-wrap gap-2 mt-4">
          {party.skills.map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a]"
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
}: {
  name: string | null;
  signed: boolean;
  signedAt?: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm text-[#b8a078]">
          {name || "anonymous"}
        </span>
        {signed && signedAt && (
          <p className="text-xs text-[#00e676]">
            signed{" "}
            {new Date(signedAt).toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      {signed ? (
        <Badge variant="success" className="gap-1">
          <Check className="h-3 w-3" />
          signed
        </Badge>
      ) : (
        <span className="text-xs text-[#7a6b5a] uppercase tracking-wide">
          pending
        </span>
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
      <span className="text-sm text-[#b8a078]">{name || "anonymous"}</span>
      {agreed ? (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#f5a623] shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
          <Badge variant="success" className="gap-1">
            <Check className="h-3 w-3" />
            agreed
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#7a6b5a]" />
          <span className="text-xs text-[#7a6b5a] uppercase tracking-wide">
            pending agreement
          </span>
        </div>
      )}
    </div>
  );
}
