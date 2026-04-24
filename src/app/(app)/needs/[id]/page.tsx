"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { MapPin, ArrowLeft, CircleDollarSign, Wrench, Package, Star, Shield, Briefcase, Globe, Check, X, Camera, Send } from "lucide-react";

export const dynamic = "force-dynamic";

type NeedDetail = {
  id: string;
  title: string;
  description: string;
  offerType: string;
  offerDescription: string;
  offerValue: number | null;
  isLocal: boolean;
  locationName: string | null;
  status: string;
  images: string[];
  offerImages: string[];
  poster: {
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
  requiredSkills: { id: string; name: string }[];
  acceptances: {
    id: string;
    userId: string;
    message: string | null;
    status: string;
    user: {
      id: string;
      fullName: string | null;
      avatarUrl: string | null;
      ratingAvg: number;
      skills: { id: string; name: string }[];
    };
  }[];
  contract: { id: string; status: string } | null;
};

type NeedMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export default function NeedDetailPage() {
  const params = useParams();
  const needId = params.id as string;
  const supabase = createClient();
  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [messages, setMessages] = useState<NeedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      await fetchNeed();
      await fetchMessages();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!needId) return;
    const channel = supabase.channel(`need_messages:${needId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "need_messages",
        filter: `need_id=eq.${needId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            createdAt: newMsg.created_at,
            sender: { id: newMsg.sender_id, fullName: null, avatarUrl: null },
          }];
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needId]);

  async function fetchNeed() {
    const res = await fetch(`/api/v1/needs/${needId}`);
    if (res.ok) { const data = await res.json(); setNeed(data.need); }
    setLoading(false);
  }

  async function fetchMessages() {
    const res = await fetch(`/api/v1/needs/${needId}/messages`);
    if (res.ok) { const data = await res.json(); setMessages(data.messages); }
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingOffer(true);
    const res = await fetch("/api/v1/acceptances", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needId, message: offerMessage }),
    });
    if (res.ok) { setOfferMessage(""); fetchNeed(); }
    setSubmittingOffer(false);
  }

  async function handleAcceptance(id: string, status: "accepted" | "declined") {
    await fetch(`/api/v1/acceptances/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchNeed();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setSendingMessage(true);
    const res = await fetch(`/api/v1/needs/${needId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: messageInput }),
    });
    if (res.ok) {
      setMessageInput("");
      fetchMessages();
    }
    setSendingMessage(false);
  }

  if (loading) return <div className="py-24 text-center text-[#7a6b4a]">loading...</div>;
  if (!need) return <div className="py-24 text-center text-[#7a6b4a]">error: need not found</div>;

  const isPoster = need.poster.id === userId;
  const hasOffered = need.acceptances.some((a) => a.userId === userId && a.status === "pending");

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link href="/needs" className="inline-flex items-center text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
        </Link>
      </div>

      <p className="text-[12px] text-[#7a6b4a] mb-4">$ cat need_{need.id.slice(0, 8)}.txt</p>

      <div className="space-y-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {need.requiredSkills.map((s) => <span key={s.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]">{s.name}</span>)}
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a] flex items-center gap-1">
              {need.isLocal ? <><MapPin className="h-3 w-3" />local</> : <><Globe className="h-3 w-3" />remote</>}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{need.title}</h1>
          <p className="text-[15px] text-[#7a6b4a] leading-relaxed whitespace-pre-line">{need.description}</p>

          {need.images.length > 0 && (
            <div className="pt-4">
              <p className="text-[11px] text-[#7a6b4a] uppercase tracking-wide mb-3 flex items-center gap-2"><Camera className="h-3 w-3" />need_images</p>
              <div className="flex flex-wrap gap-3">
                {need.images.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-32 w-32 object-cover border border-[#2a2a2a] hover:border-[#f5b800] transition-colors cursor-pointer" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border border-[#2a2a2a] p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-4">offering_in_exchange</p>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 bg-[#1a1a1a] text-[#7a6b4a]">
              {need.offerType === "money" ? <CircleDollarSign className="h-4 w-4" /> : need.offerType === "item" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-medium">{need.offerDescription}</p>
              {need.offerValue && <p className="text-[13px] text-[#7a6b4a] mt-1">estimated_value: ${need.offerValue.toLocaleString()}</p>}
            </div>
          </div>
          {need.offerImages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              <p className="text-[11px] text-[#7a6b4a] uppercase tracking-wide mb-3 flex items-center gap-2"><Camera className="h-3 w-3" />offer_images</p>
              <div className="flex flex-wrap gap-3">
                {need.offerImages.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-32 w-32 object-cover border border-[#2a2a2a] hover:border-[#f5b800] transition-colors cursor-pointer" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divider my-12" />

      {/* Poster Card */}
      <div className="flex items-start gap-5">
        <Link href={`/profile/${need.poster.id}`}>
          <Avatar src={need.poster.avatarUrl} name={need.poster.fullName} size="lg" className="h-14 w-14" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${need.poster.id}`} className="text-lg font-semibold hover:text-[#f5b800] transition-colors">
              {need.poster.fullName || "anonymous"}
            </Link>
            {need.poster.isVerified && <Shield className="h-4 w-4 text-[#7cb87c]" />}
            {need.poster.isPro && <Badge variant="default" className="text-[10px]">pro</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#7a6b4a] mt-1">
            {need.poster.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{need.poster.ratingAvg.toFixed(1)}</span>}
            {need.poster.jobsCompleted > 0 && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{need.poster.jobsCompleted}</span>}
            {need.poster.locationName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{need.poster.locationName}</span>}
          </div>
          {need.poster.bio && <p className="text-[13px] text-[#7a6b4a] mt-4 leading-relaxed">{need.poster.bio}</p>}
          {need.poster.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {need.poster.skills.map((s) => <span key={s.id} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2a2a] text-[#7a6b4a]">{s.name}{s.isVerified && " ✓"}</span>)}
            </div>
          )}
          {need.poster.socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-5">
              {need.poster.socialLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#7a6b4a]/50 hover:text-[#e8c97c] transition-colors capitalize">{link.platform}</a>)}
            </div>
          )}
        </div>
      </div>

      {/* Message Thread */}
      {need.status === "open" && (
        <div className="mt-10 border border-[#2a2a2a] p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">messages</p>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {messages.length === 0 && <p className="text-[13px] text-[#7a6b4a]/50 text-center py-4">no messages yet. be the first to reach out.</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender.id === userId ? "flex-row-reverse" : ""}`}>
                <Link href={`/profile/${msg.sender.id}`}>
                  <Avatar src={msg.sender.avatarUrl} name={msg.sender.fullName} size="sm" />
                </Link>
                <div className={`max-w-[70%] px-4 py-2.5 text-[13px] ${msg.sender.id === userId ? "bg-[#f5b800]/10 text-[#e8c97c] border border-[#f5b800]/20" : "bg-[#1a1a1a] text-[#7a6b4a] border border-[#2a2a2a]"}`}>
                  <Link href={`/profile/${msg.sender.id}`} className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a]/70 hover:text-[#e8c97c] transition-colors block mb-1">
                    {msg.sender.fullName || "anonymous"}
                  </Link>
                  <p>{msg.content}</p>
                  <p className="text-[10px] text-[#7a6b4a]/50 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {userId ? (
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <Input placeholder="ask a question or introduce yourself..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} disabled={sendingMessage} />
              <Button type="submit" size="icon" disabled={sendingMessage}><Send className="h-4 w-4" /></Button>
            </form>
          ) : (
            <p className="mt-4 text-[13px] text-[#7a6b4a]/50 text-center">
              <Link href="/login" className="text-[#e8c97c] hover:underline">login</Link> to send a message
            </p>
          )}
        </div>
      )}

      {need.contract && (
        <div className="mt-10 border border-[#7cb87c]/20 bg-[#7cb87c]/5 p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-[#7cb87c]">a contract has been formed</p>
            <p className="text-[13px] text-[#7a6b4a]">status: {need.contract.status}</p>
          </div>
          <Button size="sm" asChild><Link href={`/contracts/${need.contract.id}`}>$ view_contract</Link></Button>
        </div>
      )}

      {!isPoster && need.status === "open" && !hasOffered && !need.contract && (
        <div className="mt-10 border border-[#2a2a2a] p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-4">offer_to_help</p>
          <form onSubmit={submitOffer} className="space-y-4">
            <Textarea placeholder="introduce yourself and explain why you're a good fit..." value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} rows={3} />
            <Button type="submit" disabled={submittingOffer}>{submittingOffer ? "submitting..." : "$ submit_offer"}</Button>
          </form>
        </div>
      )}

      {isPoster && need.status === "open" && need.acceptances.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b4a] mb-6">offers ({need.acceptances.length})</p>
          {need.acceptances.map((a, i) => (
            <div key={a.id}>
              <div className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${a.user.id}`}>
                      <Avatar src={a.user.avatarUrl} name={a.user.fullName} size="md" />
                    </Link>
                    <div>
                      <Link href={`/profile/${a.user.id}`} className="font-medium hover:text-[#f5b800] transition-colors block">
                        {a.user.fullName || "anonymous"}
                      </Link>
                      <p className="text-[11px] text-[#7a6b4a]">{a.user.ratingAvg > 0 && `${a.user.ratingAvg.toFixed(1)} ★ `}{a.user.skills.map((s) => s.name).join(", ")}</p>
                    </div>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptance(a.id, "accepted")}><Check className="h-3.5 w-3.5 mr-1" />accept</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAcceptance(a.id, "declined")}><X className="h-3.5 w-3.5 mr-1" />decline</Button>
                    </div>
                  )}
                  {a.status === "accepted" && <Badge variant="success">accepted</Badge>}
                </div>
                {a.message && <p className="text-[13px] text-[#7a6b4a] mt-4 bg-[#1a1a1a] p-4 border border-[#2a2a2a]">{a.message}</p>}
              </div>
              {i < need.acceptances.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
