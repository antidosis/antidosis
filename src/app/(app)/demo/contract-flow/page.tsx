"use client";

import { useState, useEffect } from "react";

import { EB_Garamond } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Send,
  Check,
  Shield,
  FileText,
  Lock,
  Unlock,
  Info,
  MessageSquare,
  Printer,
  Star,
  MapPin,
  Briefcase,
  User,
  ArrowRightLeft,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-contract",
  display: "swap",
});

/* ─── Mock Data ─── */
const MOCK_NEED = {
  id: "demo-need-001",
  title: "Garden Landscaping — Front Yard Refresh",
  description:
    "Looking for someone to help refresh my front garden. Tasks include weeding, mulching, planting native shrubs, and laying a small stone path (about 3m). I have all tools but you'll need to bring your own gloves.\n\nIdeally done over a weekend. The garden is roughly 8x5m. Happy to discuss specifics.",
  offerType: "service" as const,
  offerDescription: "Professional electrical work — up to 2 hours of labour",
  offerValue: 280,
  locationName: "Terrigal, NSW",
  deadline: "2025-06-15",
  timeRange: "1-2 days",
  images: [],
  offerImages: [],
  requiredSkills: [
    { id: "1", name: "gardening" },
    { id: "2", name: "landscaping" },
  ],
};

const PARTY_A = {
  id: "party-a",
  fullName: "Sarah Chen",
  avatarUrl: null,
  bio: "Homeowner in Terrigal. Love native gardens and sustainable design.",
  ratingAvg: 4.8,
  ratingCount: 12,
  locationName: "Terrigal, NSW",
  isVerified: true,
  skills: [
    { id: "s1", name: "project management" },
    { id: "s2", name: "design" },
  ],
  jobsCompleted: 5,
};

const PARTY_B = {
  id: "party-b",
  fullName: "Marcus Okafor",
  avatarUrl: null,
  bio: "Landscape gardener with 8 years experience. Specialise in native Australian plants.",
  ratingAvg: 4.9,
  ratingCount: 34,
  locationName: "Woy Woy, NSW",
  isVerified: true,
  skills: [
    { id: "s3", name: "gardening" },
    { id: "s4", name: "landscaping" },
    { id: "s5", name: "stone work" },
  ],
  jobsCompleted: 48,
};

const PARTY_C = {
  id: "party-c",
  fullName: "James O'Brien",
  avatarUrl: null,
  bio: "Qualified horticulturist and irrigation specialist. 5 years transforming coastal gardens.",
  ratingAvg: 4.7,
  ratingCount: 19,
  locationName: "Macmasters Beach, NSW",
  isVerified: true,
  skills: [
    { id: "s6", name: "gardening" },
    { id: "s7", name: "irrigation" },
    { id: "s8", name: "horticulture" },
  ],
  jobsCompleted: 31,
};

const PARTIES: Record<string, typeof PARTY_A> = {
  [PARTY_A.id]: PARTY_A,
  [PARTY_B.id]: PARTY_B,
  [PARTY_C.id]: PARTY_C,
};

/* ─── Types ─── */
type Acceptance = {
  id: string;
  userId: string;
  message: string;
  status: "pending" | "accepted" | "declined" | "completed";
  posterMarkedComplete: boolean;
  fulfillerMarkedComplete: boolean;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  acceptanceId: string | null;
};

type DemoReview = {
  giverId: string;
  receiverId: string;
  rating: number;
  comment: string;
  privateFeedback: string;
};

type DemoContract = {
  status: string;
  partyATerms: string;
  partyBTerms: string;
  partyAUseMessageTerms: boolean;
  partyBUseMessageTerms: boolean;
  partyASubmittedAt: string | null;
  partyBSubmittedAt: string | null;
  partyAAgreedAt: string | null;
  partyBAgreedAt: string | null;
  termsLockedAt: string | null;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  partyASignature: string | null;
  partyBSignature: string | null;
  aMarkedComplete: boolean;
  bMarkedComplete: boolean;
  completedAt: string | null;
  reviews: DemoReview[];
  cancelRequestedById: string | null;
  cancelRequestedAt: string | null;
  cancelResponse: "agreed" | "declined" | null;
  cancelResponseAt: string | null;
  cancelEscalatedAt: string | null;
  cancelReason: string | null;
};

function defaultContract(): DemoContract {
  return {
    status: "draft",
    partyATerms: "",
    partyBTerms: "",
    partyAUseMessageTerms: false,
    partyBUseMessageTerms: false,
    partyASubmittedAt: null,
    partyBSubmittedAt: null,
    partyAAgreedAt: null,
    partyBAgreedAt: null,
    termsLockedAt: null,
    partyASignedAt: null,
    partyBSignedAt: null,
    partyASignature: null,
    partyBSignature: null,
    aMarkedComplete: false,
    bMarkedComplete: false,
    completedAt: null,
    reviews: [],
    cancelRequestedById: null,
    cancelRequestedAt: null,
    cancelResponse: null,
    cancelResponseAt: null,
    cancelEscalatedAt: null,
    cancelReason: null,
  };
}

