"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EB_Garamond } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft, Send, Check, Shield, FileText, Lock, Unlock, Info,
  MessageSquare, ChevronDown, ChevronUp, Printer, Star,
  MapPin, Briefcase, User, ArrowRightLeft, X,
} from "lucide-react";

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
  requiredSkills: [{ id: "1", name: "gardening" }, { id: "2", name: "landscaping" }],
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
  skills: [{ id: "s1", name: "project management" }, { id: "s2", name: "design" }],
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
  skills: [{ id: "s3", name: "gardening" }, { id: "s4", name: "landscaping" }, { id: "s5", name: "stone work" }],
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
  skills: [{ id: "s6", name: "gardening" }, { id: "s7", name: "irrigation" }, { id: "s8", name: "horticulture" }],
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
  status: "pending" | "accepted" | "declined";
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  acceptanceId: string | null;
};

/* ─── Sub-components ─── */
function PartySection({ party, label, isMe }: { party: typeof PARTY_A; label: string; isMe: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="contract-label">{label}</span>
        {isMe && <span className="text-[10px] font-medium uppercase tracking-wider text-[#8a7a60]">you</span>}
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
            <span key={s.id} className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#c4b496] text-[#5a4a3a]">
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SignatureRow({ name, signed, signedAt, signatureText }: { name: string | null; signed: boolean; signedAt?: string | null; signatureText?: string | null }) {
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
          digitally signed on {new Date(signedAt).toLocaleString("en-AU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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

export default function ContractFlowDemoPage() {
  const router = useRouter();

  /* ─── View mode ─── */
  const [currentUser, setCurrentUser] = useState<"A" | "B" | "C">("B");
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

  /* ─── Contract state ─── */
  const [status, setStatus] = useState("draft");
  const [partyATerms, setPartyATerms] = useState("");
  const [partyBTerms, setPartyBTerms] = useState("");
  const [partyAUseMessageTerms, setPartyAUseMessageTerms] = useState(false);
  const [partyBUseMessageTerms, setPartyBUseMessageTerms] = useState(false);
  const [partyASubmittedAt, setPartyASubmittedAt] = useState<string | null>(null);
  const [partyBSubmittedAt, setPartyBSubmittedAt] = useState<string | null>(null);
  const [partyAAgreedAt, setPartyAAgreedAt] = useState<string | null>(null);
  const [partyBAgreedAt, setPartyBAgreedAt] = useState<string | null>(null);
  const [termsLockedAt, setTermsLockedAt] = useState<string | null>(null);
  const [partyASignedAt, setPartyASignedAt] = useState<string | null>(null);
  const [partyBSignedAt, setPartyBSignedAt] = useState<string | null>(null);
  const [partyASignature, setPartyASignature] = useState<string | null>(null);
  const [partyBSignature, setPartyBSignature] = useState<string | null>(null);
  const [aMarkedComplete, setAMarkedComplete] = useState(false);
  const [bMarkedComplete, setBMarkedComplete] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");

  /* ─── Local term editing ─── */
  const [myTermsDraft, setMyTermsDraft] = useState("");
  const [useMessageTermsDraft, setUseMessageTermsDraft] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureInput, setSignatureInput] = useState("");
  const [agreedToTermsCheck, setAgreedToTermsCheck] = useState(false);

  /* ─── Derived ─── */
  const interestAccepted = acceptances.some(a => a.status === "accepted");
  const selectedAcceptance = acceptances.find(a => a.id === selectedAcceptanceId) || null;
  const contractPartyB = selectedAcceptance ? PARTIES[selectedAcceptance.userId] : null;
  const otherParty = isPartyA ? (contractPartyB || PARTY_B) : PARTY_A;
  const myAcceptance = acceptances.find(a => a.userId === profileId);
  const canViewContract = contractFormed && (isPartyA || selectedAcceptance?.userId === profileId);
  const iAmDeclined = !isPartyA && myAcceptance?.status === "declined";

  /* ─── Reset ─── */
  function resetFlow() {
    setAcceptances([]);
    setInterestMessage("");
    setContractFormed(false);
    setSelectedAcceptanceId(null);
    setActiveThread(null);
    setStatus("draft");
    setPartyATerms("");
    setPartyBTerms("");
    setPartyAUseMessageTerms(false);
    setPartyBUseMessageTerms(false);
    setPartyASubmittedAt(null);
    setPartyBSubmittedAt(null);
    setPartyAAgreedAt(null);
    setPartyBAgreedAt(null);
    setTermsLockedAt(null);
    setPartyASignedAt(null);
    setPartyBSignedAt(null);
    setPartyASignature(null);
    setPartyBSignature(null);
    setAMarkedComplete(false);
    setBMarkedComplete(false);
    setCompletedAt(null);
    setMessages([]);
    setMyTermsDraft("");
    setUseMessageTermsDraft(false);
  }

  /* ─── Actions ─── */
  function expressInterest() {
    const newAcceptance: Acceptance = {
      id: `acc-${Date.now()}`,
      userId: isPartyB ? PARTY_B.id : PARTY_C.id,
      message: interestMessage,
      status: "pending",
    };
    setAcceptances(prev => [...prev, newAcceptance]);
    setInterestMessage("");
  }

  function acceptInterest(acceptanceId: string) {
    setAcceptances(prev => prev.map(a =>
      a.id === acceptanceId ? { ...a, status: "accepted" } : a
    ));
    if (!requiresContract) {
      // For free-form needs: auto-decline others since there's no contract step
      setAcceptances(prev => prev.map(a =>
        a.id === acceptanceId ? { ...a, status: "accepted" } :
        a.status === "pending" ? { ...a, status: "declined" } : a
      ));
      setStatus("active");
    }
  }

  function declineInterest(acceptanceId: string) {
    setAcceptances(prev => prev.map(a =>
      a.id === acceptanceId ? { ...a, status: "declined" } : a
    ));
  }

  function formContract(acceptanceId: string) {
    setContractFormed(true);
    setSelectedAcceptanceId(acceptanceId);
    setActiveThread(acceptanceId);
    setStatus("draft");
  }

  function saveTerms() {
    if (isPartyA) {
      setPartyATerms(myTermsDraft);
      setPartyAUseMessageTerms(useMessageTermsDraft);
    } else {
      setPartyBTerms(myTermsDraft);
      setPartyBUseMessageTerms(useMessageTermsDraft);
    }
  }

  function submitTerms() {
    const now = new Date().toISOString();
    if (isPartyA) {
      setPartyASubmittedAt(now);
      setPartyATerms(myTermsDraft);
      setPartyAUseMessageTerms(useMessageTermsDraft);
    } else {
      setPartyBSubmittedAt(now);
      setPartyBTerms(myTermsDraft);
      setPartyBUseMessageTerms(useMessageTermsDraft);
    }
    setPartyAAgreedAt(null);
    setPartyBAgreedAt(null);
  }

  function agree() {
    if (!partyASubmittedAt || !partyBSubmittedAt) return;
    if (isPartyA) setPartyAAgreedAt(new Date().toISOString());
    else setPartyBAgreedAt(new Date().toISOString());
  }

  // Lock terms when both parties have agreed (runs after state updates commit)
  useEffect(() => {
    if (partyAAgreedAt && partyBAgreedAt && !termsLockedAt) {
      setTermsLockedAt(new Date().toISOString());
      setStatus("pending_terms");
    }
  }, [partyAAgreedAt, partyBAgreedAt, termsLockedAt]);

  function sign(signature: string) {
    const now = new Date().toISOString();
    if (isPartyA) {
      setPartyASignedAt(now);
      setPartyASignature(signature);
    } else {
      setPartyBSignedAt(now);
      setPartyBSignature(signature);
    }

    const aSigned = isPartyA ? now : partyASignedAt;
    const bSigned = isPartyB ? now : partyBSignedAt;
    if (aSigned && bSigned) {
      setStatus("active");
    }
  }

  function markComplete() {
    if (isPartyA) setAMarkedComplete(true);
    else setBMarkedComplete(true);
  }

  // Mark contract as completed when both parties have marked complete
  useEffect(() => {
    if (aMarkedComplete && bMarkedComplete && status !== "completed") {
      setStatus("completed");
      setCompletedAt(new Date().toISOString());
    }
  }, [aMarkedComplete, bMarkedComplete, status]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    let acceptanceId: string | null = null;
    if (isPartyA) {
      acceptanceId = activeThread;
    } else {
      acceptanceId = myAcceptance?.id ?? null;
    }
    setMessages(prev => [
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
  const termsLocked = !!termsLockedAt;
  const bothSigned = !!partyASignedAt && !!partyBSignedAt;
  const iSigned = isPartyA ? !!partyASignedAt : !!partyBSignedAt;
  const iAgreed = isPartyA ? !!partyAAgreedAt : !!partyBAgreedAt;
  const aSubmitted = !!partyASubmittedAt;
  const bSubmitted = !!partyBSubmittedAt;
  const iSubmitted = isPartyA ? aSubmitted : bSubmitted;
  const bothSubmitted = aSubmitted && bSubmitted;
  const canEditTerms = !termsLocked && !iSubmitted && (status === "draft" || status === "pending_terms");
  const canReview = bothSubmitted && !termsLocked;
  const canSign = termsLocked && !iSigned && (status === "draft" || status === "pending_terms");
  const canComplete = status === "active" || status === "pending_completion";
  const iMarkedComplete = isPartyA ? aMarkedComplete : bMarkedComplete;
  const otherMarkedComplete = isPartyA ? bMarkedComplete : aMarkedComplete;

  const statusLabels: Record<string, string> = {
    draft: "draft", pending_terms: "pending signatures", active: "active",
    pending_completion: "pending completion", completed: "completed", cancelled: "cancelled",
  };

  /* ─── Message filtering ─── */
  const visibleMessages = messages.filter(msg => {
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

  const contractMessages = messages.filter(msg => {
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
            <Badge variant="default" className="text-[10px]">DEMO MODE</Badge>
            <span className="text-xs text-[#7a6b5a]">Test the contract flow without real users</span>
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
                    onChange={(e) => { setRequiresContract(e.target.checked); resetFlow(); }}
                    className="accent-[#f5a623]"
                  />
                  <span className="text-sm text-[#b8a078]">Require formal contract</span>
                </label>
              )}
              <Button size="sm" variant="ghost" onClick={resetFlow} className="text-[#7a6b5a] h-7 text-xs">
                Reset Flow
              </Button>
            </div>
          </div>
        </div>

        {/* ─── NEED POST VIEW ─── */}
        {!canViewContract && (
          <>
            <div className="py-2">
              <Link href="/" className="inline-flex items-center text-xs text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> browse needs
              </Link>
            </div>

            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">{MOCK_NEED.title}</h1>
              {interestAccepted && (
                <Badge variant="warning" className="mt-1.5 capitalize">
                  {requiresContract ? "negotiating" : "active"}
                </Badge>
              )}
              <Badge variant={requiresContract ? "quintessence" : "outline"} className="mt-1.5 text-[10px]">
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
                <span key={s.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded">{s.name}</span>
              ))}
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {MOCK_NEED.locationName}
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">{MOCK_NEED.description}</p>
            </div>

            <div className="vessel p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">offering in exchange</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-[#e8d5a3]">{MOCK_NEED.offerDescription}</p>
                <span className="text-xs text-[#b8a078]">est. ${MOCK_NEED.offerValue.toLocaleString()}</span>
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
                <p className="text-xs text-[#7a6b5a] mb-3">tell the poster why you are a good fit.</p>
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
                    <span className="text-[#7a6b5a] uppercase tracking-wider text-[9px]">your intro: </span>
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
                    {requiresContract ? "poster accepted — ready to form contract" : "poster accepted — deal confirmed"}
                  </p>
                </div>
              </div>
            )}

            {/* Poster interested list */}
            {isPartyA && acceptances.filter(a => a.status !== "declined").length > 0 && (
              <div className="mb-6 space-y-4">
                <h3 className="text-xs text-[#7a6b5a] uppercase tracking-wider">Interested</h3>
                {acceptances.filter(a => a.status !== "declined").map((acc) => {
                  const party = PARTIES[acc.userId];
                  if (!party) return null;
                  return (
                    <div key={acc.id} className="vessel p-4">
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${party.id}`} className="shrink-0">
                          <Avatar src={party.avatarUrl} name={party.fullName} size="md" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${party.id}`} className="text-sm font-medium text-[#e8d5a3] hover:underline">
                                {party.fullName}
                              </Link>
                              {party.isVerified && <Shield className="h-3.5 w-3.5 text-[#00e676]" />}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {acc.status === "pending" && (
                                <>
                                  <Button size="sm" variant="default" className="h-7 text-xs px-2" onClick={() => acceptInterest(acc.id)}>
                                    <Check className="h-3 w-3 mr-1" /> Accept
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-[#ff5252] hover:text-[#ff5252]" onClick={() => declineInterest(acc.id)}>
                                    <X className="h-3 w-3 mr-1" /> Decline
                                  </Button>
                                </>
                              )}
                              {acc.status === "accepted" && requiresContract && (
                                <Button size="sm" variant="default" className="h-7 text-xs px-2" onClick={() => formContract(acc.id)}>
                                  <FileText className="h-3 w-3 mr-1" /> Contract
                                </Button>
                              )}
                              {acc.status === "accepted" && !requiresContract && (
                                <Badge variant="success" className="text-[10px]">Deal confirmed</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#7a6b5a]">
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#f5a623]" /> {party.ratingAvg.toFixed(1)} ({party.ratingCount})</span>
                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {party.jobsCompleted} jobs</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {party.locationName}</span>
                          </div>
                          <p className="text-xs text-[#b8a078] mt-2 line-clamp-1">{party.bio}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {party.skills.slice(0, 4).map(s => (
                              <span key={s.id} className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] rounded">{s.name}</span>
                            ))}
                          </div>
                          {acc.message && (
                            <div className="mt-2 bg-[#0f0c0a] p-2.5 rounded text-xs text-[#b8a078]">
                              <span className="text-[#7a6b5a] uppercase tracking-wider text-[9px]">Message: </span>
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
                  {acceptances.filter(a => a.status !== "declined").map((acc) => {
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
                      ? "Public wall + your private thread — your replies go to your private thread"
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
                  <div key={msg.id} className={`flex gap-2 ${msg.senderId === profileId ? "flex-row-reverse" : ""}`}>
                    <Avatar src={null} name={msg.senderName} size="sm" />
                    <div className={`max-w-[75%] px-3 py-2 text-sm rounded ${msg.senderId === profileId ? "bg-[#1a1714] text-[#e8d5a3] border-l-2 border-[#f5a623]" : "bg-[#12100e] text-[#b8a078] border border-[#2a2420]"}`}>
                      <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-1">{msg.senderName}</p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="mt-3 flex gap-2 items-center">
                <Input placeholder={isPartyA && activeThread !== null ? "send a private message..." : "post a public message..."} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="h-9 text-sm" />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0"><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          </>
        )}

        {/* ─── CONTRACT VIEW ─── */}
        {canViewContract && (
          <div className="contract-parchment min-h-screen -mx-4 -my-8 px-4 py-8">
            {/* Nav */}
            <div className="print-hidden bg-[#0a0806] border-b border-[#2a2420] -mx-4 -mt-8 px-4 py-4 mb-8 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => setContractFormed(false)} className="text-[#7a6b5a]">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Need
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={resetFlow} className="text-[#ff5252] h-7 text-xs">
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
                <h1 className="contract-heading text-3xl md:text-4xl mb-2">Binding Exchange Contract</h1>
                <p className="contract-body text-sm text-[#5a4a3a]">
                  Ref: <span className="font-mono text-xs">{MOCK_NEED.id.slice(-6).toUpperCase()}</span>
                </p>
                <Badge variant={status === "active" || status === "completed" ? "quintessence" : "outline"} className="mt-3 text-[10px]">
                  {statusLabels[status] || status}
                </Badge>
              </div>

              {/* Stepper */}
              <div className="contract-page p-5 print-hidden">
                <div className="flex items-center justify-between gap-1">
                  {[
                    { label: "Write Terms", active: !bothSubmitted && !termsLocked, done: bothSubmitted || termsLocked },
                    { label: "Review & Accept", active: bothSubmitted && !termsLocked, done: termsLocked },
                    { label: "Sign", active: termsLocked && !bothSigned, done: bothSigned || status === "completed" },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center gap-1 flex-1">
                      <div className={`flex-1 h-1.5 rounded-full transition-colors ${step.done ? "bg-emerald-600" : step.active ? "bg-amber-600" : "bg-[#d4c4a8]"}`} />
                      <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${step.done ? "text-emerald-700" : step.active ? "text-amber-700" : "text-[#8a7a60]"}`}>{step.label}</span>
                      {i < arr.length - 1 && <div className={`flex-1 h-1.5 rounded-full ${step.done ? "bg-emerald-600" : "bg-[#d4c4a8]"}`} />}
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
                  {MOCK_NEED.offerValue && <p className="text-sm text-[#5a4a3a] mt-1">Estimated value: ${MOCK_NEED.offerValue.toLocaleString()}</p>}
                </div>
              </div>

              {/* Parties */}
              <div className="contract-page p-6">
                <p className="contract-label mb-4">Parties to this Agreement</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <PartySection party={PARTY_A} label="Party A — Need Poster" isMe={isPartyA} />
                  <PartySection party={contractPartyB || PARTY_B} label="Party B — Fulfiller" isMe={!isPartyA} />
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
                      <p className="text-sm text-[#5a4a3a] font-medium mb-1">Phase 1: Write Your Terms</p>
                      <p className="text-xs text-[#7a6b5a]">Both parties must write and submit their own terms before review can begin. You can edit your terms until you submit them.</p>
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
                              <span className="text-sm text-[#5a4a3a]">use message thread as my terms</span>
                            </label>
                            {useMessageTermsDraft ? (
                              <p className="text-sm text-[#7a6b5a] italic">your terms will be derived from the message thread.</p>
                            ) : (
                              <Textarea value={myTermsDraft} onChange={(e) => setMyTermsDraft(e.target.value)} placeholder="describe your terms..." rows={4} />
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={saveTerms}>Save Terms</Button>
                              <Button size="sm" variant="secondary" onClick={submitTerms} disabled={!useMessageTermsDraft && !myTermsDraft.trim()}>
                                Submit for Review
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {(isPartyA ? partyAUseMessageTerms : partyBUseMessageTerms) ? (
                              <p className="text-sm text-[#7a6b5a] italic">using message thread as terms</p>
                            ) : (
                              <p className="contract-body text-sm">{isPartyA ? partyATerms || "no terms provided." : partyBTerms || "no terms provided."}</p>
                            )}
                            <p className="text-xs text-[#7a6b5a] mt-3 italic">your terms have been submitted and cannot be edited until the other party submits theirs or terms are rejected.</p>
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
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#ff5252]">waiting...</span>
                          )}
                        </div>
                        {(isPartyA ? bSubmitted : aSubmitted) ? (
                          (isPartyA ? partyBUseMessageTerms : partyAUseMessageTerms) ? (
                            <p className="text-sm text-[#7a6b5a] italic">{otherParty.fullName} is using the message thread as their terms.</p>
                          ) : (
                            <p className="contract-body text-sm">{isPartyA ? partyBTerms || "no terms provided." : partyATerms || "no terms provided."}</p>
                          )
                        ) : (
                          <p className="text-sm text-[#7a6b5a] italic">waiting for {otherParty.fullName} to submit their terms...</p>
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
                        <p className="text-sm text-[#5a4a3a] font-medium mb-1">Phase 2: Review & Accept</p>
                        <p className="text-xs text-[#7a6b5a]">Both parties have submitted their terms. Review them carefully before accepting. Once both parties accept, terms will be locked and the contract moves to signing.</p>
                      </div>
                    )}

                    {/* Both parties' terms side by side — readonly */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                        <p className="contract-label mb-3">{PARTY_A.fullName}&apos;s Terms</p>
                        {partyAUseMessageTerms ? (
                          <p className="text-sm text-[#7a6b5a] italic">using message thread as terms</p>
                        ) : (
                          <p className="contract-body text-sm whitespace-pre-line">{partyATerms || "no terms provided."}</p>
                        )}
                      </div>
                      <div className="border border-[#d4b896] p-5 bg-[#f0dfc0]">
                        <p className="contract-label mb-3">{contractPartyB?.fullName || PARTY_B.fullName}&apos;s Terms</p>
                        {partyBUseMessageTerms ? (
                          <p className="text-sm text-[#7a6b5a] italic">using message thread as terms</p>
                        ) : (
                          <p className="contract-body text-sm whitespace-pre-line">{partyBTerms || "no terms provided."}</p>
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
                            {partyAAgreedAt ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                                <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> accepted</Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#8a7a60]" />
                                <span className="text-xs text-[#8a7a60] uppercase tracking-wide">pending</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="contract-body font-medium">{contractPartyB?.fullName || PARTY_B.fullName}</span>
                            {partyBAgreedAt ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                                <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> accepted</Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#8a7a60]" />
                                <span className="text-xs text-[#8a7a60] uppercase tracking-wide">pending</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!iAgreed && (
                          <div className="mt-5 space-y-3">
                            <Button onClick={agree} className="w-full" style={{ background: '#1a0f08', color: '#f5e6c8', border: '1px solid #2c1810' }}>
                              <Check className="h-4 w-4 mr-2" /> I Accept These Terms
                            </Button>
                            <p className="text-center text-xs text-[#7a6b5a]">By clicking accept, you agree to be bound by both parties&apos; terms as shown above.</p>
                          </div>
                        )}
                        {iAgreed && !termsLocked && (
                          <div className="mt-5 text-center">
                            <p className="text-sm text-[#5a4a3a] font-medium">You have accepted these terms</p>
                            <p className="text-xs text-[#7a6b5a] mt-1">waiting for the other party to accept...</p>
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
                      {partyATerms && <p><strong>{PARTY_A.fullName}:</strong> {partyATerms}</p>}
                      {partyBTerms && <p><strong>{contractPartyB?.fullName || PARTY_B.fullName}:</strong> {partyBTerms}</p>}
                    </div>
                    <p className="text-xs text-emerald-700 mt-4 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Terms were locked on {new Date(termsLockedAt!).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Signatures */}
              {termsLocked && (
                <div className="contract-page p-6">
                  <h2 className="contract-heading text-xl mb-4 border-b border-[#d4b896] pb-2">2. Digital Signatures</h2>
                  <div className="space-y-4">
                    <SignatureRow name={PARTY_A.fullName} signed={!!partyASignedAt} signedAt={partyASignedAt} signatureText={partyASignature} />
                    <div className="border-t border-[#d4b896]" />
                    <SignatureRow name={contractPartyB?.fullName || PARTY_B.fullName} signed={!!partyBSignedAt} signedAt={partyBSignedAt} signatureText={partyBSignature} />
                  </div>
                  {canSign && (
                    <Button onClick={() => setShowSignModal(true)} className="w-full mt-4 print-hidden">
                      <FileText className="h-3.5 w-3.5 mr-2" /> Sign Contract
                    </Button>
                  )}
                  {iSigned && !bothSigned && (
                    <p className="text-center text-sm text-[#5a4a3a] mt-4 print-hidden">waiting for {otherParty.fullName} to sign...</p>
                  )}
                  {bothSigned && status !== "completed" && (
                    <p className="text-center text-sm text-emerald-700 mt-4">contract is active — both parties have digitally signed</p>
                  )}
                  {status === "completed" && (
                    <p className="text-center text-sm text-emerald-700 mt-4">contract complete — both parties fulfilled their obligations</p>
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
                      {aMarkedComplete ? <Badge variant="success">done</Badge> : <span className="text-xs text-[#8a7a60] uppercase tracking-wide">pending</span>}
                    </div>
                    <div className="border-t border-[#d4b896]" />
                    <div className="flex items-center justify-between py-3">
                      <span className="contract-body">{contractPartyB?.fullName || PARTY_B.fullName}</span>
                      {bMarkedComplete ? <Badge variant="success">done</Badge> : <span className="text-xs text-[#8a7a60] uppercase tracking-wide">pending</span>}
                    </div>
                  </div>
                  {!iMarkedComplete && (
                    <Button onClick={markComplete} className="w-full mt-4">Mark Complete</Button>
                  )}
                  {iMarkedComplete && !otherMarkedComplete && (
                    <p className="text-center text-sm text-[#5a4a3a] mt-4">waiting for the other party...</p>
                  )}
                  {iMarkedComplete && otherMarkedComplete && (
                    <p className="text-center text-sm text-emerald-700 mt-4">contract complete</p>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="contract-page p-5 print-hidden">
                <h2 className="contract-heading text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Messages
                </h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {contractMessages.length === 0 && <p className="text-xs text-[#8a7a60] text-center py-4">no messages yet.</p>}
                  {contractMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.senderId === profileId ? "flex-row-reverse" : ""}`}>
                      <Avatar src={null} name={msg.senderName} size="sm" />
                      <div className={`max-w-[75%] px-3 py-2 text-sm rounded ${msg.senderId === profileId ? "bg-[#f0dfc0] text-[#2c1810] border-l-2 border-[#b89a68]" : "bg-[#e8d5b8] text-[#2c1810] border border-[#d4b896]"}`}>
                        <p className="text-[10px] text-[#8a7a60] uppercase tracking-wider mb-1">{msg.senderName}</p>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="mt-3 flex gap-2 items-center">
                  <Input placeholder="type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="h-9 text-sm bg-[#f0dfc0] border-[#d4b896] text-[#2c1810] placeholder:text-[#8a7a60]" />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0"><Send className="h-4 w-4" /></Button>
                </form>
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
                <p className="text-xs text-[#5a4a3a] mt-1">You are about to sign a legally binding contract</p>
              </div>

              <div className="bg-[#f0dfc0] border border-[#d4b896] p-3 mb-4 text-xs text-[#5a4a3a]">
                <p className="font-medium mb-1">Contract Summary:</p>
                <p><strong>Need:</strong> {MOCK_NEED.title}</p>
                <p><strong>Party A:</strong> {PARTY_A.fullName}</p>
                <p><strong>Party B:</strong> {contractPartyB?.fullName || PARTY_B.fullName}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#5a4a3a] uppercase tracking-wider mb-1.5 block">
                    Type your full name as your signature
                  </label>
                  <Input
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    placeholder={`e.g. ${isPartyA ? PARTY_A.fullName : (contractPartyB?.fullName || PARTY_B.fullName)}`}
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
                  onClick={() => { sign(signatureInput.trim()); setShowSignModal(false); setSignatureInput(""); setAgreedToTermsCheck(false); }}
                  disabled={!signatureInput.trim() || !agreedToTermsCheck}
                  className="flex-1"
                  style={{ background: '#1a0f08', color: '#f5e6c8', border: '1px solid #2c1810' }}
                >
                  Sign Contract
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
