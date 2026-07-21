import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { mutate as swrMutate } from "swr";
import {
  useContract,
  useSignContract,
  useCompleteContract,
  useProfile,
  useCancelContract,
  useRequestContractCancel,
  useRespondContractCancel,
  useEscalateContractCancel,
  useCreateReview,
  useRemindSign,
  useGenerateContractPdf,
  useSendContractMessage,
  useUpdateContract,
} from "@mobile/hooks/useApi";
import { useHaptics } from "@mobile/hooks/useNative";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Star,
  MessageCircle,
  Lock,
  Unlock,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Send,
  Bell,
  Download,
  Info,
} from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Button, Input, Avatar } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   CONTRACT DETAIL SCREEN — The Parchment
   The ONLY light-mode screen in the app. Warm cream background,
   serif fonts, contract seal, signature lines.
   ═══════════════════════════════════════════════════════════════ */

const STATUS_STEPS = [
  { key: "draft", label: "Write Terms" },
  { key: "pending_terms", label: "Review & Accept" },
  { key: "active", label: "Sign" },
  { key: "pending_completion", label: "Pending Completion" },
  { key: "completed", label: "Complete" },
];

export function ContractDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, error, isLoading } = useContract(id);
  const { data: profile } = useProfile();
  const { tap, success, error: hapticError } = useHaptics();
  const { trigger: sign, isMutating: signing } = useSignContract();
  const { trigger: complete, isMutating: completing } = useCompleteContract();

  const [signature, setSignature] = useState("");
  const [showSignForm, setShowSignForm] = useState(false);
  const [actionError, setActionError] = useState("");

  // Cancellation state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRespondForm, setShowRespondForm] = useState(false);
  const [respondAgree, setRespondAgree] = useState<boolean | null>(null);
  const [respondText, setRespondText] = useState("");

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");

  // Message input
  const [messageInput, setMessageInput] = useState("");

  // Terms negotiation state
  const [myTerms, setMyTerms] = useState("");
  const [useMessageTerms, setUseMessageTerms] = useState(false);

  const { trigger: cancel, isMutating: cancelling } = useCancelContract();
  const { trigger: requestCancel, isMutating: requestingCancel } = useRequestContractCancel();
  const { trigger: respondCancel, isMutating: respondingCancel } = useRespondContractCancel();
  const { trigger: escalateCancel, isMutating: escalatingCancel } = useEscalateContractCancel();
  const { trigger: createReview, isMutating: submittingReview } = useCreateReview();
  const { trigger: remind, isMutating: reminding } = useRemindSign();
  const { trigger: generatePdf, isMutating: generatingPdf } = useGenerateContractPdf();
  const { trigger: sendMsg, isMutating: sendingMsg } = useSendContractMessage();
  const { trigger: updateContract, isMutating: updatingContract } = useUpdateContract();

  const contract = data?.contract;

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
        <span className="font-mono text-xs text-[var(--leather)]">$ loading contract...</span>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-full pb-6 pt-4 safe-top px-4">
        <button
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/contracts");
          }}
          className="p-2 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--parchment)] tap-highlight-none mb-4"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="p-4 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30 text-[var(--ruby)] text-sm font-mono">
          $ error: {error?.message ?? "Contract not found"}
        </div>
      </div>
    );
  }

  const myId = profile?.id;
  const isPartyA = contract.partyAId === myId;
  const isPartyB = contract.partyBId === myId;
  const mySignedAt = isPartyA ? contract.partyASignedAt : contract.partyBSignedAt;
  const otherSignedAt = isPartyA ? contract.partyBSignedAt : contract.partyASignedAt;
  const otherParty = isPartyA ? contract.partyB : contract.partyA;
  const iMarkedComplete = isPartyA ? contract.aMarkedComplete : contract.bMarkedComplete;
  const otherMarkedComplete = isPartyA ? contract.bMarkedComplete : contract.aMarkedComplete;

  const termsLocked = !!contract.termsLockedAt;
  const aSubmitted = !!contract.partyASubmittedAt;
  const bSubmitted = !!contract.partyBSubmittedAt;
  const aAgreed = !!contract.partyAAgreedAt;
  const bAgreed = !!contract.partyBAgreedAt;
  const iSubmitted = isPartyA ? aSubmitted : bSubmitted;
  const iAgreed = isPartyA ? aAgreed : bAgreed;
  const bothSubmitted = aSubmitted && bSubmitted;
  const bothSigned = !!contract.partyASignedAt && !!contract.partyBSignedAt;

  const canSign =
    termsLocked &&
    !mySignedAt &&
    (contract.status === "draft" || contract.status === "pending_terms");
  const canComplete = contract.status === "active" || contract.status === "pending_completion";

  const myFullName = profile?.fullName ?? "";
  const signatureValid =
    signature.trim().length > 0 && signature.trim().toLowerCase() === myFullName.toLowerCase();

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === contract.status);
  const progressPercent = ((currentStepIndex + 1) / STATUS_STEPS.length) * 100;

  const handleSign = async () => {
    if (!id || !signature.trim()) return;
    tap("medium");
    setActionError("");
    try {
      await sign({ id, signature: signature.trim() });
      setShowSignForm(false);
      setSignature("");
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to sign");
      hapticError();
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    tap("medium");
    setActionError("");
    try {
      await complete({ id });
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to complete");
      hapticError();
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    tap("medium");
    setActionError("");
    try {
      await cancel({ id, reason: cancelReason.trim() || undefined });
      setShowCancelForm(false);
      setCancelReason("");
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to cancel");
      hapticError();
    }
  };

  const handleRequestCancel = async () => {
    if (!id || !cancelReason.trim()) return;
    tap("medium");
    setActionError("");
    try {
      await requestCancel({ id, reason: cancelReason.trim() });
      setShowCancelForm(false);
      setCancelReason("");
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to request cancellation");
      hapticError();
    }
  };

  const handleRespondCancel = async () => {
    if (!id || respondAgree === null) return;
    tap("medium");
    setActionError("");
    try {
      await respondCancel({ id, agree: respondAgree, response: respondText.trim() || undefined });
      setShowRespondForm(false);
      setRespondAgree(null);
      setRespondText("");
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to respond");
      hapticError();
    }
  };

  const handleEscalate = async () => {
    if (!id) return;
    tap("medium");
    setActionError("");
    try {
      await escalateCancel({ id, reason: cancelReason.trim() || "Escalated to admin" });
      setShowCancelForm(false);
      setCancelReason("");
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to escalate");
      hapticError();
    }
  };

  const handleSubmitReview = async () => {
    if (!id || !contract) return;
    const receiverId = isPartyA ? contract.partyBId : contract.partyAId;
    tap("medium");
    setActionError("");
    try {
      await createReview({
        contractId: id,
        receiverId,
        rating,
        comment: reviewComment.trim(),
        privateFeedback: privateFeedback.trim() || undefined,
      });
      setShowReviewForm(false);
      setRating(10);
      setReviewComment("");
      setPrivateFeedback("");
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to submit review");
      hapticError();
    }
  };

  const handleSendMessage = async () => {
    if (!id || !messageInput.trim()) return;
    tap("medium");
    setActionError("");
    try {
      await sendMsg({ contractId: id, content: messageInput.trim() });
      setMessageInput("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send message");
      hapticError();
    }
  };

  const handleSaveTerms = async () => {
    if (!id || !contract) return;
    tap("medium");
    setActionError("");
    try {
      const data = isPartyA
        ? {
            partyATerms: useMessageTerms ? null : myTerms.trim(),
            partyAUseMessageTerms: useMessageTerms,
          }
        : {
            partyBTerms: useMessageTerms ? null : myTerms.trim(),
            partyBUseMessageTerms: useMessageTerms,
          };
      await updateContract({ id, data });
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to save terms");
      hapticError();
    }
  };

  const handleSubmitTerms = async () => {
    if (!id || !contract) return;
    tap("medium");
    setActionError("");
    try {
      await updateContract({ id, data: { submitTerms: true } });
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to submit terms");
      hapticError();
    }
  };

  const handleAgree = async () => {
    if (!id || !contract) return;
    tap("medium");
    setActionError("");
    try {
      await updateContract({
        id,
        data: { agree: true, updatedAt: contract.updatedAt },
      });
      success();
    } catch (e) {
      if (e instanceof Error && e.message.includes("409")) {
        setActionError("Terms changed. Refreshing...");
        swrMutate(["contract", id]);
      } else {
        setActionError(e instanceof Error ? e.message : "Failed to agree");
      }
      hapticError();
    }
  };

  const handleRemind = async () => {
    if (!id) return;
    tap("medium");
    setActionError("");
    try {
      await remind({ id });
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send reminder");
      hapticError();
    }
  };

  const handleGeneratePdf = async () => {
    if (!id) return;
    tap("medium");
    setActionError("");
    try {
      await generatePdf({ id });
      success();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to generate PDF");
      hapticError();
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Dark header for navigation */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--void)] border-b border-[var(--bronze)] safe-top shrink-0">
        <button
          onClick={() => {
            hapticImpact("light");
            if (window.history.length > 1) navigate(-1);
            else navigate("/contracts");
          }}
          className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-[var(--gold)] truncate">
            {contract.need?.title ?? "Contract"}
          </h1>
          <p className="font-mono text-[10px] text-[var(--leather)]">
            Ref: {contract.id.slice(0, 8)}
          </p>
        </div>
        <button
          aria-label="Chat about contract"
          onClick={() => {
            hapticImpact("light");
            if (otherParty?.id) {
              navigate(`/chat/dm/${otherParty.id}`);
            } else {
              navigate("/chat");
            }
          }}
          className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
        >
          <MessageCircle size={16} />
        </button>
      </div>

      {/* ═══ PARCHMENT CONTENT ═══ */}
      <div className="flex-1 bg-[#f5e6c8] text-[#2c1810] font-contract">
        <div className="px-5 py-6 max-w-3xl mx-auto">
          {/* Contract Seal */}
          <div className="flex justify-center mb-6">
            <div className="border-2 border-[#1a0f08] px-4 py-2">
              <span className="font-contract font-bold text-sm uppercase tracking-[0.2em] text-[#1a0f08]">
                Antidosis
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-contract text-2xl font-bold text-[#1a0f08] text-center mb-1">
            Binding Exchange Contract
          </h1>
          <p className="font-mono text-[10px] text-[#8a7050] text-center mb-6">
            REF-{contract.id.slice(0, 12).toUpperCase()}
          </p>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <StatusBadge status={contract.status} />
          </div>

          {/* Lifecycle Stepper */}
          <div className="mb-6">
            <div className="h-1.5 bg-[#d4c4a8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00e676] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {STATUS_STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={`font-mono text-[8px] uppercase tracking-wider ${
                    i <= currentStepIndex ? "text-[#1a0f08]" : "text-[#8a7050]"
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Parties */}
          <section className="mb-6">
            <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
              Parties
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <PartyBlock
                label="Party A"
                name={contract.partyA?.fullName ?? "—"}
                signed={!!contract.partyASignedAt}
                isMe={isPartyA}
              />
              <PartyBlock
                label="Party B"
                name={contract.partyB?.fullName ?? "—"}
                signed={!!contract.partyBSignedAt}
                isMe={isPartyB}
              />
            </div>
          </section>

          {/* Terms Lock Status */}
          {contract.status !== "cancelled" && contract.status !== "completed" && (
            <section className="mb-6">
              <div className="flex items-center justify-between border-b border-[#d4b896] pb-1 mb-3">
                <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider">
                  Terms Status
                </h2>
                {termsLocked ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#2e7d32] flex items-center gap-1">
                    <Lock size={10} />
                    Locked
                  </span>
                ) : bothSubmitted ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a6d0b] flex items-center gap-1">
                    <Info size={10} />
                    Review Phase
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#c41e1e] flex items-center gap-1">
                    <Unlock size={10} />
                    Negotiating
                  </span>
                )}
              </div>

              {/* Submission / Agreement rows */}
              {!termsLocked && (
                <div className="space-y-2 mb-4">
                  <AgreementRow
                    name={contract.partyA?.fullName}
                    done={aSubmitted}
                    label="Submitted"
                  />
                  <AgreementRow
                    name={contract.partyB?.fullName}
                    done={bSubmitted}
                    label="Submitted"
                  />
                  {bothSubmitted && (
                    <>
                      <AgreementRow
                        name={contract.partyA?.fullName}
                        done={aAgreed}
                        label="Agreed"
                      />
                      <AgreementRow
                        name={contract.partyB?.fullName}
                        done={bAgreed}
                        label="Agreed"
                      />
                    </>
                  )}
                </div>
              )}

              {/* Negotiation Messages */}
              {Array.isArray(contract.negotiationMessages) &&
                contract.negotiationMessages.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                    <p className="font-mono text-[10px] text-[#8a7050] uppercase tracking-wider">
                      Negotiation Transcript
                    </p>
                    {(
                      contract.negotiationMessages as Array<{
                        senderName: string | null;
                        content: string;
                        createdAt: string;
                      }>
                    ).map((msg, idx) => (
                      <div key={idx} className="border-l-2 border-[#d4b896] pl-2">
                        <p className="font-mono text-[10px] text-[#8a7050]">
                          {msg.senderName || "Anonymous"} —{" "}
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[#2c1810] mt-0.5">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
            </section>
          )}

          {/* Terms */}
          {contract.terms && (
            <section className="mb-6">
              <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
                Terms
              </h2>
              <div className="p-3 bg-[#f0dfc0] border border-[#d4b896] rounded-sm">
                <p className="text-sm text-[#2c1810] whitespace-pre-wrap leading-relaxed">
                  {contract.terms}
                </p>
              </div>
            </section>
          )}

          {/* Need Reference */}
          <section className="mb-6">
            <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
              Subject
            </h2>
            <p className="text-sm text-[#2c1810]">{contract.need?.title ?? "—"}</p>
          </section>

          {/* PDF */}
          {termsLocked && (
            <section className="mb-6">
              <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
                Contract Document
              </h2>
              {contract.pdfUrl ? (
                <a
                  href={contract.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#f0dfc0] border border-[#d4b896] rounded-sm text-sm text-[#1a0f08] hover:bg-[#e8d5a3] transition-colors"
                >
                  <Download size={14} />
                  Download PDF
                </a>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[#8a7050]">
                    Terms are locked. Generate the contract document to proceed.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleGeneratePdf}
                    disabled={generatingPdf}
                    haptic={false}
                  >
                    {generatingPdf ? "Generating..." : "Generate Contract PDF"}
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Signatures */}
          <section className="mb-6">
            <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
              Signatures
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <SignatureLine
                name={contract.partyA?.fullName ?? "Party A"}
                signed={!!contract.partyASignedAt}
                date={contract.partyASignedAt ?? undefined}
              />
              <SignatureLine
                name={contract.partyB?.fullName ?? "Party B"}
                signed={!!contract.partyBSignedAt}
                date={contract.partyBSignedAt ?? undefined}
              />
            </div>
          </section>

          {/* Completion */}
          {(contract.status === "active" || contract.status === "pending_completion") && (
            <section className="mb-6">
              <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
                Completion
              </h2>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[#2c1810]">
                    {contract.partyA?.fullName || "Party A"}
                  </span>
                  {contract.aMarkedComplete ? (
                    <span className="text-[10px] font-mono text-[#2e7d32] flex items-center gap-1">
                      <CheckCircle size={10} /> Done
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#8a7050]">Pending</span>
                  )}
                </div>
                <div className="border-t border-[#d4b896]" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[#2c1810]">
                    {contract.partyB?.fullName || "Party B"}
                  </span>
                  {contract.bMarkedComplete ? (
                    <span className="text-[10px] font-mono text-[#2e7d32] flex items-center gap-1">
                      <CheckCircle size={10} /> Done
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#8a7050]">Pending</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Messages (embedded dark theme) */}
          <section className="mb-6">
            <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
              Messages
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {contract.messages?.length === 0 && (
                <p className="text-xs text-[#8a7050] text-center py-4">No messages yet</p>
              )}
              {contract.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-md ${
                    msg.sender?.id === myId
                      ? "bg-[#1a1714] border-l-2 border-l-[#f5a623] text-[#e8d5a3]"
                      : "bg-[#12100e] border border-[#2a2420] text-[#b8a078]"
                  }`}
                >
                  <p className="font-mono text-[10px] text-[#7a6b5a] mb-1">
                    {msg.sender?.fullName ?? "Unknown"}
                  </p>
                  <p className="text-xs">{msg.content}</p>
                </div>
              ))}
            </div>
            {contract.status !== "completed" && contract.status !== "cancelled" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-[#f0dfc0] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08]"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMsg}
                >
                  <Send size={14} />
                </Button>
              </div>
            )}
          </section>

          {/* Reviews */}
          {(contract.reviews?.length > 0 || contract.status === "completed") && (
            <section className="mb-6">
              <h2 className="font-contract text-sm font-bold text-[#1a0f08] uppercase tracking-wider border-b border-[#d4b896] pb-1 mb-3">
                Reviews
              </h2>

              {/* Review Form */}
              {showReviewForm && contract.status === "completed" && (
                <div className="mb-4 p-4 bg-[#f0dfc0] border border-[#d4b896] rounded-sm">
                  <p className="font-contract text-sm text-[#1a0f08] mb-3">
                    Rate your experience with {otherParty?.fullName ?? "the other party"}:
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="flex-1 accent-[#f5a623]"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={14} className="text-[#f5a623]" fill="currentColor" />
                      <span className="font-contract font-bold text-lg text-[#1a0f08]">
                        {rating}
                      </span>
                      <span className="font-mono text-xs text-[#8a7050]">/10</span>
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What went well? (optional)"
                    rows={3}
                    className="w-full px-3 py-2 bg-[#f5e6c8] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08] mb-3 resize-none"
                  />
                  <textarea
                    value={privateFeedback}
                    onChange={(e) => setPrivateFeedback(e.target.value)}
                    placeholder="Private feedback — only visible to moderators (optional)"
                    rows={2}
                    className="w-full px-3 py-2 bg-[#f5e6c8] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08] mb-3 resize-none"
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
                        setPrivateFeedback("");
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
                </div>
              )}

              {/* Leave Review Button */}
              {!showReviewForm &&
                contract.status === "completed" &&
                !contract.reviews?.some((r) => r.giverId === myId) && (
                  <Button
                    className="w-full mb-4"
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

              {/* Existing Reviews */}
              {contract.reviews?.length > 0 && (
                <div className="space-y-2">
                  {contract.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 bg-[#f0dfc0] border border-[#d4b896] rounded-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={12} className="text-[#f5a623]" fill="currentColor" />
                        <span className="font-contract font-bold text-sm">{review.rating}</span>
                        <span className="font-mono text-[10px] text-[#8a7050]">/10</span>
                        <span className="font-mono text-[10px] text-[#8a7050] ml-auto">
                          {review.giverId === myId ? "You" : "Them"}
                        </span>
                      </div>
                      <p className="text-xs text-[#2c1810]">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Cancellation Status */}
          {contract.status === "cancelled" && (
            <div className="mb-6 p-4 rounded-md bg-[#ff5252]/10 border border-[#ff5252]/30 text-center">
              <XCircle size={24} className="text-[#c41e1e] mx-auto mb-2" />
              <p className="font-contract text-sm text-[#c41e1e]">
                This contract has been cancelled.
              </p>
              {contract.cancelReason && (
                <p className="font-mono text-xs text-[#8a7050] mt-1">
                  Reason: {contract.cancelReason}
                </p>
              )}
            </div>
          )}
          {contract.cancelEscalatedAt && (
            <div className="mb-6 p-4 rounded-md bg-[#ffb300]/10 border border-[#ffb300]/30 text-center">
              <ShieldAlert size={24} className="text-[#8a6d0b] mx-auto mb-2" />
              <p className="font-contract text-sm text-[#8a6d0b]">
                Cancellation escalated to admin.
              </p>
              <p className="font-mono text-xs text-[#8a7050] mt-1">Awaiting admin review.</p>
            </div>
          )}
          {contract.cancelRequestedById &&
            !contract.cancelResponse &&
            contract.status !== "cancelled" &&
            !contract.cancelEscalatedAt && (
              <div className="mb-6 p-4 rounded-md bg-[#ffb300]/10 border border-[#ffb300]/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-[#8a6d0b]" />
                  <p className="font-contract text-sm text-[#8a6d0b]">Cancellation Requested</p>
                </div>
                <p className="font-mono text-xs text-[#5a4a3a] mb-1">
                  By:{" "}
                  {contract.cancelRequestedById === myId
                    ? "You"
                    : (otherParty?.fullName ?? "Other party")}
                </p>
                {contract.cancelReason && (
                  <p className="font-mono text-xs text-[#5a4a3a]">
                    Reason: {contract.cancelReason}
                  </p>
                )}
                {contract.cancelRequestedById !== myId && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      tap("light");
                      setShowRespondForm(true);
                    }}
                    haptic={false}
                  >
                    Respond to Request
                  </Button>
                )}
              </div>
            )}
          {contract.cancelResponse &&
            contract.status !== "cancelled" &&
            !contract.cancelEscalatedAt && (
              <div
                className={`mb-6 p-4 rounded-md text-center ${
                  contract.cancelResponse === "agreed"
                    ? "bg-[#00e676]/10 border border-[#00e676]/30"
                    : "bg-[#ff5252]/10 border border-[#ff5252]/30"
                }`}
              >
                <p
                  className={`font-mono text-xs ${
                    contract.cancelResponse === "agreed" ? "text-[#2e7d32]" : "text-[#c41e1e]"
                  }`}
                >
                  {contract.cancelResponse === "agreed"
                    ? "✓ Cancellation agreed by both parties."
                    : "✗ Cancellation declined."}
                </p>
                {contract.cancelResponseAt && (
                  <p className="font-mono text-[10px] text-[#8a7050] mt-1">
                    {new Date(contract.cancelResponseAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

          {/* Error */}
          {actionError && (
            <div className="mb-4 p-3 rounded-md bg-[#ff5252]/10 border border-[#ff5252]/30">
              <p className="font-mono text-xs text-[#c41e1e]">{actionError}</p>
            </div>
          )}

          {/* Sign Form */}
          {showSignForm && canSign && !mySignedAt && (
            <div className="mb-6 p-4 bg-[#f0dfc0] border border-[#d4b896] rounded-sm">
              <p className="font-contract text-sm text-[#1a0f08] mb-3">
                Type your full name to sign this contract:
              </p>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={myFullName || "Your full name"}
                className="w-full px-3 py-2 bg-[#f5e6c8] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08] mb-2"
              />
              {signature.trim() && !signatureValid && (
                <p className="font-mono text-[10px] text-[#c41e1e] mb-2">
                  Signature must match your full name exactly.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    tap("light");
                    setShowSignForm(false);
                    setSignature("");
                  }}
                  haptic={false}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSign}
                  disabled={!signatureValid || signing}
                  haptic={false}
                >
                  {signing ? "Signing..." : "Sign Contract"}
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Form */}
          {showCancelForm && contract.status !== "cancelled" && (
            <div className="mb-6 p-4 bg-[#f0dfc0] border border-[#d4b896] rounded-sm">
              <p className="font-contract text-sm text-[#1a0f08] mb-3">
                {canSign ? "Cancel this contract:" : "Request contract cancellation:"}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2 bg-[#f5e6c8] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08] mb-3 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    tap("light");
                    setShowCancelForm(false);
                    setCancelReason("");
                  }}
                  haptic={false}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-[#c41e1e] hover:bg-[#a31818]"
                  onClick={canSign ? handleCancel : handleRequestCancel}
                  disabled={(!canSign && !cancelReason.trim()) || cancelling || requestingCancel}
                  haptic={false}
                >
                  {cancelling || requestingCancel
                    ? "Processing..."
                    : canSign
                      ? "Cancel Contract"
                      : "Request Cancel"}
                </Button>
              </div>
            </div>
          )}

          {/* Respond to Cancel Form */}
          {showRespondForm && contract.cancelRequestedById && !contract.cancelResponse && (
            <div className="mb-6 p-4 bg-[#f0dfc0] border border-[#d4b896] rounded-sm">
              <p className="font-contract text-sm text-[#1a0f08] mb-3">
                Respond to cancellation request:
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setRespondAgree(true)}
                  className={`flex-1 py-2 rounded-sm font-mono text-xs border transition-colors ${
                    respondAgree === true
                      ? "bg-[#00e676]/20 border-[#00e676] text-[#2e7d32]"
                      : "bg-[#f5e6c8] border-[#d4b896] text-[#8a7050]"
                  }`}
                >
                  ✓ Agree to Cancel
                </button>
                <button
                  onClick={() => setRespondAgree(false)}
                  className={`flex-1 py-2 rounded-sm font-mono text-xs border transition-colors ${
                    respondAgree === false
                      ? "bg-[#ff5252]/20 border-[#ff5252] text-[#c41e1e]"
                      : "bg-[#f5e6c8] border-[#d4b896] text-[#8a7050]"
                  }`}
                >
                  ✗ Decline
                </button>
              </div>
              {respondAgree === false && (
                <>
                  <textarea
                    value={respondText}
                    onChange={(e) => setRespondText(e.target.value)}
                    placeholder="Your response (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-[#f5e6c8] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08] mb-3 resize-none"
                  />
                  <Button
                    size="sm"
                    className="w-full mb-2 bg-[#8a6d0b] hover:bg-[#6b5408]"
                    onClick={handleEscalate}
                    disabled={escalatingCancel}
                  >
                    <ShieldAlert size={14} className="mr-1" />
                    {escalatingCancel ? "Escalating..." : "Escalate to Admin"}
                  </Button>
                </>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    tap("light");
                    setShowRespondForm(false);
                    setRespondAgree(null);
                    setRespondText("");
                  }}
                  haptic={false}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleRespondCancel}
                  disabled={respondAgree === null || respondingCancel}
                  haptic={false}
                >
                  {respondingCancel ? "Submitting..." : "Submit Response"}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!showSignForm && !showCancelForm && !showRespondForm && (
            <div className="flex flex-wrap gap-2">
              {/* Terms Negotiation */}
              {(contract.status === "draft" || contract.status === "pending_terms") &&
                !termsLocked && (
                  <div className="w-full space-y-3">
                    {/* Terms editing */}
                    {!iSubmitted && (
                      <div className="p-3 rounded-md bg-[#f0dfc0] border border-[#d4b896]">
                        <p className="font-contract text-sm text-[#1a0f08] mb-2">Your Terms</p>
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useMessageTerms}
                            onChange={(e) => setUseMessageTerms(e.target.checked)}
                            className="accent-[#f5a623]"
                          />
                          <span className="font-mono text-[10px] text-[#8a7050]">
                            Use message thread as terms
                          </span>
                        </label>
                        {!useMessageTerms && (
                          <textarea
                            value={myTerms}
                            onChange={(e) => setMyTerms(e.target.value)}
                            placeholder="Describe your terms, deliverables, timeline..."
                            rows={4}
                            className="w-full px-3 py-2 bg-[#f5e6c8] border border-[#d4b896] text-[#2c1810] font-contract text-sm placeholder:text-[#8a7050] rounded-sm focus:outline-none focus:border-[#1a0f08] mb-2 resize-none"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={handleSaveTerms}
                            disabled={updatingContract || (!useMessageTerms && !myTerms.trim())}
                            haptic={false}
                          >
                            Save Terms
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={handleSubmitTerms}
                            disabled={updatingContract || (!useMessageTerms && !myTerms.trim())}
                            haptic={false}
                          >
                            Submit Terms
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Both parties' terms display */}
                    <div className="p-3 rounded-md bg-[#f0dfc0] border border-[#d4b896]">
                      <p className="font-contract text-sm text-[#1a0f08] mb-2">Terms Overview</p>
                      <div className="space-y-2">
                        <div className="p-2 rounded-sm bg-[#f5e6c8] border border-[#d4b896]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] text-[#8a7050]">
                              {contract.partyA?.fullName ?? "Party A"}
                            </span>
                            {aSubmitted && (
                              <span className="text-[10px] text-[#2e7d32]">✓ Submitted</span>
                            )}
                          </div>
                          <p className="font-contract text-xs text-[#2c1810]">
                            {contract.partyAUseMessageTerms
                              ? "(Using message thread as terms)"
                              : contract.partyATerms || "(No terms set)"}
                          </p>
                        </div>
                        <div className="p-2 rounded-sm bg-[#f5e6c8] border border-[#d4b896]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] text-[#8a7050]">
                              {contract.partyB?.fullName ?? "Party B"}
                            </span>
                            {bSubmitted && (
                              <span className="text-[10px] text-[#2e7d32]">✓ Submitted</span>
                            )}
                          </div>
                          <p className="font-contract text-xs text-[#2c1810]">
                            {contract.partyBUseMessageTerms
                              ? "(Using message thread as terms)"
                              : contract.partyBTerms || "(No terms set)"}
                          </p>
                        </div>
                      </div>

                      {/* Agreement status */}
                      {bothSubmitted && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-sm bg-[#f5e6c8] border border-[#d4b896]">
                            <span className="font-mono text-[10px] text-[#8a7050]">
                              {contract.partyA?.fullName ?? "Party A"}
                            </span>
                            {aAgreed ? (
                              <span className="text-[10px] text-[#2e7d32]">✓ Agreed</span>
                            ) : (
                              <span className="text-[10px] text-[#8a7050]">Pending</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-sm bg-[#f5e6c8] border border-[#d4b896]">
                            <span className="font-mono text-[10px] text-[#8a7050]">
                              {contract.partyB?.fullName ?? "Party B"}
                            </span>
                            {bAgreed ? (
                              <span className="text-[10px] text-[#2e7d32]">✓ Agreed</span>
                            ) : (
                              <span className="text-[10px] text-[#8a7050]">Pending</span>
                            )}
                          </div>
                          {!iAgreed && bothSubmitted && (
                            <Button
                              className="w-full"
                              onClick={handleAgree}
                              disabled={updatingContract}
                              haptic={false}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              {updatingContract ? "Agreeing..." : "Agree to Terms"}
                            </Button>
                          )}
                          {iAgreed && !termsLocked && (
                            <p className="font-mono text-[10px] text-[#2e7d32] text-center">
                              ✓ You agreed. Waiting for the other party.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              {canSign && !mySignedAt && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    tap("medium");
                    setShowSignForm(true);
                  }}
                  haptic={false}
                >
                  <FileText size={16} />
                  Sign Contract
                </Button>
              )}
              {mySignedAt && !otherSignedAt && termsLocked && (
                <div className="w-full space-y-2">
                  <div className="p-3 rounded-md bg-[#00e676]/10 border border-[#00e676]/30 text-center">
                    <p className="font-mono text-xs text-[#2e7d32]">
                      ✓ You signed. Waiting for {otherParty?.fullName ?? "other party"}.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleRemind}
                    disabled={reminding}
                  >
                    <Bell size={14} className="mr-1" />
                    {reminding ? "Sending..." : "Remind to Sign"}
                  </Button>
                </div>
              )}
              {canComplete && !iMarkedComplete && (
                <Button
                  variant="secondary"
                  className="flex-1 border-[var(--emerald)] text-[var(--emerald)]"
                  onClick={handleComplete}
                  disabled={completing}
                >
                  <CheckCircle size={16} />
                  Mark Complete
                </Button>
              )}
              {canComplete && iMarkedComplete && !otherMarkedComplete && (
                <div className="w-full p-3 rounded-md bg-[var(--mercury)]/10 border border-[var(--mercury)]/30 text-center">
                  <p className="font-mono text-xs text-[var(--mercury)]">
                    ✓ You marked complete. Waiting for {otherParty?.fullName ?? "other party"}.
                  </p>
                </div>
              )}
              {contract.status === "completed" && (
                <div className="w-full p-3 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/30 text-center">
                  <p className="font-mono text-xs text-[var(--sun)]">🎉 Contract completed!</p>
                </div>
              )}
              {/* Cancel button */}
              {contract.status !== "cancelled" &&
                contract.status !== "completed" &&
                !contract.cancelRequestedById && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#c41e1e]/50 text-[#c41e1e] hover:bg-[#c41e1e]/10"
                    onClick={() => {
                      tap("light");
                      setShowCancelForm(true);
                    }}
                  >
                    <XCircle size={16} />
                    {termsLocked ? "Request Cancel" : "Cancel"}
                  </Button>
                )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  hapticImpact("light");
                  if (otherParty?.id) {
                    navigate(`/chat/dm/${otherParty.id}`);
                  } else {
                    navigate("/chat");
                  }
                }}
              >
                <MessageCircle size={16} />
                Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-[#00e676]/10", text: "text-[#2e7d32]", label: "Active" },
    completed: { bg: "bg-[#f5a623]/10", text: "text-[#8a6d0b]", label: "Completed" },
    cancelled: { bg: "bg-[#ff5252]/10", text: "text-[#c41e1e]", label: "Cancelled" },
    draft: { bg: "bg-[#8a7050]/10", text: "text-[#5a4a3a]", label: "Draft" },
    pending_terms: { bg: "bg-[#ffb300]/10", text: "text-[#8a6d0b]", label: "Pending Terms" },
    pending_completion: {
      bg: "bg-[#00e5ff]/10",
      text: "text-[#006064]",
      label: "Pending Completion",
    },
  };
  const s = map[status] ?? map.draft;

  return (
    <span
      className={`px-3 py-1 rounded-sm ${s.bg} ${s.text} font-mono text-[10px] uppercase tracking-wider border border-current`}
    >
      {s.label}
    </span>
  );
}

function PartyBlock({
  label,
  name,
  signed,
  isMe,
}: {
  label: string;
  name: string;
  signed: boolean;
  isMe: boolean;
}) {
  return (
    <div className="p-3 bg-[#f0dfc0] border border-[#d4b896] rounded-sm">
      <p className="font-mono text-[8px] text-[#8a7050] uppercase tracking-wider mb-1">
        {label} {isMe && "(you)"}
      </p>
      <p className="font-contract text-sm font-semibold text-[#1a0f08]">{name}</p>
      <p className={`font-mono text-[10px] mt-1 ${signed ? "text-[#2e7d32]" : "text-[#8a7050]"}`}>
        {signed ? "✓ Signed" : "Pending signature"}
      </p>
    </div>
  );
}

function SignatureLine({ name, signed, date }: { name: string; signed: boolean; date?: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] text-[#8a7050] uppercase tracking-wider mb-2">{name}</p>
      <div className="border-b border-[#1a0f08] pb-2 mb-1">
        {signed ? (
          <p className="font-contract text-sm italic text-[#1a0f08]">{name}</p>
        ) : (
          <p className="text-sm text-[#8a7050]">____________________</p>
        )}
      </div>
      <p className="font-mono text-[8px] text-[#8a7050]">
        {signed && date ? new Date(date).toLocaleDateString() : "Date: ___________"}
      </p>
    </div>
  );
}

function AgreementRow({
  name,
  done,
  label,
}: {
  name: string | null;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#d4b896]/50">
      <span className="text-xs text-[#2c1810]">{name || "—"}</span>
      {done ? (
        <span className="text-[10px] font-mono text-[#2e7d32] flex items-center gap-1">
          <CheckCircle size={10} />
          {label}
        </span>
      ) : (
        <span className="text-[10px] font-mono text-[#8a7050]">Waiting...</span>
      )}
    </div>
  );
}
