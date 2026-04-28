"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { MapPin, ArrowLeft, CircleDollarSign, Wrench, Package, Star, Shield, Briefcase, Globe, Check, X, Camera, Send, Pencil, Trash2, Calendar, Clock, MessageSquare, FileText } from "lucide-react";

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
  deadline: string | null;
  timeRange: string | null;
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
  const router = useRouter();
  const supabase = createClient();
  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [messages, setMessages] = useState<NeedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [confirmingContract, setConfirmingContract] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ type: "delete" | "contract"; acceptanceId?: string; userName?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const res = await fetch("/api/v1/profiles/me");
          if (res.ok) {
            const profile = await res.json();
            setProfileId(profile.id);
          }
        } catch { /* ignore */ }
      }
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
      }, () => {
        fetchMessages();
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

  function handleAuthRequired(action: string) {
    router.push(`/login?redirect=/needs/${needId}`);
  }

  function handleEmailNotVerified() {
    router.push(`/verify-email?redirect=/needs/${needId}`);
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) {
      handleAuthRequired("express interest");
      return;
    }
    setSubmittingOffer(true);
    const res = await fetch("/api/v1/acceptances", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
    if (res.ok) { setOfferMessage(""); fetchNeed(); }
    setSubmittingOffer(false);
  }

  async function handleAcceptance(id: string, status: "accepted" | "declined") {
    const res = await fetch(`/api/v1/acceptances/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
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
      handleAuthRequired("send message");
      return;
    }
    setSendingMessage(true);
    const res = await fetch(`/api/v1/needs/${needId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: messageInput }),
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

  if (loading) return <div className="py-24 text-center text-sm text-[#7a6b5a]">loading...</div>;
  if (!need) return <div className="py-24 text-center text-sm text-[#7a6b5a]">error: need not found</div>;

  const isPoster = need.poster.id === profileId;
  const myAcceptance = need.acceptances.find((a) => a.userId === profileId);
  const hasOffered = !!myAcceptance;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="py-6">
          <Link href="/needs" className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
          </Link>
        </div>

        <p className="text-xs text-[#7a6b5a] mb-4">$ cat need_{need.id.slice(0, 8)}.txt</p>

        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="heading-display text-2xl text-[#e8d5a3]">{need.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {need.requiredSkills.map((s) => <span key={s.id} className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded">{s.name}</span>)}
              <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                {need.isLocal ? <><MapPin className="h-3 w-3" />local</> : <><Globe className="h-3 w-3" />remote</>}
              </span>
              {need.deadline && (
                <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{new Date(need.deadline).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
              )}
              {need.timeRange && (
                <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />{need.timeRange}
                </span>
              )}
            </div>
            <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">{need.description}</p>

            {need.images.length > 0 && (
              <div className="pt-4">
                <h2 className="text-lg heading-display text-[#e8d5a3] mb-4 flex items-center gap-2"><Camera className="h-4 w-4" />Need Images</h2>
                <div className="flex flex-wrap gap-3">
                  {need.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-40 w-40 object-cover border border-[#2a2420] hover:border-[#f5a623] transition-colors cursor-pointer" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="vessel p-5">
            <h2 className="text-lg heading-display text-[#e8d5a3] mb-4">Offering in Exchange</h2>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-[#1a1714] text-[#7a6b5a]">
                {need.offerType === "money" ? <CircleDollarSign className="h-4 w-4" /> : need.offerType === "item" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-base font-medium text-[#e8d5a3]">{need.offerDescription}</p>
                {need.offerValue && <p className="text-sm text-[#b8a078] mt-1">estimated_value: ${need.offerValue.toLocaleString()}</p>}
              </div>
            </div>
            {need.offerImages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2a2420]">
                <h2 className="text-lg heading-display text-[#e8d5a3] mb-4 flex items-center gap-2"><Camera className="h-4 w-4" />Offer Images</h2>
                <div className="flex flex-wrap gap-3">
                  {need.offerImages.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-40 w-40 object-cover border border-[#2a2420] hover:border-[#f5a623] transition-colors cursor-pointer" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="divider my-12" />

        {/* Poster Card */}
        <div className="vessel p-5 flex items-start gap-5">
          <Link href={`/profile/${need.poster.id}`}>
            <Avatar src={need.poster.avatarUrl} name={need.poster.fullName} size="lg" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${need.poster.id}`} className="text-lg heading-display text-[#e8d5a3] hover:text-[#f5a623] transition-colors">
                {need.poster.fullName || "anonymous"}
              </Link>
              {need.poster.isVerified && <Shield className="h-4 w-4 text-[#00e676]" />}
              {need.poster.isPro && <Badge variant="default">pro</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#b8a078] mt-1">
              {need.poster.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{need.poster.ratingAvg.toFixed(1)}</span>}
              {need.poster.jobsCompleted > 0 && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{need.poster.jobsCompleted}</span>}
              {need.poster.locationName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{need.poster.locationName}</span>}
            </div>
            {need.poster.bio && <p className="text-sm text-[#b8a078] mt-4 leading-relaxed">{need.poster.bio}</p>}
            {need.poster.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {need.poster.skills.map((s) => <span key={s.id} className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded">{s.name}{s.isVerified && " ✓"}</span>)}
              </div>
            )}
            {profileId && need.poster.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-5">
                {need.poster.socialLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b8a078] hover:text-[#e8d5a3] transition-colors capitalize">{link.platform}</a>)}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread — auth only */}
        {profileId && need.status === "open" && (
          <div className="mt-10 vessel p-6">
            <h2 className="text-lg heading-display text-[#e8d5a3] mb-6 flex items-center gap-2"><MessageSquare className="h-4 w-4" />Messages</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {messages.length === 0 && <p className="text-sm text-[#7a6b5a] text-center py-4">no messages yet. be the first to reach out.</p>}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender.id === profileId ? "flex-row-reverse" : ""}`}>
                  <Link href={`/profile/${msg.sender.id}`}>
                    <Avatar src={msg.sender.avatarUrl} name={msg.sender.fullName} size="sm" />
                  </Link>
                  <div className={`max-w-[70%] px-4 py-2.5 text-sm ${msg.sender.id === profileId ? "bg-[#1a1714] border-l-2 border-l-[#f5a623] text-[#e8d5a3]" : "bg-[#12100e] border border-[#2a2420] text-[#b8a078]"}`}>
                    <Link href={`/profile/${msg.sender.id}`} className="text-xs font-medium uppercase tracking-wide text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors block mb-1">
                      {msg.sender.fullName || "anonymous"}
                    </Link>
                    <p>{msg.content}</p>
                    <p className="text-xs text-[#7a6b5a] mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2 items-center">
              <Input placeholder="ask a question or introduce yourself..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} disabled={sendingMessage} className="h-10" />
              <Button type="submit" size="icon" disabled={sendingMessage} className="h-10 w-10 shrink-0"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        )}

        {/* Auth prompt for unauth users */}
        {!profileId && need.status === "open" && (
          <div className="mt-10 bg-[#f5a623]/10 border border-[#f5a623]/30 p-6">
            <p className="text-sm text-[#e8d5a3] mb-3">
              want to message the poster or express your interest?
            </p>
            <p className="text-sm text-[#b8a078]">
              <Button variant="link" className="p-0 h-auto text-[#f5a623] hover:underline" onClick={() => handleAuthRequired("interact")}>log in</Button>
              {" "}or{" "}
              <Button variant="link" className="p-0 h-auto text-[#f5a623] hover:underline" onClick={() => handleAuthRequired("interact")}>create an account</Button>
              {" "}to get started. verified accounts can message, express interest, and view full profiles.
            </p>
          </div>
        )}

        {isPoster && need.status === "open" && (
          <div className="flex items-center gap-3 mt-8">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/needs/${need.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" /> edit</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDialog({ type: "delete" })} className="text-[#7a6b5a] hover:text-[#ff5252]">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> delete
            </Button>
          </div>
        )}

        {need.contract && need.contract.status !== "cancelled" && (
          <div className="mt-10 bg-[#00e676]/10 border border-[#00e676]/30 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#00e676]">a contract has been formed</p>
              <Badge variant="success" className="mt-1 capitalize">{need.contract.status}</Badge>
            </div>
            <Button size="sm" variant="default" asChild><Link href={`/contracts/${need.contract.id}`}>View Contract</Link></Button>
          </div>
        )}

        {/* Offer form for non-poster */}
        {!isPoster && need.status === "open" && !hasOffered && (
          <div className="mt-10 vessel p-6">
            <h2 className="text-lg heading-display text-[#e8d5a3] mb-4">Express Interest</h2>
            {profileId ? (
              <form onSubmit={submitOffer} className="space-y-4">
                <Textarea placeholder="introduce yourself and explain why you're a good fit..." value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} rows={3} />
                <Button type="submit" variant="default" disabled={submittingOffer}>{submittingOffer ? "submitting..." : "Submit Interest"}</Button>
              </form>
            ) : (
              <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 p-5">
                <p className="text-sm text-[#e8d5a3]">
                  <Button variant="link" className="p-0 h-auto text-[#f5a623] hover:underline" onClick={() => handleAuthRequired("express interest")}>log in</Button>
                  {" "}or{" "}
                  <Button variant="link" className="p-0 h-auto text-[#f5a623] hover:underline" onClick={() => handleAuthRequired("express interest")}>create an account</Button>
                  {" "}to express your interest in this need.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fulfiller status when they've already offered */}
        {!isPoster && myAcceptance && need.status === "open" && (
          <div className="mt-10 vessel p-6">
            <h2 className="text-lg heading-display text-[#e8d5a3] mb-4">Your Interest</h2>
            {myAcceptance.status === "pending" && (
              <div className="flex items-center gap-2 text-[#7a6b5a]">
                <Clock className="h-4 w-4" />
                <p className="text-sm">your interest is pending review by the poster.</p>
              </div>
            )}
            {myAcceptance.status === "accepted" && (
              <div className="flex items-center gap-2 text-[#00e676]">
                <Check className="h-4 w-4" />
                <p className="text-sm">the poster has accepted your interest — ready to form contract.</p>
              </div>
            )}
            {myAcceptance.status === "declined" && (
              <div className="flex items-center gap-2 text-[#ff5252]">
                <X className="h-4 w-4" />
                <p className="text-sm">your interest was declined.</p>
              </div>
            )}
            {myAcceptance.message && (
              <div className="mt-4 bg-[#1a1714] p-4 border border-[#2a2420]">
                <p className="text-xs text-[#7a6b5a] uppercase tracking-wide mb-2">Your Message</p>
                <p className="text-sm text-[#b8a078]">{myAcceptance.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Need poster — Offers list */}
        {(() => {
          const visibleAcceptances = need.acceptances.filter(a => a.status === "pending" || a.status === "accepted");
          return isPoster && (need.status === "open" || need.status === "negotiating") && visibleAcceptances.length > 0 && (
          <div className="mt-10 vessel p-5">
            <h2 className="text-lg heading-display text-[#e8d5a3] mb-6">Interested ({visibleAcceptances.length})</h2>
            {visibleAcceptances.map((a, i) => (
              <div key={a.id}>
                <div className={`p-4 ${a.status === "accepted" ? "border border-[#00e676]/20 bg-[#00e676]/5 rounded" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${a.user.id}`}>
                        <Avatar src={a.user.avatarUrl} name={a.user.fullName} size="md" />
                      </Link>
                      <div>
                        <Link href={`/profile/${a.user.id}`} className="font-medium hover:text-[#f5a623] transition-colors block text-[#e8d5a3]">
                          {a.user.fullName || "anonymous"}
                        </Link>
                        <p className="text-xs text-[#7a6b5a]">{a.user.ratingAvg > 0 && `${a.user.ratingAvg.toFixed(1)} ★ `}{a.user.skills.map((s) => s.name).join(", ")}</p>
                      </div>
                    </div>
                    {a.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/profile/${a.user.id}`}><FileText className="h-3.5 w-3.5 mr-1" />profile</Link>
                        </Button>
                        <Button size="sm" variant="default" onClick={() => handleAcceptance(a.id, "accepted")}><Check className="h-3.5 w-3.5 mr-1" />accept</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleAcceptance(a.id, "declined")}><X className="h-3.5 w-3.5 mr-1" />decline</Button>
                      </div>
                    )}
                    {a.status === "accepted" && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/profile/${a.user.id}`}><FileText className="h-3.5 w-3.5 mr-1" />profile</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setConfirmDialog({ type: "contract", acceptanceId: a.id, userName: a.user.fullName || "this user" })}
                          disabled={confirmingContract === a.id}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          {confirmingContract === a.id ? "forming..." : "form contract"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleAcceptance(a.id, "declined")}><X className="h-3.5 w-3.5 mr-1" />decline</Button>
                      </div>
                    )}
                  </div>
                  {a.message && <p className="text-sm text-[#b8a078] mt-4 bg-[#1a1714] p-4 border border-[#2a2420]">{a.message}</p>}
                  {a.status === "accepted" && (
                    <p className="text-xs text-[#00e676] mt-3 flex items-center gap-1">
                      <Check className="h-3 w-3" /> interest accepted — ready to form contract
                    </p>
                  )}
                </div>
                {i < visibleAcceptances.length - 1 && <div className="divider" />}
              </div>
            ))}
          </div>
          );
        })()}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0806]/80 p-4">
          <div className="vessel p-6 max-w-sm w-full">
            <p className="text-base font-medium text-[#e8d5a3] mb-6">
              {confirmDialog.type === "delete"
                ? "Delete this need? This cannot be undone."
                : `Form a contract with ${confirmDialog.userName}? This will decline all other interested parties.`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button size="sm" variant="default" onClick={executeConfirm}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
