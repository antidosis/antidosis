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
import { ArrowLeft, Send, Check, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

type ContractData = {
  id: string;
  status: string;
  terms: string;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  aMarkedComplete: boolean;
  bMarkedComplete: boolean;
  completedAt: string | null;
  need: { id: string; title: string; description: string; offerType: string; offerDescription: string; poster: { fullName: string | null } };
  partyA: { id: string; fullName: string | null; avatarUrl: string | null; bio: string | null; ratingAvg: number; ratingCount: number; locationName: string | null; isVerified: boolean; skills: { id: string; name: string }[] };
  partyB: { id: string; fullName: string | null; avatarUrl: string | null; bio: string | null; ratingAvg: number; ratingCount: number; locationName: string | null; isVerified: boolean; skills: { id: string; name: string }[] };
  messages: { id: string; content: string; createdAt: string; sender: { id: string; fullName: string | null; avatarUrl: string | null } }[];
  reviews: { id: string; giverId: string; receiverId: string; rating: number; comment: string | null }[];
};

export default function ContractPage() {
  const params = useParams();
  const contractId = params.id as string;
  const supabase = createClient();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [terms, setTerms] = useState({ workLocation: "", reciprocationLocation: "", deadline: "", noticePeriod: "", notes: "" });
  const [messageInput, setMessageInput] = useState("");
  const [rating, setRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      fetchContract();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [contract?.messages]);

  useEffect(() => {
    if (!contractId) return;
    const channel = supabase.channel(`contract_messages:${contractId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `contract_id=eq.${contractId}` }, (payload) => {
        const newMessage = payload.new as any;
        setContract((prev) => {
          if (!prev || prev.messages.some((m) => m.id === newMessage.id)) return prev;
          return { ...prev, messages: [...prev.messages, { id: newMessage.id, content: newMessage.content, createdAt: newMessage.created_at, sender: { id: newMessage.sender_id, fullName: null, avatarUrl: null } }] };
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  async function fetchContract() {
    try {
      const res = await fetch(`/api/v1/contracts/${contractId}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setContract(data.contract);
      if (data.contract.terms) { try { const parsed = JSON.parse(data.contract.terms); setTerms({ workLocation: parsed.workLocation || "", reciprocationLocation: parsed.reciprocationLocation || "", deadline: parsed.deadline || "", noticePeriod: parsed.noticePeriod || "", notes: parsed.notes || "" }); } catch {} }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function saveTerms() {
    await fetch(`/api/v1/contracts/${contractId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ terms }) });
    fetchContract();
  }

  async function signContract() {
    await fetch(`/api/v1/contracts/${contractId}/sign`, { method: "POST" });
    fetchContract();
  }

  async function markComplete() {
    await fetch(`/api/v1/contracts/${contractId}/complete`, { method: "POST" });
    fetchContract();
  }

  async function cancelContract() {
    if (!confirm("cancel this contract? the need will be re-opened.")) return;
    await fetch(`/api/v1/contracts/${contractId}/cancel`, { method: "POST" });
    fetchContract();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    await fetch("/api/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contractId, content: messageInput }) });
    setMessageInput("");
    fetchContract();
  }

  async function submitReview() {
    if (!contract) return;
    const isPartyA = contract.partyA.id === userId;
    const receiverId = isPartyA ? contract.partyB.id : contract.partyA.id;
    await fetch("/api/v1/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contractId, receiverId, rating, comment: reviewComment }) });
    fetchContract();
    setReviewComment("");
  }

  if (loading) return <div className="max-w-3xl mx-auto py-24 text-center text-[#7a6b4a]">loading contract...</div>;
  if (!contract) return <div className="max-w-3xl mx-auto py-24 text-center text-[#c97c7c]">error: contract not found</div>;

  const isPartyA = contract.partyA.id === userId;
  const isPartyB = contract.partyB.id === userId;
  const otherParty = isPartyA ? contract.partyB : contract.partyA;
  const bothSigned = contract.partyASignedAt && contract.partyBSignedAt;
  const iSigned = isPartyA ? !!contract.partyASignedAt : !!contract.partyBSignedAt;
  const iMarkedComplete = isPartyA ? contract.aMarkedComplete : contract.bMarkedComplete;
  const otherMarkedComplete = isPartyA ? contract.bMarkedComplete : contract.aMarkedComplete;
  const hasReviewed = contract.reviews.some((r) => r.giverId === userId);

  const statusLabels: Record<string, string> = { draft: "draft", pending_terms: "pending_signatures", active: "active", pending_completion: "pending_completion", completed: "completed", cancelled: "cancelled" };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link href={`/needs/${contract.need.id}`} className="inline-flex items-center text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors"><ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/</Link>
      </div>

      <p className="text-[12px] text-[#7a6b4a] mb-4">$ cat contract_{contract.id.slice(0, 8)}.sh</p>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">{contract.need.title}</h1>
        <Badge variant="outline">{statusLabels[contract.status] || contract.status}</Badge>
      </div>
      <p className="text-[11px] text-[#7a6b4a] uppercase tracking-wide mb-10">contract #{contract.id.slice(0, 8)}</p>

      <div className="grid sm:grid-cols-2 gap-px bg-[#2a2a2a]">
        <PartySection party={contract.partyA} label="need_poster" isMe={isPartyA} />
        <PartySection party={contract.partyB} label="fulfiller" isMe={isPartyB} />
      </div>

      {(contract.status === "draft" || contract.status === "pending_terms") && (
        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">contract_terms</p>
          <div className="space-y-6 max-w-lg">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>work_location</Label><Input value={terms.workLocation} onChange={(e) => setTerms({ ...terms, workLocation: e.target.value })} /></div>
              <div className="space-y-2"><Label>reciprocation_location</Label><Input value={terms.reciprocationLocation} onChange={(e) => setTerms({ ...terms, reciprocationLocation: e.target.value })} /></div>
              <div className="space-y-2"><Label>deadline</Label><Input type="date" value={terms.deadline} onChange={(e) => setTerms({ ...terms, deadline: e.target.value })} /></div>
              <div className="space-y-2"><Label>notice_period_days</Label><Input type="number" value={terms.noticePeriod} onChange={(e) => setTerms({ ...terms, noticePeriod: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>notes</Label><Textarea value={terms.notes} onChange={(e) => setTerms({ ...terms, notes: e.target.value })} rows={3} /></div>
            <Button onClick={saveTerms}>$ update_terms</Button>
          </div>
        </div>
      )}

      {(contract.status === "draft" || contract.status === "pending_terms") && (
        <div className="mt-10 border border-[#2a2a2a] p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">signatures</p>
          <div className="space-y-4">
            <SignatureRow name={contract.partyA.fullName} signed={!!contract.partyASignedAt} />
            <div className="divider" />
            <SignatureRow name={contract.partyB.fullName} signed={!!contract.partyBSignedAt} />
            {!iSigned && <Button onClick={signContract} className="w-full mt-4">$ sign_contract</Button>}
            {iSigned && !bothSigned && <p className="text-center text-[13px] text-[#7a6b4a] mt-4">waiting for the other party...</p>}
            {bothSigned && <p className="text-center text-[13px] text-[#7cb87c] mt-4">contract is active</p>}
          </div>
        </div>
      )}

      {(contract.status === "active" || contract.status === "pending_completion") && (
        <div className="mt-10 border border-[#2a2a2a] p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">completion</p>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-3"><span className="text-[14px]">{contract.partyA.fullName || "party_a"}</span>{contract.aMarkedComplete ? <Badge variant="success">done</Badge> : <span className="text-[11px] text-[#7a6b4a] uppercase tracking-wide">pending</span>}</div>
            <div className="divider" />
            <div className="flex items-center justify-between py-3"><span className="text-[14px]">{contract.partyB.fullName || "party_b"}</span>{contract.bMarkedComplete ? <Badge variant="success">done</Badge> : <span className="text-[11px] text-[#7a6b4a] uppercase tracking-wide">pending</span>}</div>
          </div>
          {!iMarkedComplete && <Button onClick={markComplete} className="w-full mt-4">$ mark_complete</Button>}
          {iMarkedComplete && !otherMarkedComplete && <p className="text-center text-[13px] text-[#7a6b4a] mt-4">waiting for the other party...</p>}
          {iMarkedComplete && otherMarkedComplete && <p className="text-center text-[13px] text-[#7cb87c] mt-4">contract complete</p>}
        </div>
      )}

      {contract.status !== "completed" && (
        <div className="mt-10 border border-[#2a2a2a] p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">messages</p>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {contract.messages.length === 0 && <p className="text-[13px] text-[#7a6b4a]/50 text-center py-4">no messages yet</p>}
            {contract.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender.id === userId ? "flex-row-reverse" : ""}`}>
                <Avatar src={msg.sender.avatarUrl} name={msg.sender.fullName} size="sm" />
                <div className={`max-w-[70%] px-4 py-2.5 text-[13px] ${msg.sender.id === userId ? "bg-[#f5b800]/10 text-[#e8c97c] border border-[#f5b800]/20" : "bg-[#1a1a1a] text-[#7a6b4a] border border-[#2a2a2a]"}`}>
                  <p>{msg.content}</p>
                  <p className="text-[10px] text-[#7a6b4a]/50 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <Input placeholder="type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      )}

      {contract.status === "completed" && (
        <div className="mt-10 border border-[#2a2a2a] p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">reviews</p>
          <div className="space-y-6">
            {!hasReviewed && (
              <div className="space-y-4">
                <p className="text-[13px] text-[#7a6b4a]">rate {otherParty.fullName || "the other party"}</p>
                <div className="flex items-center gap-3">
                  <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="flex-1 accent-[#f5b800]" />
                  <span className="text-lg font-bold w-12 text-center">{rating}</span>
                </div>
                <Textarea placeholder="share your experience (optional)..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} />
                <Button onClick={submitReview} className="w-full">$ submit_review</Button>
              </div>
            )}
            {hasReviewed && <p className="text-center text-[13px] text-[#7a6b4a]">you have submitted your review</p>}
          </div>
        </div>
      )}

      {(contract.status === "draft" || contract.status === "pending_terms" || contract.status === "active") && (
        <div className="text-center py-12"><button onClick={cancelContract} className="text-[13px] text-[#7a6b4a]/50 hover:text-[#c97c7c] transition-colors">$ cancel_contract</button></div>
      )}
    </div>
  );
}

function PartySection({ party, label, isMe }: { party: ContractData["partyA"]; label: string; isMe: boolean }) {
  return (
    <div className="bg-[#0c0c0c] p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#7a6b4a]">{label}</span>
        {isMe && <span className="text-[10px] font-medium uppercase tracking-wider text-[#7a6b4a]/50">you</span>}
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/profile/${party.id}`}>
          <Avatar src={party.avatarUrl} name={party.fullName} size="md" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${party.id}`} className="font-medium truncate hover:text-[#f5b800] transition-colors">
              {party.fullName || "anonymous"}
            </Link>
            {party.isVerified && <Shield className="h-3.5 w-3.5 text-[#7cb87c]" />}
          </div>
          <div className="text-[11px] text-[#7a6b4a] mt-0.5">{party.ratingCount > 0 && <span>{party.ratingAvg.toFixed(1)} ★</span>}{party.locationName && <span className="ml-2">{party.locationName}</span>}</div>
        </div>
      </div>
      {party.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {party.skills.map((skill) => <span key={skill.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]/50">{skill.name}</span>)}
        </div>
      )}
    </div>
  );
}

function SignatureRow({ name, signed }: { name: string | null; signed: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px]">{name || "anonymous"}</span>
      {signed ? <Badge variant="success" className="gap-1"><Check className="h-3 w-3" />signed</Badge> : <span className="text-[11px] text-[#7a6b4a] uppercase tracking-wide">pending</span>}
    </div>
  );
}