/* ─── Sub-components ─── */
function PartySection({
  party,
  label,
  isMe,
}: {
  party: typeof PARTY_A;
  label: string;
  isMe: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="contract-label">{label}</span>
        {isMe && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a7a60]">
            you
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Avatar src={party.avatarUrl} name={party.fullName} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#1a0f08]">{party.fullName}</span>
            {party.isVerified && <Shield className="h-3.5 w-3.5 text-emerald-600" />}
          </div>
          <div className="text-sm text-[#5a4a3a] mt-0.5">
            {party.ratingCount > 0 && <span>{party.ratingAvg.toFixed(1)} ★</span>}
            {party.locationName && <span className="ml-2">{party.locationName}</span>}
          </div>
        </div>
      </div>
      {party.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {party.skills.map((s) => (
            <span
              key={s.id}
              className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#c4b496] text-[#5a4a3a]"
            >
              {s.name}
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
        <span className="contract-body font-semibold">{name || "anonymous"}</span>
        {signed ? (
          <Badge variant="success" className="gap-1">
            <Check className="h-3 w-3" /> signed
          </Badge>
        ) : (
          <span className="text-xs text-[#8a7a60] uppercase tracking-wide">pending</span>
        )}
      </div>
      {signed && signedAt && (
        <p className="text-xs text-[#5a4a3a] mb-2">
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
        <p
          className="text-sm text-[#2c1810] mt-1 font-serif italic"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {signatureText}
        </p>
      ) : (
        <p className="text-[10px] text-[#8a7a60] mt-1 uppercase tracking-wider">Signature</p>
      )}
    </div>
  );
}

export default function ContractFlowDemoPage() {
  const router = useRouter();

  /* ─── View mode ─── */
  const [currentUser, setCurrentUser] = useState<"A" | "B" | "C">("A");
  const isPartyA = currentUser === "A";
  const isPartyB = currentUser === "B";
  const isPartyC = currentUser === "C";
  const currentParty = isPartyA ? PARTY_A : isPartyB ? PARTY_B : PARTY_C;
  const profileId = currentParty.id;

  /* ─── Post settings ─── */
  const [requiresContract, setRequiresContract] = useState(false);

  /* ─── Flow state ─── */
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [interestMessage, setInterestMessage] = useState("");
  const [contractFormed, setContractFormed] = useState(false);
  const [selectedAcceptanceId, setSelectedAcceptanceId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  /* ─── Per-acceptance contract state ─── */
  const [contracts, setContracts] = useState<Record<string, DemoContract>>({});

  /* ─── Free-form reviews (not tied to contracts) ─── */
  const [freeFormReviews, setFreeFormReviews] = useState<Record<string, DemoReview[]>>({});

  /* ─── Messages ─── */
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");

  /* ─── Per-user contract view state ─── */
  const [userContractView, setUserContractView] = useState<Record<string, boolean>>({});

  /* ─── Local term editing ─── */
  const [myTermsDraft, setMyTermsDraft] = useState("");
  const [useMessageTermsDraft, setUseMessageTermsDraft] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureInput, setSignatureInput] = useState("");
  const [agreedToTermsCheck, setAgreedToTermsCheck] = useState(false);

  /* ─── Review form state ─── */
  const [rating, setRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const [privateFeedbackDraft, setPrivateFeedbackDraft] = useState("");

  /* ─── Free-form poster inline review ─── */
  const [posterReviewAccId, setPosterReviewAccId] = useState<string | null>(null);

  /* ─── Cancel & Complete modals ─── */
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showRequestCancelModal, setShowRequestCancelModal] = useState(false);
  const [showRespondCancelModal, setShowRespondCancelModal] = useState(false);
  const [cancelReasonDraft, setCancelReasonDraft] = useState("");

  /* ─── Persistence ─── */
  const STORAGE_KEY = "antidosis-demo-contract-flow";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (typeof parsed.requiresContract === "boolean")
          setRequiresContract(parsed.requiresContract);
        if (parsed.acceptances) setAcceptances(parsed.acceptances);
        if (typeof parsed.contractFormed === "boolean") setContractFormed(parsed.contractFormed);
        if (parsed.selectedAcceptanceId !== undefined)
          setSelectedAcceptanceId(parsed.selectedAcceptanceId);
        if (parsed.activeThread !== undefined) setActiveThread(parsed.activeThread);
        if (parsed.contracts) {
          // Ensure loaded contracts have all required fields (defensive for schema changes)
          const normalizedContracts: Record<string, DemoContract> = {};
          for (const [key, val] of Object.entries(
            parsed.contracts as Record<string, DemoContract>
          )) {
            normalizedContracts[key] = { ...defaultContract(), ...val };
          }
          setContracts(normalizedContracts);
        }
        if (parsed.userContractView) setUserContractView(parsed.userContractView);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.freeFormReviews) setFreeFormReviews(parsed.freeFormReviews);
        // Defensive: ensure loaded acceptances have new fields
        if (parsed.acceptances) {
          setAcceptances(
            parsed.acceptances.map((a: Acceptance) => ({
              ...a,
              posterMarkedComplete: a.posterMarkedComplete ?? false,
              fulfillerMarkedComplete: a.fulfillerMarkedComplete ?? false,
            }))
          );
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Sync draft state when switching users so each party sees their own terms/checkbox
  useEffect(() => {
    const c = getContract(selectedAcceptanceId);
    setMyTermsDraft(isPartyA ? c.partyATerms : c.partyBTerms);
    setUseMessageTermsDraft(isPartyA ? c.partyAUseMessageTerms : c.partyBUseMessageTerms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedAcceptanceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = {
      currentUser,
      requiresContract,
      acceptances,
      contractFormed,
      selectedAcceptanceId,
      activeThread,
      contracts,
      messages,
      userContractView,
      freeFormReviews,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    currentUser,
    requiresContract,
    acceptances,
    contractFormed,
    selectedAcceptanceId,
    activeThread,
    contracts,
    messages,
    freeFormReviews,
  ]);

  /* ─── Helpers ─── */
  function getContract(id: string | null): DemoContract {
    if (!id) return defaultContract();
    return contracts[id] || defaultContract();
  }

  function updateContract(id: string | null, updates: Partial<DemoContract>) {
    if (!id) return;
    setContracts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || defaultContract()), ...updates },
    }));
  }

  /* ─── Derived ─── */
  const interestAccepted = acceptances.some((a) => a.status === "accepted");
  const selectedAcceptance = acceptances.find((a) => a.id === selectedAcceptanceId) || null;
  const contractPartyB = selectedAcceptance ? PARTIES[selectedAcceptance.userId] : null;
  const otherParty = isPartyA ? contractPartyB || PARTY_B : PARTY_A;
  const myAcceptance = acceptances.find((a) => a.userId === profileId);
  const canViewContract =
    contractFormed &&
    userContractView[profileId] &&
    (isPartyA || selectedAcceptance?.userId === profileId);
  const iAmDeclined = !isPartyA && myAcceptance?.status === "declined";

  const currentContract = getContract(selectedAcceptanceId);

  /* ─── Cancellation derived ─── */
  const cancelRequested = !!currentContract.cancelRequestedAt;
  const isCancelRequester = currentContract.cancelRequestedById === profileId;
  const cancelPending = cancelRequested && !currentContract.cancelResponse;
  const cancelDeclined = currentContract.cancelResponse === "declined";
  const cancelAgreed = currentContract.cancelResponse === "agreed";
  const cancelEscalated = !!currentContract.cancelEscalatedAt;

  /* ─── Reset ─── */
  function resetFlow() {
    setAcceptances([]);
    setInterestMessage("");
    setContractFormed(false);
    setSelectedAcceptanceId(null);
    setActiveThread(null);
    setContracts({});
    setMessages([]);
    setMyTermsDraft("");
    setUseMessageTermsDraft(false);
    setRating(10);
    setReviewComment("");
    setPrivateFeedbackDraft("");
    setShowCancelConfirm(false);
    setShowCompleteConfirm(false);
    setShowRequestCancelModal(false);
    setShowRespondCancelModal(false);
    setCancelReasonDraft("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /* ─── Actions ─── */
  function expressInterest() {
    const newAcceptance: Acceptance = {
      id: `acc-${Date.now()}`,
      userId: isPartyB ? PARTY_B.id : PARTY_C.id,
      message: interestMessage,
      status: "pending",
      posterMarkedComplete: false,
      fulfillerMarkedComplete: false,
    };
    setAcceptances((prev) => [...prev, newAcceptance]);
    setInterestMessage("");
  }

  function acceptInterest(acceptanceId: string) {
    setAcceptances((prev) =>
      prev.map((a) => (a.id === acceptanceId ? { ...a, status: "accepted" } : a))
    );
    if (!requiresContract) {
      setAcceptances((prev) =>
        prev.map((a) =>
          a.id === acceptanceId
            ? { ...a, status: "accepted" }
            : a.status === "pending"
              ? { ...a, status: "declined" }
              : a
        )
      );
      setSelectedAcceptanceId(acceptanceId);
      setActiveThread(acceptanceId);
    }
  }

  function declineInterest(acceptanceId: string) {
    setAcceptances((prev) =>
      prev.map((a) => (a.id === acceptanceId ? { ...a, status: "declined" } : a))
    );
  }

  function formContract(acceptanceId: string) {
    setContractFormed(true);
    setSelectedAcceptanceId(acceptanceId);
    setActiveThread(acceptanceId);
    if (!contracts[acceptanceId]) {
      setContracts((prev) => ({ ...prev, [acceptanceId]: defaultContract() }));
    }
    const acc = acceptances.find((a) => a.id === acceptanceId);
    setUserContractView((prev) => ({
      ...prev,
      [PARTY_A.id]: true,
      ...(acc ? { [acc.userId]: true } : {}),
    }));
  }

  function saveTerms() {
    if (isPartyA) {
      updateContract(selectedAcceptanceId, {
        partyATerms: myTermsDraft,
        partyAUseMessageTerms: useMessageTermsDraft,
      });
    } else {
      updateContract(selectedAcceptanceId, {
        partyBTerms: myTermsDraft,
        partyBUseMessageTerms: useMessageTermsDraft,
      });
    }
  }

  function submitTerms() {
    const now = new Date().toISOString();
    const c = getContract(selectedAcceptanceId);
    if (isPartyA) {
      updateContract(selectedAcceptanceId, {
        partyASubmittedAt: now,
        partyATerms: myTermsDraft,
        partyAUseMessageTerms: useMessageTermsDraft,
        partyAAgreedAt: null,
        partyBAgreedAt: null,
        reviews: c.reviews ?? [],
      });
    } else {
      updateContract(selectedAcceptanceId, {
        partyBSubmittedAt: now,
        partyBTerms: myTermsDraft,
        partyBUseMessageTerms: useMessageTermsDraft,
        partyAAgreedAt: null,
        partyBAgreedAt: null,
        reviews: c.reviews ?? [],
      });
    }
  }

  function agree() {
    const c = getContract(selectedAcceptanceId);
    if (!c.partyASubmittedAt || !c.partyBSubmittedAt) return;
    if (isPartyA) {
      updateContract(selectedAcceptanceId, { partyAAgreedAt: new Date().toISOString() });
    } else {
      updateContract(selectedAcceptanceId, { partyBAgreedAt: new Date().toISOString() });
    }
  }

  function sign(signature: string) {
    const now = new Date().toISOString();
    const c = getContract(selectedAcceptanceId);
    const updates: Partial<DemoContract> = {};
    if (isPartyA) {
      updates.partyASignedAt = now;
      updates.partyASignature = signature;
    } else {
      updates.partyBSignedAt = now;
      updates.partyBSignature = signature;
    }
    const aSigned = isPartyA ? now : c.partyASignedAt;
    const bSigned = isPartyB ? now : c.partyBSignedAt;
    if (aSigned && bSigned) {
      updates.status = "active";
    }
    updateContract(selectedAcceptanceId, updates);
  }

  function markComplete() {
    if (isPartyA) {
      updateContract(selectedAcceptanceId, { aMarkedComplete: true });
    } else {
      updateContract(selectedAcceptanceId, { bMarkedComplete: true });
    }
  }

  function cancelContract() {
    if (!selectedAcceptanceId) return;
    updateContract(selectedAcceptanceId, { status: "cancelled" });
    setShowCancelConfirm(false);
  }

  function requestCancel(reason: string) {
    if (!selectedAcceptanceId) return;
    updateContract(selectedAcceptanceId, {
      cancelRequestedById: profileId,
      cancelRequestedAt: new Date().toISOString(),
      cancelResponse: null,
      cancelResponseAt: null,
      cancelEscalatedAt: null,
      cancelReason: reason || null,
    });
    setShowRequestCancelModal(false);
    setCancelReasonDraft("");
  }

  function respondCancel(agree: boolean) {
    if (!selectedAcceptanceId) return;
    if (agree) {
      updateContract(selectedAcceptanceId, {
        status: "cancelled",
        cancelResponse: "agreed",
        cancelResponseAt: new Date().toISOString(),
      });
    } else {
      updateContract(selectedAcceptanceId, {
        cancelResponse: "declined",
        cancelResponseAt: new Date().toISOString(),
      });
    }
    setShowRespondCancelModal(false);
  }

  function escalateCancel() {
    if (!selectedAcceptanceId) return;
    updateContract(selectedAcceptanceId, {
      cancelEscalatedAt: new Date().toISOString(),
    });
  }

  function withdrawCancelRequest() {
    if (!selectedAcceptanceId) return;
    updateContract(selectedAcceptanceId, {
      cancelRequestedById: null,
      cancelRequestedAt: null,
      cancelResponse: null,
      cancelResponseAt: null,
      cancelEscalatedAt: null,
      cancelReason: null,
    });
  }

  function submitReview() {
    if (!selectedAcceptanceId) return;
    const c = getContract(selectedAcceptanceId);
    const receiverId = isPartyA ? selectedAcceptance?.userId || PARTY_B.id : PARTY_A.id;
    const newReview: DemoReview = {
      giverId: profileId,
      receiverId,
      rating,
      comment: reviewComment,
      privateFeedback: privateFeedbackDraft,
    };
    updateContract(selectedAcceptanceId, { reviews: [...(c.reviews ?? []), newReview] });
    setReviewComment("");
    setPrivateFeedbackDraft("");
    setRating(10);
  }

  function markCompleteFreeForm(acceptanceId: string) {
    setAcceptances((prev) =>
      prev.map((a) => {
        if (a.id !== acceptanceId) return a;
        const isPoster = isPartyA;
        const updated = {
          ...a,
          posterMarkedComplete: isPoster ? true : a.posterMarkedComplete,
          fulfillerMarkedComplete: !isPoster ? true : a.fulfillerMarkedComplete,
        };
        if (updated.posterMarkedComplete && updated.fulfillerMarkedComplete) {
          return { ...updated, status: "completed" as const };
        }
        return updated;
      })
    );
  }

  function submitReviewFreeForm(acceptanceId: string) {
    const acc = acceptances.find((a) => a.id === acceptanceId);
    if (!acc) return;
    const receiverId = isPartyA ? acc.userId : PARTY_A.id;
    const newReview: DemoReview = {
      giverId: profileId,
      receiverId,
      rating,
      comment: reviewComment,
      privateFeedback: privateFeedbackDraft,
    };
    setFreeFormReviews((prev) => ({
      ...prev,
      [acceptanceId]: [...(prev[acceptanceId] ?? []), newReview],
    }));
    setReviewComment("");
    setPrivateFeedbackDraft("");
    setRating(10);
    setPosterReviewAccId(null);
  }

  // Lock terms when both parties have agreed
  useEffect(() => {
    if (!selectedAcceptanceId) return;
    const c = contracts[selectedAcceptanceId];
    if (!c) return;
    if (c.partyAAgreedAt && c.partyBAgreedAt && !c.termsLockedAt) {
      updateContract(selectedAcceptanceId, {
        termsLockedAt: new Date().toISOString(),
        status: "pending_terms",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, selectedAcceptanceId]);

  // Mark contract as completed when both parties have marked complete
  useEffect(() => {
    if (!selectedAcceptanceId) return;
    const c = contracts[selectedAcceptanceId];
    if (!c) return;
    if (c.aMarkedComplete && c.bMarkedComplete && c.status !== "completed") {
      updateContract(selectedAcceptanceId, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, selectedAcceptanceId]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    let acceptanceId: string | null = null;
    if (isPartyA) {
      acceptanceId = activeThread;
    } else {
      acceptanceId = myAcceptance?.id ?? null;
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        content: messageInput,
        createdAt: new Date().toISOString(),
        senderId: profileId,
        senderName: currentParty.fullName,
        acceptanceId,
      },
    ]);
    setMessageInput("");
  }

  /* ─── Derived contract values ─── */
  const termsLocked = !!currentContract.termsLockedAt;
  const bothSigned = !!currentContract.partyASignedAt && !!currentContract.partyBSignedAt;
  const iSigned = isPartyA ? !!currentContract.partyASignedAt : !!currentContract.partyBSignedAt;
  const iAgreed = isPartyA ? !!currentContract.partyAAgreedAt : !!currentContract.partyBAgreedAt;
  const aSubmitted = !!currentContract.partyASubmittedAt;
  const bSubmitted = !!currentContract.partyBSubmittedAt;
  const iSubmitted = isPartyA ? aSubmitted : bSubmitted;
  const bothSubmitted = aSubmitted && bSubmitted;
  const canEditTerms =
    !termsLocked &&
    !iSubmitted &&
    (currentContract.status === "draft" || currentContract.status === "pending_terms");
  const canReviewPhase = bothSubmitted && !termsLocked;
  const canSign =
    termsLocked &&
    !iSigned &&
    (currentContract.status === "draft" || currentContract.status === "pending_terms");
  const canComplete =
    currentContract.status === "active" || currentContract.status === "pending_completion";
  const iMarkedComplete = isPartyA
    ? currentContract.aMarkedComplete
    : currentContract.bMarkedComplete;
  const otherMarkedComplete = isPartyA
    ? currentContract.bMarkedComplete
    : currentContract.aMarkedComplete;
  const hasReviewed = (currentContract.reviews ?? []).some((r) => r.giverId === profileId);
  const otherReview = (currentContract.reviews ?? []).find((r) => r.receiverId === profileId);

  /* ─── Free-form derived values ─── */
  const freeFormAccepted = acceptances.find(
    (a) => a.status === "accepted" || a.status === "completed"
  );
  const freeFormCompleted = freeFormAccepted?.status === "completed";
  const iMarkedCompleteFreeForm = isPartyA
    ? (freeFormAccepted?.posterMarkedComplete ?? false)
    : (freeFormAccepted?.fulfillerMarkedComplete ?? false);
  const otherMarkedCompleteFreeForm = isPartyA
    ? (freeFormAccepted?.fulfillerMarkedComplete ?? false)
    : (freeFormAccepted?.posterMarkedComplete ?? false);
  const hasReviewedFreeForm = freeFormAccepted
    ? (freeFormReviews[freeFormAccepted.id] ?? []).some((r) => r.giverId === profileId)
    : false;

  const statusLabels: Record<string, string> = {
    draft: "draft",
    pending_terms: "pending signatures",
    active: "active",
    pending_completion: "pending completion",
    completed: "completed",
    cancelled: "cancelled",
  };

  /* ─── Message filtering ─── */
  const visibleMessages = messages.filter((msg) => {
    if (isPartyA) {
      if (activeThread === null) return msg.acceptanceId === null;
      return msg.acceptanceId === activeThread;
    }
    // Non-poster: see poster's public messages + their own messages only
    if (msg.acceptanceId === null) {
      return msg.senderId === PARTY_A.id || msg.senderId === profileId;
    }
    return msg.acceptanceId === myAcceptance?.id;
  });

  const contractMessages = messages.filter((msg) => {
    if (msg.acceptanceId === null) return true;
    return msg.acceptanceId === selectedAcceptanceId;
  });

  /* ─── Render ─── */
  return (
    <div className={`${ebGaramond.variable} min-h-screen bg-[#0a0806]`}>
      {/* Demo HUD */}
      <div className="bg-[#1a1714] border-b border-[#2a2420] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-[10px]">
              DEMO MODE
            </Badge>
            <span className="text-xs text-[#7a6b5a]">
              Test the contract flow without real users
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#7a6b5a] hidden sm:inline">Viewing as:</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                variant={isPartyA ? "default" : "secondary"}
                onClick={() => setCurrentUser("A")}
                className="h-7 text-xs justify-start sm:justify-center"
              >
                <User className="h-3 w-3 mr-1.5 shrink-0" />
                <span className="truncate">{PARTY_A.fullName}</span>
                <span className="sm:hidden ml-1">(P)</span>
                <span className="hidden sm:inline ml-1">(Poster)</span>
              </Button>
              <Button
                size="sm"
                variant={isPartyB ? "default" : "secondary"}
                onClick={() => setCurrentUser("B")}
                className="h-7 text-xs justify-start sm:justify-center"
              >
                <User className="h-3 w-3 mr-1.5 shrink-0" />
                <span className="truncate">{PARTY_B.fullName}</span>
                <span className="sm:hidden ml-1">(F)</span>
                <span className="hidden sm:inline ml-1">(Fulfiller)</span>
              </Button>
              <Button
                size="sm"
                variant={isPartyC ? "default" : "secondary"}
                onClick={() => setCurrentUser("C")}
                className="h-7 text-xs justify-start sm:justify-center"
              >
                <User className="h-3 w-3 mr-1.5 shrink-0" />
                <span className="truncate">{PARTY_C.fullName}</span>
                <span className="sm:hidden ml-1">(F)</span>
                <span className="hidden sm:inline ml-1">(Fulfiller)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Post Settings */}
        <div className="vessel p-5 print-hidden">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-medium text-[#e8d5a3]">Demo Settings</h2>
              <p className="text-xs text-[#7a6b5a]">Configure the post before testing</p>
            </div>
            <div className="flex items-center gap-3">
              {isPartyA && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresContract}
                    onChange={(e) => {
                      setRequiresContract(e.target.checked);
                      resetFlow();
                    }}
                    className="accent-[#f5a623]"
                  />
                  <span className="text-sm text-[#b8a078]">Require formal contract</span>
                </label>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={resetFlow}
                className="text-[#7a6b5a] h-7 text-xs"
              >
                Reset Flow
              </Button>
            </div>
          </div>
        </div>

        {/* ─── NEED POST VIEW ─── */}
        {!canViewContract && (
          <>
            <div className="py-2">
              <Link
                href="/"
                className="inline-flex items-center text-xs text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> browse needs
              </Link>
            </div>

            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">
                {MOCK_NEED.title}
              </h1>
              {interestAccepted && (
                <Badge variant="warning" className="mt-1.5 capitalize">
                  {requiresContract ? "negotiating" : "active"}
                </Badge>
              )}
              <Badge
                variant={requiresContract ? "quintessence" : "outline"}
                className="mt-1.5 text-[10px]"
              >
                {requiresContract ? "contract required" : "free form"}
              </Badge>
            </div>

            {/* Declined banner for non-selected fulfillers */}
            {iAmDeclined && (
              <div className="p-4 mb-6 rounded border bg-[#ff5252]/5 border-[#ff5252]/20">
                <p className="text-sm text-[#ff5252] font-medium">
                  You were not selected for this need
                </p>
                <p className="text-xs text-[#7a6b5a] mt-1">
                  The poster has chosen another fulfiller. Your acceptance has been declined.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {MOCK_NEED.requiredSkills.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded"
                >
                  {s.name}
                </span>
              ))}
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {MOCK_NEED.locationName}
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">
                {MOCK_NEED.description}
              </p>
            </div>

            <div className="vessel p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
                  offering in exchange
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-[#e8d5a3]">{MOCK_NEED.offerDescription}</p>
                <span className="text-xs text-[#b8a078]">
                  est. ${MOCK_NEED.offerValue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Poster profile */}
            <div className="vessel p-4 mb-6">
              <div className="flex items-center gap-3">
                <Avatar src={PARTY_A.avatarUrl} name={PARTY_A.fullName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-[#e8d5a3]">{PARTY_A.fullName}</span>
                    {PARTY_A.isVerified && <Shield className="h-4 w-4 text-[#00e676]" />}
                  </div>
                  <div className="text-xs text-[#7a6b5a] mt-0.5">
                    <span>{PARTY_A.ratingAvg.toFixed(1)} ★</span>
                    <span className="ml-2">{PARTY_A.locationName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfiller actions */}
            {!isPartyA && !myAcceptance && (
              <div className="vessel p-4 mb-6 print-hidden">
                <p className="text-xs text-[#7a6b5a] mb-3">
                  tell the poster why you are a good fit.
                </p>
                <div className="space-y-3">
                  <Textarea
                    placeholder="introduce yourself..."
                    value={interestMessage}
                    onChange={(e) => setInterestMessage(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={expressInterest}>
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                    Express Interest
                  </Button>
                </div>
              </div>
            )}

            {!isPartyA && myAcceptance?.status === "pending" && (
              <div className="p-3 rounded border bg-[#1a1714] border-[#2a2420] mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#7a6b5a]">your interest is pending review</span>
                </div>
                {myAcceptance.message && (
                  <div className="mt-2 bg-[#0f0c0a] p-2.5 rounded text-xs text-[#b8a078]">
                    <span className="text-[#7a6b5a] uppercase tracking-wider text-[9px]">
                      your intro:{" "}
                    </span>
                    {myAcceptance.message}
                  </div>
                )}
              </div>
            )}

            {!isPartyA && myAcceptance?.status === "accepted" && (
              <div className="p-3 rounded border bg-[#00e676]/5 border-[#00e676]/30 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00e676]" />
                  <p className="text-sm text-[#00e676]">
                    {requiresContract
                      ? "poster accepted — ready to form contract"
                      : myAcceptance.posterMarkedComplete && !myAcceptance.fulfillerMarkedComplete
                        ? "poster marked complete — waiting for you"
                        : !myAcceptance.posterMarkedComplete && myAcceptance.fulfillerMarkedComplete
                          ? "you marked complete — waiting for poster"
                          : "poster accepted — deal confirmed"}
                  </p>
                </div>
                {/* Free-form mark complete — non-poster */}
                {!requiresContract && (
                  <div className="mt-3 flex items-center gap-2">
                    {!myAcceptance.fulfillerMarkedComplete ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => myAcceptance && markCompleteFreeForm(myAcceptance.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark as complete
                      </Button>
                    ) : (
                      <span className="text-xs text-[#00e676]">you marked complete</span>
                    )}
                    {myAcceptance.posterMarkedComplete && (
                      <span className="text-xs text-[#00e676]">poster marked complete</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isPartyA && myAcceptance?.status === "completed" && (
              <div className="p-3 rounded border bg-[#00e676]/5 border-[#00e676]/30 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00e676]" />
                  <p className="text-sm text-[#00e676]">deal completed — thank you!</p>
                </div>
                {/* Free-form review — non-poster */}
                {!requiresContract && !hasReviewedFreeForm && (
                  <div className="mt-3">
                    <div className="bg-[#1a1714] border border-[#2a2420] p-3 rounded space-y-3">
                      <p className="text-xs text-[#e8d5a3] font-medium">Leave a review</p>
                      <div>
                        <label className="text-xs text-[#7a6b5a] block mb-1">Rating (1–10)</label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={rating}
                          onChange={(e) => setRating(parseInt(e.target.value))}
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
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <Textarea
                        placeholder="Private feedback (only visible to moderators)"
                        value={privateFeedbackDraft}
                        onChange={(e) => setPrivateFeedbackDraft(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => myAcceptance && submitReviewFreeForm(myAcceptance.id)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Submit Review
                      </Button>
                    </div>
                  </div>
                )}
                {!requiresContract && hasReviewedFreeForm && (
                  <p className="text-xs text-[#7a6b5a] mt-2">
                    You have already reviewed this deal.
                  </p>
                )}
              </div>
            )}

            {/* Poster prominent review banner — free-form completed */}
            {isPartyA && freeFormCompleted && !requiresContract && (
              <div className="p-4 rounded border bg-[#00e676]/5 border-[#00e676]/30 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-[#00e676]" />
                  <p className="text-sm text-[#00e676] font-medium">Deal completed</p>
                </div>
                <p className="text-xs text-[#7a6b5a] mb-3">
                  Leave a review to close this deal out and help build trust in the community.
                </p>
                {!(freeFormReviews[freeFormAccepted?.id ?? ""] ?? []).some(
                  (r) => r.giverId === PARTY_A.id
                ) &&
                  posterReviewAccId !== freeFormAccepted?.id && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs"
                      type="button"
                      onClick={() => {
                        if (freeFormAccepted) {
                          setPosterReviewAccId(freeFormAccepted.id);
                          setRating(10);
                          setReviewComment("");
                          setPrivateFeedbackDraft("");
                        }
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Leave a Review
                    </Button>
                  )}
                {freeFormAccepted && posterReviewAccId === freeFormAccepted.id && (
                  <div className="mt-3 bg-[#1a1714] border border-[#2a2420] p-3 rounded space-y-3">
                    <div>
                      <label className="text-xs text-[#7a6b5a] block mb-1">Rating (1–10)</label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value))}
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
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <Textarea
                      placeholder="Private feedback (only visible to moderators)"
                      value={privateFeedbackDraft}
                      onChange={(e) => setPrivateFeedbackDraft(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        type="button"
                        onClick={() => {
                          if (freeFormAccepted) {
                            submitReviewFreeForm(freeFormAccepted.id);
                            setPosterReviewAccId(null);
                          }
                        }}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Submit Review
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        type="button"
                        onClick={() => setPosterReviewAccId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {freeFormAccepted &&
                  (freeFormReviews[freeFormAccepted.id] ?? []).some(
                    (r) => r.giverId === PARTY_A.id
                  ) && (
                    <p className="text-xs text-[#7a6b5a] mt-2">
                      You have already reviewed this deal. Thank you!
                    </p>
                  )}
              </div>
            )}

            {/* Poster interested list */}
            {isPartyA && acceptances.filter((a) => a.status !== "declined").length > 0 && (
              <div className="mb-6 space-y-4">
                <h3 className="text-xs text-[#7a6b5a] uppercase tracking-wider">Interested</h3>
                {acceptances
                  .filter((a) => a.status !== "declined")
                  .map((acc) => {
                    const party = PARTIES[acc.userId];
                    if (!party) return null;
                    return (
                      <div key={acc.id} className="vessel p-4">
                        <div className="flex items-start gap-3">
                          <Link href={`/demo/profile/${party.id}`} className="shrink-0">
                            <Avatar src={party.avatarUrl} name={party.fullName} size="md" />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/demo/profile/${party.id}`}
                                  className="text-sm font-medium text-[#e8d5a3] hover:underline"
                                >
                                  {party.fullName}
                                </Link>
                                {party.isVerified && (
                                  <Shield className="h-3.5 w-3.5 text-[#00e676]" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {acc.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 text-xs px-2"
                                      onClick={() => acceptInterest(acc.id)}
                                    >
                                      <Check className="h-3 w-3 mr-1" /> Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs px-2 text-[#ff5252] hover:text-[#ff5252]"
                                      onClick={() => declineInterest(acc.id)}
                                    >
                                      <X className="h-3 w-3 mr-1" /> Decline
                                    </Button>
                                  </>
                                )}
                                {acc.status === "accepted" && requiresContract && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs px-2"
                                    onClick={() => formContract(acc.id)}
                                  >
                                    <FileText className="h-3 w-3 mr-1" /> Contract
                                  </Button>
                                )}
                                {acc.status === "accepted" && !requiresContract && (
                                  <div className="flex flex-col gap-1.5 items-end">
                                    <Badge variant="success" className="text-[10px]">
                                      Deal confirmed
                                    </Badge>
                                    <div className="flex items-center gap-1.5">
                                      {!acc.posterMarkedComplete ? (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          className="h-6 text-[10px] px-2"
                                          onClick={() => markCompleteFreeForm(acc.id)}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Mark complete
                                        </Button>
                                      ) : (
                                        <span className="text-[10px] text-[#00e676]">
                                          you marked complete
                                        </span>
                                      )}
                                      {acc.fulfillerMarkedComplete && (
                                        <span className="text-[10px] text-[#00e676]">
                                          fulfiller marked complete
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {acc.status === "completed" && !requiresContract && (
                                  <div className="flex flex-col gap-1.5 items-end">
                                    <Badge variant="success" className="text-[10px]">
                                      Deal completed
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#7a6b5a]">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-[#f5a623]" />{" "}
                                {party.ratingAvg.toFixed(1)} ({party.ratingCount})
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {party.jobsCompleted} jobs
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {party.locationName}
                              </span>
                            </div>
                            <p className="text-xs text-[#b8a078] mt-2 line-clamp-1">{party.bio}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {party.skills.slice(0, 4).map((s) => (
                                <span
                                  key={s.id}
                                  className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] rounded"
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                            {acc.message && (
                              <div className="mt-2 bg-[#0f0c0a] p-2.5 rounded text-xs text-[#b8a078]">
                                <span className="text-[#7a6b5a] uppercase tracking-wider text-[9px]">
                                  Message:{" "}
                                </span>
                                {acc.message}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Messages */}
            <div className="vessel p-4 print-hidden">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-3.5 w-3.5 text-[#7a6b5a]" />
                <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
                  {isPartyA && activeThread !== null
                    ? "private messages"
                    : myAcceptance
                      ? "messages"
                      : "public messages"}
                </span>
              </div>

              {/* Thread tabs for poster */}
              {isPartyA && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveThread(null)}
                    className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${activeThread === null ? "bg-[#f5a623] text-black" : "bg-[#1a1714] text-[#7a6b5a] border border-[#2a2420] hover:text-[#b8a078]"}`}
                  >
                    Public
                  </button>
                  {acceptances
                    .filter((a) => a.status !== "declined")
                    .map((acc) => {
                      const party = PARTIES[acc.userId];
                      if (!party) return null;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => setActiveThread(acc.id)}
                          className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${activeThread === acc.id ? "bg-[#f5a623] text-black" : "bg-[#1a1714] text-[#7a6b5a] border border-[#2a2420] hover:text-[#b8a078]"}`}
                        >
                          {party.fullName}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Public thread label */}
              {(!isPartyA || activeThread === null) && (
                <div className="mb-2 px-2 py-1 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded text-xs text-[#00e5ff]">
                  {isPartyA
                    ? "Public — anyone viewing this need can see these messages"
                    : myAcceptance
                      ? "Private thread — only you and the poster can see these messages"
                      : "Only the poster can see your messages — other visitors cannot"}
                </div>
              )}

              {/* Private thread label */}
              {isPartyA && activeThread !== null && (
                <p className="text-xs text-[#7a6b5a] mb-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Private thread — only you and this fulfiller can see these messages
                </p>
              )}
              {!isPartyA && myAcceptance && (
                <p className="text-xs text-[#7a6b5a] mb-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Private thread — only you and the poster can see these messages
                </p>
              )}

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {visibleMessages.length === 0 && (
                  <p className="text-xs text-[#7a6b5a] text-center py-4">
                    {myAcceptance
                      ? "no messages yet. be the first to reach out."
                      : "no messages yet. send one to reach out to the poster."}
                  </p>
                )}
                {visibleMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.senderId === profileId ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar src={null} name={msg.senderName} size="sm" />
                    <div
                      className={`max-w-[75%] px-3 py-2 text-sm rounded ${msg.senderId === profileId ? "bg-[#1a1714] text-[#e8d5a3] border-l-2 border-[#f5a623]" : "bg-[#12100e] text-[#b8a078] border border-[#2a2420]"}`}
                    >
                      <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-1">
                        {msg.senderName}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="mt-3 flex gap-2 items-center">
                <Input
                  placeholder={
                    isPartyA && activeThread !== null
                      ? "send a private message..."
                      : "post a public message..."
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Reviews display for poster */}
              {isPartyA &&
                freeFormAccepted &&
                (freeFormReviews[freeFormAccepted.id] ?? []).length > 0 && (
                  <div className="mt-6 space-y-3">
                    {(freeFormReviews[freeFormAccepted.id] ?? []).map((review, i) => {
                      const reviewer = PARTIES[review.giverId];
                      const reviewee = PARTIES[review.receiverId];
                      return (
                        <div key={i} className="bg-[#1a1714] border border-[#2a2420] p-3 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-3 w-3 text-[#f5a623]" />
                            <span className="text-sm font-medium text-[#e8d5a3]">
                              {review.rating}/10
                            </span>
                            <span className="text-xs text-[#7a6b5a]">
                              from {reviewer?.fullName || "anonymous"} to{" "}
                              {reviewee?.fullName || "anonymous"}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-[#b8a078] mt-1">{review.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </>
        )}

        {/* ─── CONTRACT VIEW ─── */}
        {canViewContract && (
          <div className="contract-parchment min-h-screen -mx-4 -my-8 px-4 py-8">
            {/* Nav */}
            <div className="print-hidden bg-[#0a0806] border-b border-[#2a2420] -mx-4 -mt-8 px-4 py-4 mb-8 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserContractView((prev) => ({ ...prev, [profileId]: false }))}
                className="text-[#7a6b5a]"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Need
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFlow}
                  className="text-[#ff5252] h-7 text-xs"
                >
                  Reset Demo
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                </Button>
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {/* Document Header */}
              <div className="text-center pb-6 border-b border-[#d4b896]">
                <div className="contract-seal mb-4">Antidosis</div>
                <h1 className="contract-heading text-3xl md:text-4xl mb-2">
                  Binding Exchange Contract
                </h1>
                <p className="contract-body text-sm text-[#5a4a3a]">
                  Ref:{" "}
                  <span className="font-mono text-xs">{MOCK_NEED.id.slice(-6).toUpperCase()}</span>
                </p>
                <Badge
                  variant={
                    currentContract.status === "active" || currentContract.status === "completed"
                      ? "quintessence"
                      : currentContract.status === "cancelled"
                        ? "destructive"
                        : "outline"
                  }
                  className="mt-3 text-[10px]"
                >
                  {statusLabels[currentContract.status] || currentContract.status}
                </Badge>
              </div>

              {/* Cancelled banner */}
              {currentContract.status === "cancelled" && (
                <div className="contract-page p-4 print-hidden border-l-2 border-l-[#ff5252] bg-[#ff5252]/5">
                  <p className="text-sm font-medium text-[#ff5252]">
                    This contract has been cancelled
                  </p>
                  <p className="text-xs text-[#7a6b5a] mt-1">
                    No further actions can be taken. The need is available for new interest.
                  </p>
                </div>
              )}

              {/* Poster cancel notice — shown when fulfiller hasn't signed yet */}
              {isPartyA &&
                !currentContract.partyBSignedAt &&
                (currentContract.status === "draft" ||
                  currentContract.status === "pending_terms") && (
                  <div className="contract-page p-4 print-hidden border-l-2 border-l-[#ff5252]/40 bg-[#ff5252]/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#ff5252]">
                          Waiting for {contractPartyB?.fullName || PARTY_B.fullName} to sign
                        </p>
                        <p className="text-xs text-[#7a6b5a] mt-0.5">
                          You can cancel this contract at any time before both parties sign. The
                          need will return to open status so new fulfillers can express interest.
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          termsLocked ? setShowRequestCancelModal(true) : setShowCancelConfirm(true)
                        }
                        variant="outline"
                        size="sm"
                        className="text-[#ff5252] border-[#ff5252]/30 hover:border-[#ff5252]/60 hover:bg-[#ff5252]/10 shrink-0"
                      >
                        {termsLocked ? "Request Cancellation" : "Cancel Contract"}
                      </Button>
                    </div>
                  </div>
                )}

              {/* Stepper */}
              <div className="contract-page p-5 print-hidden">
                <div className="flex items-center justify-between gap-1">
                  {[
                    {
                      label: "Write Terms",
                      active: !bothSubmitted && !termsLocked,
                      done: bothSubmitted || termsLocked,
                    },
                    {
                      label: "Review & Accept",
                      active: bothSubmitted && !termsLocked,
                      done: termsLocked,
                    },
                    {
                      label: "Sign",
                      active: termsLocked && !bothSigned,
                      done: bothSigned || currentContract.status === "completed",
                    },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center gap-1 flex-1">
                      <div
                        className={`flex-1 h-1.5 rounded-full transition-colors ${step.done ? "bg-emerald-600" : step.active ? "bg-amber-600" : "bg-[#d4c4a8]"}`}
                      />
                      <span
                        className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${step.done ? "text-emerald-700" : step.active ? "text-amber-700" : "text-[#8a7a60]"}`}
                      >
                        {step.label}
                      </span>
                      {i < arr.length - 1 && (
                        <div
                          className={`flex-1 h-1.5 rounded-full ${step.done ? "bg-emerald-600" : "bg-[#d4c4a8]"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Need summary */}
              <div className="contract-page p-6">
                <p className="contract-label mb-3">Subject of Agreement</p>
                <h3 className="contract-heading text-lg mb-2">{MOCK_NEED.title}</h3>
                <p className="contract-body text-sm whitespace-pre-line">{MOCK_NEED.description}</p>
                <div className="mt-4 pt-4 border-t border-[#d4b896]">
                  <p className="contract-label mb-1">Exchange Offer</p>
                  <p className="contract-body text-sm font-medium">{MOCK_NEED.offerDescription}</p>
                  {MOCK_NEED.offerValue && (
                    <p className="text-sm text-[#5a4a3a] mt-1">
                      Estimated value: ${MOCK_NEED.offerValue.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Parties */}
              <div className="contract-page p-6">
                <p className="contract-label mb-4">Parties to this Agreement</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <PartySection party={PARTY_A} label="Party A — Need Poster" isMe={isPartyA} />
                  <PartySection
                    party={contractPartyB || PARTY_B}
                    label="Party B — Fulfiller"
                    isMe={!isPartyA}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="contract-page p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#d4b896] pb-4">
                  <h2 className="contract-heading text-xl">1. Terms of Agreement</h2>
                  {termsLocked ? (
                    <span className="text-xs font-medium uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> locked
                    </span>
                  ) : bothSubmitted ? (
                    <span className="text-xs font-medium uppercase tracking-wide text-[#f5a623] flex items-center gap-1">
                      <Info className="h-3 w-3" /> review phase
                    </span>
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-wide text-amber-700 flex items-center gap-1 print-hidden">
                      <Unlock className="h-3 w-3" /> writing terms
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
                        <div className="flex items-center justify-between mb-3">
                          <p className="contract-label">Your Terms</p>
                          {iSubmitted && (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                              <Check className="h-3 w-3" /> submitted
                            </span>
                          )}
                        </div>
                        {canEditTerms ? (
                          <>
                            <label className="flex items-center gap-2 mb-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useMessageTermsDraft}
                                onChange={(e) => setUseMessageTermsDraft(e.target.checked)}
                                className="accent-[#f5a623]"
                              />
                              <span className="text-sm text-[#5a4a3a]">
                                use message thread as my terms
                              </span>
                            </label>
                            {useMessageTermsDraft ? (
                              <p className="text-sm text-[#7a6b5a] italic">
                                your terms will be derived from the message thread.
                              </p>
                            ) : (
                              <Textarea
                                value={myTermsDraft}
                                onChange={(e) => setMyTermsDraft(e.target.value)}
                                placeholder="describe your terms..."
                                rows={4}
                                className="bg-[#f0dfc0] border-[#d4b896] text-[#2c1810] placeholder:text-[#8a7a60]"
                              />
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={saveTerms}>
                                Save Terms
                              </Button>
                              <Button
                                onClick={submitTerms}
                                disabled={!useMessageTermsDraft && !myTermsDraft.trim()}
                                className="bg-[#ff3333] hover:bg-[#ff5555] text-white border-[#ff3333] shadow-lg shadow-[#ff3333]/30 font-semibold px-4"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Submit for Review
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {(
                              isPartyA
                                ? currentContract.partyAUseMessageTerms
                                : currentContract.partyBUseMessageTerms
                            ) ? (
                              <p className="text-sm text-[#7a6b5a] italic">
                                using message thread as terms
                              </p>
                            ) : (
                              <p className="contract-body text-sm">
                                {isPartyA
                                  ? currentContract.partyATerms || "no terms provided."
                                  : currentContract.partyBTerms || "no terms provided."}
                              </p>
                            )}
                            <p className="text-xs text-[#7a6b5a] mt-3 italic">
                              your terms have been submitted and cannot be edited until the other
                              party submits theirs or terms are rejected.
                            </p>
                          </>
                        )}
                      </div>

                      {/* Their Terms — Write Mode (waiting) */}
                      <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="contract-label">{otherParty.fullName}&apos;s Terms</p>
                          {(isPartyA ? bSubmitted : aSubmitted) ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                              <Check className="h-3 w-3" /> submitted
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#ff5252]">
                              waiting...
                            </span>
                          )}
                        </div>
                        {(isPartyA ? bSubmitted : aSubmitted) ? (
                          (
                            isPartyA
                              ? currentContract.partyBUseMessageTerms
                              : currentContract.partyAUseMessageTerms
                          ) ? (
                            <p className="text-sm text-[#7a6b5a] italic">
                              {otherParty.fullName} is using the message thread as their terms.
                            </p>
                          ) : (
                            <p className="contract-body text-sm">
                              {isPartyA
                                ? currentContract.partyBTerms || "no terms provided."
                                : currentContract.partyATerms || "no terms provided."}
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-[#7a6b5a] italic">
                            waiting for {otherParty.fullName} to submit their terms...
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
                          Both parties have submitted their terms. Review them carefully before
                          accepting. Once both parties accept, terms will be locked and the contract
                          moves to signing.
                        </p>
                      </div>
                    )}

                    {/* Both parties' terms side by side — readonly */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                        <p className="contract-label mb-3">{PARTY_A.fullName}&apos;s Terms</p>
                        {currentContract.partyAUseMessageTerms ? (
                          <p className="text-sm text-[#7a6b5a] italic">
                            using message thread as terms
                          </p>
                        ) : (
                          <p className="contract-body text-sm whitespace-pre-line">
                            {currentContract.partyATerms || "no terms provided."}
                          </p>
                        )}
                      </div>
                      <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                        <p className="contract-label mb-3">
                          {contractPartyB?.fullName || PARTY_B.fullName}&apos;s Terms
                        </p>
                        {currentContract.partyBUseMessageTerms ? (
                          <p className="text-sm text-[#7a6b5a] italic">
                            using message thread as terms
                          </p>
                        ) : (
                          <p className="contract-body text-sm whitespace-pre-line">
                            {currentContract.partyBTerms || "no terms provided."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Agreement status + Accept button */}
                    {!termsLocked && (
                      <div className="border border-[#d4b896] p-5 bg-[#f0dfc0] print-hidden">
                        <p className="contract-label mb-3">Acceptance Status</p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <span className="contract-body font-medium">{PARTY_A.fullName}</span>
                            {currentContract.partyAAgreedAt ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                                <Badge variant="success" className="gap-1">
                                  <Check className="h-3 w-3" /> accepted
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#8a7a60]" />
                                <span className="text-xs text-[#8a7a60] uppercase tracking-wide">
                                  pending
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="contract-body font-medium">
                              {contractPartyB?.fullName || PARTY_B.fullName}
                            </span>
                            {currentContract.partyBAgreedAt ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                                <Badge variant="success" className="gap-1">
                                  <Check className="h-3 w-3" /> accepted
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#8a7a60]" />
                                <span className="text-xs text-[#8a7a60] uppercase tracking-wide">
                                  pending
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!iAgreed && (
                          <div className="mt-5 space-y-3">
                            <Button
                              onClick={agree}
                              className="w-full"
                              style={{
                                background: "#1a0f08",
                                color: "#f5e6c8",
                                border: "1px solid #2c1810",
                              }}
                            >
                              <Check className="h-4 w-4 mr-2" /> I Accept These Terms
                            </Button>
                            <p className="text-center text-xs text-[#7a6b5a]">
                              By clicking accept, you agree to be bound by both parties&apos; terms
                              as shown above.
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

                {/* Locked terms display */}
                {termsLocked && (
                  <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                    <p className="contract-label mb-3">Locked Terms</p>
                    <div className="space-y-3 contract-body text-sm">
                      {currentContract.partyATerms && (
                        <p>
                          <strong>{PARTY_A.fullName}:</strong> {currentContract.partyATerms}
                        </p>
                      )}
                      {currentContract.partyBTerms && (
                        <p>
                          <strong>{contractPartyB?.fullName || PARTY_B.fullName}:</strong>{" "}
                          {currentContract.partyBTerms}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-emerald-700 mt-4 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Terms were locked on{" "}
                      {new Date(currentContract.termsLockedAt!).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Signatures */}
              {termsLocked && (
                <div className="contract-page p-6">
                  <h2 className="contract-heading text-xl mb-4 border-b border-[#d4b896] pb-2">
                    2. Digital Signatures
                  </h2>
                  <div className="space-y-4">
                    <SignatureRow
                      name={PARTY_A.fullName}
                      signed={!!currentContract.partyASignedAt}
                      signedAt={currentContract.partyASignedAt}
                      signatureText={currentContract.partyASignature}
                    />
                    <div className="border-t border-[#d4b896]" />
                    <SignatureRow
                      name={contractPartyB?.fullName || PARTY_B.fullName}
                      signed={!!currentContract.partyBSignedAt}
                      signedAt={currentContract.partyBSignedAt}
                      signatureText={currentContract.partyBSignature}
                    />
                  </div>
                  {canSign && (
                    <Button
                      onClick={() => setShowSignModal(true)}
                      className="w-full mt-4 print-hidden"
                    >
                      <FileText className="h-3.5 w-3.5 mr-2" /> Sign Contract
                    </Button>
                  )}
                  {iSigned && !bothSigned && (
                    <p className="text-center text-sm text-[#5a4a3a] mt-4 print-hidden">
                      waiting for {otherParty.fullName} to sign...
                    </p>
                  )}
                  {bothSigned && currentContract.status !== "completed" && (
                    <p className="text-center text-sm text-emerald-700 mt-4">
                      contract is active — both parties have digitally signed
                    </p>
                  )}
                  {currentContract.status === "completed" && (
                    <p className="text-center text-sm text-emerald-700 mt-4">
                      contract complete — both parties fulfilled their obligations
                    </p>
                  )}
                </div>
              )}

              {/* Completion */}
              {canComplete && (
                <div className="contract-page p-5 print-hidden">
                  <h2 className="contract-heading text-xl mb-4">3. Completion</h2>
                  <div className="space-y-0">
                    <div className="flex items-center justify-between py-3">
                      <span className="contract-body">{PARTY_A.fullName}</span>
                      {currentContract.aMarkedComplete ? (
                        <Badge variant="success">done</Badge>
                      ) : (
                        <span className="text-xs text-[#8a7a60] uppercase tracking-wide">
                          pending
                        </span>
                      )}
                    </div>
                    <div className="border-t border-[#d4b896]" />
                    <div className="flex items-center justify-between py-3">
                      <span className="contract-body">
                        {contractPartyB?.fullName || PARTY_B.fullName}
                      </span>
                      {currentContract.bMarkedComplete ? (
                        <Badge variant="success">done</Badge>
                      ) : (
                        <span className="text-xs text-[#8a7a60] uppercase tracking-wide">
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
                    <p className="text-center text-sm text-[#5a4a3a] mt-4">
                      waiting for the other party...
                    </p>
                  )}
                  {iMarkedComplete && otherMarkedComplete && (
                    <p className="text-center text-sm text-emerald-700 mt-4">contract complete</p>
                  )}
                </div>
              )}

              {/* Reviews */}
              {currentContract.status === "completed" && (
                <div className="contract-page p-6">
                  <h2 className="contract-heading text-xl mb-4 border-b border-[#d4b896] pb-2">
                    4. Reviews
                  </h2>
                  {!hasReviewed && (
                    <div className="space-y-4">
                      <div className="bg-[#f0dfc0] border border-[#d4b896] rounded-sm p-4">
                        <p className="text-sm text-[#5a4a3a] font-medium mb-1">Rating Guide</p>
                        <p className="text-xs text-[#7a6b5a] mb-2">
                          Default excellence. Unless there was a significant problem, keep it at 10.
                        </p>
                        <div className="text-xs text-[#7a6b5a] space-y-1">
                          <p>• 10: default — everything went well, no change needed</p>
                          <p>• 8-9: good — minor suggestions go in private feedback</p>
                          <p>• 5-7: average — explain what was missing in your review</p>
                          <p>• 1-4: poor — only for significant problems</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#5a4a3a]">Rate {otherParty.fullName}</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={rating}
                          onChange={(e) => setRating(parseInt(e.target.value))}
                          className={`flex-1 transition-all duration-300 ${rating === 10 ? "accent-[#00e676]" : "accent-[#f5a623]"}`}
                        />
                        <span
                          className={`text-lg font-bold w-12 text-center transition-colors duration-300 ${rating === 10 ? "text-[#00e676]" : "text-[#e8d5a3]"}`}
                        >
                          {rating}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[#5a4a3a]">Public Review</Label>
                        <Textarea
                          placeholder="share your experience publicly..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={3}
                          className="bg-[#f0dfc0] border-[#d4b896] text-[#2c1810] placeholder:text-[#8a7a60]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[#5a4a3a]">
                          Private Feedback (only visible to {otherParty.fullName}, not on their
                          public profile)
                        </Label>
                        <Textarea
                          placeholder="share constructive criticism privately..."
                          value={privateFeedbackDraft}
                          onChange={(e) => setPrivateFeedbackDraft(e.target.value)}
                          rows={3}
                          className="bg-[#f0dfc0] border-[#d4b896] text-[#2c1810] placeholder:text-[#8a7a60]"
                        />
                      </div>
                      <Button onClick={submitReview} className="w-full">
                        Submit Review
                      </Button>
                    </div>
                  )}
                  {hasReviewed && (
                    <p className="text-center text-sm text-[#5a4a3a]">
                      You have submitted your review
                    </p>
                  )}
                  {otherReview && (
                    <div className="border border-[#d4b896] p-4 mt-4 bg-[#f0dfc0]">
                      <p className="text-xs text-[#7a6b5a] uppercase tracking-wide mb-2">
                        {otherParty.fullName} reviewed you
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-[#f5a623]">
                          {otherReview.rating}
                        </span>
                        <span className="text-xs text-[#7a6b5a]">/ 10</span>
                      </div>
                      {otherReview.comment && (
                        <div className="mb-2">
                          <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wide mb-1">
                            Public Review
                          </p>
                          <p className="text-sm text-[#5a4a3a]">{otherReview.comment}</p>
                        </div>
                      )}
                      {otherReview.privateFeedback && (
                        <div className="mt-2 pt-2 border-t border-[#d4b896]">
                          <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wide mb-1">
                            Private Feedback
                          </p>
                          <p className="text-sm text-[#5a4a3a]">{otherReview.privateFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="contract-page p-5 print-hidden">
                <h2 className="contract-heading text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Messages
                </h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {contractMessages.length === 0 && (
                    <p className="text-xs text-[#8a7a60] text-center py-4">no messages yet.</p>
                  )}
                  {contractMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.senderId === profileId ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar src={null} name={msg.senderName} size="sm" />
                      <div
                        className={`max-w-[75%] px-3 py-2 text-sm rounded ${msg.senderId === profileId ? "bg-[#f0dfc0] text-[#2c1810] border-l-2 border-[#b89a68]" : "bg-[#e8d5b8] text-[#2c1810] border border-[#d4b896]"}`}
                      >
                        <p className="text-[10px] text-[#8a7a60] uppercase tracking-wider mb-1">
                          {msg.senderName}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {currentContract.status !== "completed" &&
                  currentContract.status !== "cancelled" && (
                    <form onSubmit={sendMessage} className="mt-3 flex gap-2 items-center">
                      <Input
                        placeholder="type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="h-9 text-sm bg-[#f0dfc0] border-[#d4b896] text-[#2c1810] placeholder:text-[#8a7a60]"
                      />
                      <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  )}
              </div>

              {/* Cancellation UI */}
              {currentContract.status !== "cancelled" && !cancelAgreed && (
                <div className="print-hidden space-y-4">
                  {/* Escalated banner */}
                  {cancelEscalated && (
                    <div className="contract-page p-4 border-l-2 border-l-amber-500 bg-amber-500/5">
                      <p className="text-sm font-medium text-amber-500">Escalated to admin</p>
                      <p className="text-xs text-[#7a6b5a] mt-1">
                        This cancellation request has been escalated to an admin for review.
                      </p>
                    </div>
                  )}

                  {/* Pending request — requester view */}
                  {cancelPending && isCancelRequester && (
                    <div className="contract-page p-4 border-l-2 border-l-amber-500 bg-amber-500/5">
                      <p className="text-sm font-medium text-amber-500">Cancellation requested</p>
                      <p className="text-xs text-[#7a6b5a] mt-1">
                        Waiting for {otherParty.fullName} to respond.
                      </p>
                      <Button
                        onClick={withdrawCancelRequest}
                        variant="ghost"
                        size="sm"
                        className="text-[#7a6b5a] mt-2"
                      >
                        Withdraw Request
                      </Button>
                    </div>
                  )}

                  {/* Pending request — other party view */}
                  {cancelPending && !isCancelRequester && (
                    <div className="contract-page p-4 border-l-2 border-l-[#ff5252] bg-[#ff5252]/5">
                      <p className="text-sm font-medium text-[#ff5252]">
                        {PARTIES[currentContract.cancelRequestedById!]?.fullName ||
                          "The other party"}{" "}
                        requested to cancel this contract
                      </p>
                      {currentContract.cancelReason && (
                        <p className="text-xs text-[#7a6b5a] mt-1">
                          Reason: {currentContract.cancelReason}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => setShowRespondCancelModal(true)}
                          variant="outline"
                          size="sm"
                          className="text-[#ff5252] border-[#ff5252]/30"
                        >
                          Respond
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Declined — requester view */}
                  {cancelDeclined && isCancelRequester && (
                    <div className="contract-page p-4 border-l-2 border-l-[#ff5252] bg-[#ff5252]/5">
                      <p className="text-sm font-medium text-[#ff5252]">
                        {otherParty.fullName} declined your cancellation request
                      </p>
                      <p className="text-xs text-[#7a6b5a] mt-1">
                        The contract will continue. You can escalate to an admin for review.
                      </p>
                      <Button
                        onClick={escalateCancel}
                        variant="ghost"
                        size="sm"
                        className="text-[#ff5252] mt-2"
                      >
                        Escalate to Admin
                      </Button>
                    </div>
                  )}

                  {/* No pending request — show action button */}
                  {!cancelPending && !cancelDeclined && !cancelEscalated && (
                    <div className="text-center py-6">
                      {!termsLocked &&
                      (currentContract.status === "draft" ||
                        currentContract.status === "pending_terms") ? (
                        <Button
                          onClick={() => setShowCancelConfirm(true)}
                          variant="ghost"
                          className="text-[#ff5252]"
                        >
                          Cancel Contract
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowRequestCancelModal(true)}
                          variant="ghost"
                          className="text-[#ff5252]"
                        >
                          Request Cancellation
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-[#12100e] border border-[#2a2420] p-6 rounded-md max-w-sm w-full mx-4">
              <p className="text-sm text-[#e8d5a3] mb-4">
                Cancel this contract? The need will return to open status so new fulfillers can
                express interest.
              </p>
              <div className="flex gap-3">
                <Button onClick={cancelContract} variant="ghost" className="flex-1 text-[#ff5252]">
                  Yes, Cancel
                </Button>
                <Button
                  onClick={() => setShowCancelConfirm(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Keep Contract
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Confirmation Modal */}
        {showCompleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-[#12100e] border border-[#2a2420] p-6 rounded-md max-w-sm w-full mx-4">
              <p className="text-sm text-[#e8d5a3] mb-4">
                Are you sure both parties have fulfilled their obligations?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    markComplete();
                    setShowCompleteConfirm(false);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Yes, Complete
                </Button>
                <Button
                  onClick={() => setShowCompleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Not Yet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Request Cancellation Modal */}
        {showRequestCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-[#12100e] border border-[#2a2420] p-6 rounded-md max-w-sm w-full mx-4">
              <p className="text-sm text-[#e8d5a3] mb-2">Request Cancellation</p>
              <p className="text-xs text-[#7a6b5a] mb-4">
                The other party must agree to cancel this contract. You can optionally provide a
                reason.
              </p>
              <Textarea
                placeholder="Reason for cancellation (optional)..."
                value={cancelReasonDraft}
                onChange={(e) => setCancelReasonDraft(e.target.value)}
                rows={3}
                className="bg-[#0f0c0a] border-[#2a2420] text-[#e8d5a3] placeholder:text-[#7a6b5a] mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => requestCancel(cancelReasonDraft)}
                  variant="ghost"
                  className="flex-1 text-[#ff5252]"
                >
                  Request Cancellation
                </Button>
                <Button
                  onClick={() => {
                    setShowRequestCancelModal(false);
                    setCancelReasonDraft("");
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Respond Cancellation Modal */}
        {showRespondCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-[#12100e] border border-[#2a2420] p-6 rounded-md max-w-sm w-full mx-4">
              <p className="text-sm text-[#e8d5a3] mb-2">Respond to Cancellation Request</p>
              <p className="text-xs text-[#7a6b5a] mb-4">
                {PARTIES[currentContract.cancelRequestedById!]?.fullName || "The other party"}{" "}
                requested to cancel this contract.
                {currentContract.cancelReason && ` Reason: "${currentContract.cancelReason}"`}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => respondCancel(true)}
                  variant="ghost"
                  className="flex-1 text-[#ff5252]"
                >
                  Agree to Cancel
                </Button>
                <Button onClick={() => respondCancel(false)} variant="secondary" className="flex-1">
                  Decline
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Modal */}
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-[#f5e6c8] border border-[#d4b896] p-6 rounded-sm max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center mb-5">
                <div className="contract-seal text-lg mb-2">Antidosis</div>
                <h3 className="contract-heading text-xl text-[#1a0f08]">Digital Signature</h3>
                <p className="text-xs text-[#5a4a3a] mt-1">
                  You are about to sign a legally binding contract
                </p>
              </div>

              <div className="bg-[#f0dfc0] border border-[#d4b896] p-3 mb-4 text-xs text-[#5a4a3a]">
                <p className="font-medium mb-1">Contract Summary:</p>
                <p>
                  <strong>Need:</strong> {MOCK_NEED.title}
                </p>
                <p>
                  <strong>Party A:</strong> {PARTY_A.fullName}
                </p>
                <p>
                  <strong>Party B:</strong> {contractPartyB?.fullName || PARTY_B.fullName}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#5a4a3a] uppercase tracking-wider mb-1.5 block">
                    Type your full name as your signature
                  </label>
                  <Input
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    placeholder={`e.g. ${isPartyA ? PARTY_A.fullName : contractPartyB?.fullName || PARTY_B.fullName}`}
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
                    I have read and understood the terms of this contract. I agree to be legally
                    bound by both parties&apos; terms as shown above. I understand this constitutes
                    a digital signature under the <em>Electronic Transactions Act 1999</em> (Cth).
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-5">
                <Button
                  onClick={() => {
                    sign(signatureInput.trim());
                    setShowSignModal(false);
                    setSignatureInput("");
                    setAgreedToTermsCheck(false);
                  }}
                  disabled={!signatureInput.trim() || !agreedToTermsCheck}
                  className="flex-1"
                  style={{ background: "#1a0f08", color: "#f5e6c8", border: "1px solid #2c1810" }}
                >
                  Sign Contract
                </Button>
                <Button
                  onClick={() => {
                    setShowSignModal(false);
                    setSignatureInput("");
                    setAgreedToTermsCheck(false);
                  }}
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
