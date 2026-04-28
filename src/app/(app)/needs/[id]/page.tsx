"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  MapPin, ArrowLeft, CircleDollarSign, Wrench, Package, Star,
  Shield, Briefcase, Globe, Check, X, Camera, Send, Pencil,
  Trash2, Calendar, Clock, MessageSquare, FileText, ExternalLink,
  Handshake, ChevronDown, ChevronUp, Lock, Award, FileCheck, Loader2, Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Poster = {
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
  poster: Poster;
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
  contracts: { id: string; status: string }[];
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

type Credential = {
  id: string;
  title: string;
  type: string;
  documentNumber: string | null;
  description: string | null;
  issuedBy: string | null;
  expiresAt: string | null;
  isVerified: boolean;
  fileUrl: string | null;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NeedDetailPage() {
  const params = useParams();
  const needId = params.id as string;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* -- init -- */
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
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needId]);

  /* -- lazy credentials -- */
  const fetchCredentials = useCallback(async (posterId: string) => {
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
  }, [credentials.length, credLoading]);

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

  async function handleAcceptance(id: string, status: "accepted" | "declined") {
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
  const canInteract = need.status === "open"; // Anyone (including poster) can interact with messages/actions section
  const canExpressInterest = need.status === "open" && !isPoster;

  const offerIcon =
    need.offerType === "money" ? (
      <CircleDollarSign className="h-4 w-4 text-[#f5a623]" />
    ) : need.offerType === "item" ? (
      <Package className="h-4 w-4 text-[#00e5ff]" />
    ) : (
      <Wrench className="h-4 w-4 text-[#00e676]" />
    );

  const descTooLong = need.description.length > 500;
  const displayDesc = descTooLong && !descExpanded
    ? need.description.slice(0, 500) + "..."
    : need.description;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
        {/* ========== HEADER ========== */}
        <div className="pt-6 pb-2">
          <Link
            href="/needs"
            className="inline-flex items-center text-xs text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            browse needs
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">
            {need.title}
          </h1>
          {need.status !== "open" && (
            <Badge
              variant={
                need.status === "completed"
                  ? "success"
                  : need.status === "cancelled"
                  ? "destructive"
                  : "warning"
              }
              className="mt-1.5 capitalize"
            >
              {need.status}
            </Badge>
          )}
        </div>

        {/* ========== META STRIP ========== */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {need.requiredSkills.map((s) => (
            <span
              key={s.id}
              className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded"
            >
              {s.name}
            </span>
          ))}
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
            <MapPin className="h-3 w-3" /> local
          </span>
          {need.deadline && (
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(need.deadline).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {need.timeRange && (
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {need.timeRange}
            </span>
          )}
        </div>

        {/* ========== DESCRIPTION ========== */}
        <div className="mb-6">
          <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">
            {displayDesc}
          </p>
          {descTooLong && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs text-[#f5a623] hover:underline mt-2"
            >
              {descExpanded ? "show less" : "show more"}
            </button>
          )}
        </div>

        {/* ========== TRIAL NOTICE ========== */}
        <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-3 mb-6">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-[#00e5ff] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#7a6b5a]">Central Coast NSW trial region — all needs are local during the pilot.</p>
          </div>
        </div>

        {/* ========== IMAGES ========== */}
        {need.images.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-3.5 w-3.5 text-[#7a6b5a]" />
              <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
                need images
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
              {need.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="h-28 w-28 md:h-32 md:w-32 object-cover border border-[#2a2420] hover:border-[#f5a623] transition-colors cursor-pointer shrink-0 snap-start"
                />
              ))}
            </div>
          </div>
        )}

        {/* ========== EXCHANGE (compact) ========== */}
        <div className="vessel p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {offerIcon}
            <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
              offering in exchange
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-[#e8d5a3]">
              {need.offerDescription}
            </p>
            {need.offerValue && (
              <span className="text-xs text-[#b8a078]">
                est. ${need.offerValue.toLocaleString()}
              </span>
            )}
          </div>
          {need.offerImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1 snap-x">
              {need.offerImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="h-20 w-20 object-cover border border-[#2a2420] hover:border-[#f5a623] transition-colors cursor-pointer shrink-0 snap-start"
                />
              ))}
            </div>
          )}
        </div>

        {/* ========== POSTER PROFILE (collapsible) ========== */}
        <div className="vessel p-4 mb-6">
          {/* Collapsed header */}
          <div className="flex items-center gap-3">
            <Avatar
              src={need.poster.avatarUrl}
              name={need.poster.fullName}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-medium text-[#e8d5a3]">
                  {need.poster.fullName || "anonymous"}
                </span>
                {need.poster.isVerified && (
                  <Shield className="h-4 w-4 text-[#00e676]" />
                )}
                {profileId && need.poster.isPro && (
                  <Badge variant="default" className="text-[10px]">pro</Badge>
                )}
              </div>
              {profileId ? (
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#7a6b5a] mt-0.5">
                  {need.poster.ratingCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-[#f5a623]" />
                      {need.poster.ratingAvg.toFixed(1)}
                      <span className="text-[#7a6b5a]/60">
                        ({need.poster.ratingCount})
                      </span>
                    </span>
                  )}
                  {need.poster.jobsCompleted > 0 && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {need.poster.jobsCompleted}
                    </span>
                  )}
                  {need.poster.locationName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {need.poster.locationName}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#7a6b5a] mt-0.5">
                  log in to see full profile
                </p>
              )}
            </div>
            {profileId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[#7a6b5a] hover:text-[#e8d5a3]"
                onClick={() => setProfileExpanded(!profileExpanded)}
              >
                {profileExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Expanded content */}
          {profileId && profileExpanded && (
            <div className="mt-4 pt-4 border-t border-[#2a2420] space-y-4">
              {need.poster.bio && (
                <p className="text-sm text-[#b8a078] leading-relaxed">
                  {need.poster.bio}
                </p>
              )}

              {need.poster.skills.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-2">
                    skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {need.poster.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded"
                      >
                        {s.name}
                        {s.isVerified && (
                          <span className="text-[#00e676] ml-0.5">✓</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {need.poster.socialLinks.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-2">
                    links
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {need.poster.socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#b8a078] hover:text-[#e8d5a3] transition-colors capitalize flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {link.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Credentials (lazy loaded) */}
              <div>
                <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-2">
                  credentials
                </p>
                {credLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#7a6b5a]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    loading...
                  </div>
                ) : credentials.length === 0 ? (
                  <p className="text-xs text-[#7a6b5a]">
                    no public credentials
                  </p>
                ) : (
                  <div className="space-y-2">
                    {credentials.map((cred) => (
                      <div
                        key={cred.id}
                        className="bg-[#1a1714] border border-[#2a2420] p-3 rounded"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Award className="h-3.5 w-3.5 text-[#f5a623]" />
                          <span className="text-sm font-medium text-[#e8d5a3]">
                            {cred.title}
                          </span>
                          <span className="px-1.5 py-0 text-[9px] uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a]">
                            {cred.type}
                          </span>
                          {cred.isVerified && (
                            <Shield className="h-3 w-3 text-[#00e676]" />
                          )}
                        </div>
                        <div className="text-xs text-[#7a6b5a] mt-1 space-y-0.5">
                          {cred.issuedBy && <p>issued by: {cred.issuedBy}</p>}
                          {cred.expiresAt && (
                            <p>
                              expires:{" "}
                              {new Date(cred.expiresAt).toLocaleDateString(
                                "en-AU",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </p>
                          )}
                          {cred.fileUrl && (
                            <a
                              href={cred.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#f5a623] hover:underline inline-flex items-center gap-1"
                            >
                              <FileCheck className="h-3 w-3" /> view document
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/profile/${need.poster.id}`}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    open full profile
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Guest lock */}
          {!profileId && (
            <div className="mt-3 bg-[#1a1714] border border-[#2a2420] p-3 rounded">
              <div className="flex items-center gap-2 text-[#7a6b5a]">
                <Lock className="h-3.5 w-3.5" />
                <p className="text-xs">
                  profile details are only visible to registered users
                </p>
              </div>
              <p className="text-xs text-[#b8a078] mt-1.5">
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#f5a623] hover:underline text-xs"
                  onClick={() => handleAuthRequired(false)}
                >
                  log in
                </Button>
                {" or "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#f5a623] hover:underline text-xs"
                  onClick={() => handleAuthRequired(true)}
                >
                  create an account
                </Button>
                {" to see the poster's full profile, skills, and qualifications."}
              </p>
            </div>
          )}
        </div>

        {/* ========== CONTRACT BANNERS ========== */}
        {need.contracts.length > 0 && (
          <div className="mb-6 space-y-2">
            {need.contracts.map((c) => (
              <div
                key={c.id}
                className="bg-[#00e676]/5 border-l-2 border-[#00e676] p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[#00e676]">
                    contract formed
                  </p>
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
        {(canInteract || canExpressInterest || messages.length > 0 || isPoster) && (
          <div className="space-y-4 mb-6">
            {/* Action bar — non-poster only */}
            {canExpressInterest && !hasOffered && (
              <div className="flex flex-wrap gap-2">
                {profileId ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowInterestForm(!showInterestForm)}
                    >
                      <Handshake className="h-4 w-4 mr-1.5" />
                      {showInterestForm ? "Cancel" : "Express Interest"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={scrollToMessages}
                    >
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      Message
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAuthRequired(false)}
                  >
                    <Lock className="h-4 w-4 mr-1.5" />
                    Log in to Interact
                  </Button>
                )}
              </div>
            )}

            {/* Interest form — non-poster only */}
            {canExpressInterest && showInterestForm && profileId && !hasOffered && (
              <div className="vessel p-4">
                <p className="text-xs text-[#7a6b5a] mb-3">
                  tell the poster why you are a good fit. you can also message
                  them below to ask questions first.
                </p>
                <form onSubmit={submitOffer} className="space-y-3">
                  <div>
                    <Textarea
                      placeholder="introduce yourself..."
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      rows={3}
                      className="text-sm"
                      maxLength={1000}
                    />
                    <p className="text-xs text-[#7a6b5a] mt-1 text-right">
                      {offerMessage.length}/1000
                    </p>
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={submittingOffer}
                  >
                    {submittingOffer ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        submitting...
                      </>
                    ) : (
                      "Submit Interest"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Interest status — non-poster only */}
            {canExpressInterest && myAcceptance && (
              <div
                className={`p-3 rounded border ${
                  myAcceptance.status === "accepted"
                    ? "bg-[#00e676]/5 border-[#00e676]/30"
                    : myAcceptance.status === "declined"
                    ? "bg-[#ff5252]/5 border-[#ff5252]/30"
                    : "bg-[#1a1714] border-[#2a2420]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {myAcceptance.status === "pending" && (
                    <Clock className="h-4 w-4 text-[#7a6b5a]" />
                  )}
                  {myAcceptance.status === "accepted" && (
                    <Check className="h-4 w-4 text-[#00e676]" />
                  )}
                  {myAcceptance.status === "declined" && (
                    <X className="h-4 w-4 text-[#ff5252]" />
                  )}
                  <p
                    className={`text-sm ${
                      myAcceptance.status === "accepted"
                        ? "text-[#00e676]"
                        : myAcceptance.status === "declined"
                        ? "text-[#ff5252]"
                        : "text-[#7a6b5a]"
                    }`}
                  >
                    {myAcceptance.status === "pending" &&
                      "your interest is pending review"}
                    {myAcceptance.status === "accepted" &&
                      "poster accepted — ready to form contract"}
                    {myAcceptance.status === "declined" &&
                      "your interest was declined"}
                  </p>
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

            {/* Message thread */}
            {profileId ? (
              <div ref={messagesRef} className="vessel p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-3.5 w-3.5 text-[#7a6b5a]" />
                  <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
                    messages
                  </span>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {messages.length === 0 && (
                    <p className="text-xs text-[#7a6b5a] text-center py-4">
                      no messages yet. be the first to reach out.
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.sender.id === profileId ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar
                        src={msg.sender.avatarUrl}
                        name={msg.sender.fullName}
                        size="sm"
                      />
                      <div
                        className={`max-w-[75%] px-3 py-2 text-sm rounded ${
                          msg.sender.id === profileId
                            ? "bg-[#1a1714] text-[#e8d5a3] border-l-2 border-[#f5a623]"
                            : "bg-[#12100e] text-[#b8a078] border border-[#2a2420]"
                        }`}
                      >
                        <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-1">
                          {msg.sender.fullName || "anonymous"}
                        </p>
                        <p>{msg.content}</p>
                        <p className="text-[10px] text-[#7a6b5a] mt-1">
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

                <form
                  onSubmit={sendMessage}
                  className="mt-3 flex gap-2 items-center"
                >
                  <Input
                    placeholder="ask a question..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sendingMessage}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sendingMessage}
                    className="h-9 w-9 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="bg-[#f5a623]/5 border border-[#f5a623]/20 p-4 rounded">
                <p className="text-sm text-[#e8d5a3] mb-2">
                  want to message the poster?
                </p>
                <p className="text-xs text-[#b8a078]">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#f5a623] hover:underline text-xs"
                    onClick={() => handleAuthRequired(false)}
                  >
                    log in
                  </Button>
                  {" or "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#f5a623] hover:underline text-xs"
                    onClick={() => handleAuthRequired(true)}
                  >
                    create an account
                  </Button>
                  {" to send messages and negotiate."}
                </p>
              </div>
            )}
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
        {(() => {
          const visible = need.acceptances.filter(
            (a) => a.status === "pending" || a.status === "accepted"
          );
          return (
            isPoster &&
            (need.status === "open" || need.status === "negotiating") &&
            visible.length > 0 && (
              <div className="vessel p-4">
                <h2 className="text-sm font-medium text-[#e8d5a3] mb-4">
                  Interested ({visible.length})
                </h2>
                <div className="space-y-3">
                  {visible.map((a) => (
                    <div
                      key={a.id}
                      className={`p-3 rounded ${
                        a.status === "accepted"
                          ? "border border-[#00e676]/20 bg-[#00e676]/5"
                          : "bg-[#1a1714] border border-[#2a2420]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={a.user.avatarUrl}
                            name={a.user.fullName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link href={`/profile/${a.user.id}`} className="text-sm font-medium text-[#e8d5a3] truncate hover:underline">
                              {a.user.fullName || "anonymous"}
                            </Link>
                            <p className="text-[10px] text-[#7a6b5a]">
                              {a.user.ratingAvg > 0 &&
                                `${a.user.ratingAvg.toFixed(1)} ★ `}
                              {a.user.skills.map((s) => s.name).join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          {a.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  handleAcceptance(a.id, "accepted")
                                }
                              >
                                <Check className="h-3 w-3 mr-1" />
                                accept
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  handleAcceptance(a.id, "declined")
                                }
                              >
                                <X className="h-3 w-3 mr-1" />
                                decline
                              </Button>
                            </>
                          )}
                          {a.status === "accepted" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  setConfirmDialog({
                                    type: "contract",
                                    acceptanceId: a.id,
                                    userName: a.user.fullName || "this user",
                                  })
                                }
                                disabled={confirmingContract === a.id}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {confirmingContract === a.id
                                  ? "..."
                                  : "contract"}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  handleAcceptance(a.id, "declined")
                                }
                              >
                                <X className="h-3 w-3 mr-1" />
                                decline
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {a.message && (
                        <p className="text-xs text-[#b8a078] mt-2 bg-[#0f0c0a] p-2.5 rounded">
                          {a.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          );
        })()}
      </div>

      {/* ========== CONFIRM DIALOG ========== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0806]/80 p-4">
          <div className="vessel p-5 max-w-sm w-full">
            <p className="text-sm font-medium text-[#e8d5a3] mb-5">
              {confirmDialog.type === "delete"
                ? "Delete this need? This cannot be undone."
                : `Form a contract with ${confirmDialog.userName}?`}
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </Button>
              <Button size="sm" variant="default" onClick={executeConfirm}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
