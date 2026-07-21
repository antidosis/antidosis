"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import {
  Shield,
  Star,
  Phone,
  Users,
  ArrowUpRight,
  Zap,
  Globe,
  AlertTriangle,
  Lock,
  Smartphone,
  Crown,
  Mail,
  Clock,
  Infinity,
  MessageCircle,
  Send,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useApi } from "@/lib/swr-config";

type ProfileData = {
  isPro: boolean;
  showInDirectory: boolean;
  isVerified: boolean;
  mobileVerified: boolean;
  proActivatedAt: string | null;
  proSource: string | null;
  proExpiresAt: string | null;
  fullName: string | null;
  email: string;
};

export default function ProPage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [togglingDir, setTogglingDir] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  const { data: profile, mutate: mutateProfile } = useApi<ProfileData>(
    authChecked ? "/api/v1/profiles/me" : null
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) setUser(authUser);
      setAuthChecked(true);
    });
  }, [supabase]);

  async function claimPro() {
    setClaiming(true);
    setClaimMsg(null);
    setClaimError(null);
    const res = await fetch("/api/v1/pro/claim", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setClaimMsg(data.message);
      mutateProfile();
    } else {
      setClaimError(data.error || "Something went wrong.");
    }
    setClaiming(false);
  }

  async function toggleDirectory() {
    if (!profile) return;
    setTogglingDir(true);
    const newValue = !profile.showInDirectory;
    const res = await fetch("/api/v1/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showInDirectory: newValue }),
    });
    if (res.ok) {
      mutateProfile((p: any) => (p ? { ...p, showInDirectory: newValue } : p), {
        revalidate: false,
      });
    }
    setTogglingDir(false);
  }

  async function sendSupport(e: React.FormEvent) {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    // For now: just show confirmation. In future, POST to support API.
    setSupportSent(true);
    setSupportMsg("");
    setTimeout(() => setSupportSent(false), 5000);
  }

  if (!authChecked) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-sm text-[#7a6b5a]">loading...</div>
    );
  }

  const profileData = profile ?? null;

  // ─── PRO DASHBOARD ───
  if (profileData?.isPro) {
    return (
      <ProDashboard
        profile={profileData}
        user={user}
        toggleDirectory={toggleDirectory}
        togglingDir={togglingDir}
        supportMsg={supportMsg}
        setSupportMsg={setSupportMsg}
        supportSent={supportSent}
        sendSupport={sendSupport}
      />
    );
  }

  // ─── MARKETING / CLAIM FLOW ───
  return (
    <ProMarketing
      user={user}
      profile={profileData}
      claimPro={claimPro}
      claiming={claiming}
      claimMsg={claimMsg}
      claimError={claimError}
    />
  );
}

/* ───────────────────────────────────────── */

function ProDashboard({
  profile,
  user,
  toggleDirectory,
  togglingDir,
  supportMsg,
  setSupportMsg,
  supportSent,
  sendSupport,
}: {
  profile: ProfileData;
  user: { id: string; email?: string } | null;
  toggleDirectory: () => void;
  togglingDir: boolean;
  supportMsg: string;
  setSupportMsg: (v: string) => void;
  supportSent: boolean;
  sendSupport: (e: React.FormEvent) => void;
}) {
  const activated = profile.proActivatedAt
    ? new Date(profile.proActivatedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isFree = profile.proSource === "free_verified";
  const isPlayStore = profile.proSource === "play_store";
  const isPaid = profile.proSource?.startsWith("paid") || isPlayStore || !!profile.proExpiresAt;

  const benefits = [
    {
      icon: <Star className="h-4 w-4" />,
      label: "Enhanced Visibility",
      desc: "Pro badge on profile & posts. Seen first by need posters.",
    },
    {
      icon: <Phone className="h-4 w-4" />,
      label: "Emergency Support",
      desc: "Priority access for urgent disputes, fraud, or safety issues.",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Public Directory",
      desc: "Opt-in to the pro directory. Get discovered by new users.",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: "Trust Signal",
      desc: "The pro badge signals commitment. Higher acceptance rates.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
      {/* Hero */}
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#f0cc33]/10 border border-[#f0cc33]/30 mb-6 animate-pulse-slow">
          <Crown className="h-10 w-10 text-[#f0cc33]" />
        </div>
        <h1 className="heading-display text-3xl sm:text-4xl text-[#e8d5a3] mb-3">
          you are <span className="text-[#f0cc33]">pro</span>
        </h1>
        <p className="text-sm text-[#7a6b5a] max-w-md mx-auto">
          welcome to the inner circle. verified. trusted. first in line.
        </p>
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          <Badge variant="default" className="bg-[#f0cc33]/10 border-[#f0cc33]/30 text-[#f0cc33]">
            <Crown className="h-3 w-3 mr-1" /> pro member
          </Badge>
          {isFree && (
            <Badge variant="outline" className="border-[#00e676]/30 text-[#00e676]">
              <Infinity className="h-3 w-3 mr-1" /> free for life
            </Badge>
          )}
          {isPlayStore && (
            <Badge variant="outline" className="border-[#35c2f0]/30 text-[#35c2f0]">
              <Smartphone className="h-3 w-3 mr-1" /> google play
            </Badge>
          )}
          {isPaid && !isPlayStore && (
            <Badge variant="outline" className="border-[#35c2f0]/30 text-[#35c2f0]">
              <Clock className="h-3 w-3 mr-1" /> active subscription
            </Badge>
          )}
          {activated && <span className="text-xs text-[#7a6b5a]">since {activated}</span>}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {benefits.map((b) => (
          <div key={b.label} className="vessel p-4 flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded bg-[#f0cc33]/10 text-[#f0cc33] shrink-0">
              {b.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8d5a3]">{b.label}</p>
              <p className="text-xs text-[#7a6b5a] mt-0.5">{b.desc}</p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-[#00e676] shrink-0 ml-auto" />
          </div>
        ))}
      </div>

      {/* Emergency Support */}
      <div className="vessel-lit p-6 mb-10 border-l-2 border-l-[#ff5252]/40">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded bg-[#ff5252]/10 flex items-center justify-center text-[#ff5252]">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#e8d5a3]">Emergency Support</h3>
            <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider">pro priority line</p>
          </div>
        </div>
        <p className="text-xs text-[#7a6b5a] mb-4">
          urgent contract dispute? fraud concern? safety issue? as a pro member, your message jumps
          to the front of the queue.
        </p>

        {supportSent ? (
          <div className="flex items-center gap-2 text-[#00e676] text-sm py-3">
            <CheckCircle2 className="h-4 w-4" />
            message sent — we will respond within 2 hours
          </div>
        ) : (
          <form onSubmit={sendSupport} className="space-y-3">
            <textarea
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
              placeholder="describe your urgent issue..."
              className="w-full bg-[#0f0c0a] border border-[#2a2420] text-[#e8d5a3] text-sm px-3 py-2 outline-none focus:border-[#ff5252] rounded resize-none"
              rows={3}
              required
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#7a6b5a]">response time: under 2 hours</p>
              <Button type="submit" size="sm">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                send priority message
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-[#2a2420]/40 flex items-center gap-4 text-xs text-[#7a6b5a]">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            official.antidosis@gmail.com
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3" />
            include &ldquo;PRO&rdquo; in subject
          </span>
        </div>
      </div>

      {/* Status + Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {/* Pro Status Card */}
        <div className="vessel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[#f5a623]" />
            <h3 className="text-sm font-bold text-[#e8d5a3]">Pro Status</h3>
          </div>
          <div className="text-xs text-[#7a6b5a] space-y-2">
            {activated && (
              <div className="flex justify-between">
                <span>activated</span>
                <span className="text-[#b8a078]">{activated}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>plan</span>
              <span className="text-[#f0cc33]">
                {isFree
                  ? "free for life"
                  : isPlayStore
                    ? "google play"
                    : isPaid
                      ? "subscription"
                      : "pro"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>expires</span>
              <span className="text-[#00e676]">
                {profile.proExpiresAt
                  ? new Date(profile.proExpiresAt).toLocaleDateString()
                  : "never"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>source</span>
              <span className="text-[#b8a078]">{profile.proSource?.replace(/_/g, " ") || "—"}</span>
            </div>
          </div>
        </div>

        {/* Directory Toggle */}
        <div className="vessel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-[#35c2f0]" />
            <h3 className="text-sm font-bold text-[#e8d5a3]">Public Directory</h3>
          </div>
          <p className="text-xs text-[#7a6b5a] mb-4">
            {profile.showInDirectory
              ? "your profile is visible on the pro directory. new users can discover you."
              : "your profile is hidden from the pro directory. toggle to get discovered."}
          </p>
          <Button
            onClick={toggleDirectory}
            disabled={togglingDir}
            size="sm"
            variant="outline"
            className={
              profile.showInDirectory
                ? "text-[#ff5252] border-[#ff5252]/30 hover:border-[#ff5252]/40 hover:bg-[#ff5252]/5 hover:text-[#ff5252]"
                : "text-[#00e676] border-[#00e676]/30 hover:border-[#00e676]/40 hover:bg-[#00e676]/5 hover:text-[#00e676]"
            }
          >
            {togglingDir
              ? "saving..."
              : profile.showInDirectory
                ? "hide from directory"
                : "show in directory"}
          </Button>
        </div>
      </div>

      {/* Directory link */}
      <div className="text-center">
        <Link
          href="/pros"
          className="inline-flex items-center gap-2 text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <Globe className="h-4 w-4" />
          browse the pro directory
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────── */

function ProMarketing({
  user,
  profile,
  claimPro,
  claiming,
  claimMsg,
  claimError,
}: {
  user: { id: string; email?: string } | null;
  profile: ProfileData | null;
  claimPro: () => void;
  claiming: boolean;
  claimMsg: string | null;
  claimError: string | null;
}) {
  const canClaimFree = profile && profile.isVerified && profile.mobileVerified && !profile.isPro;
  const missingIdentity = profile && !profile.isVerified;
  const missingMobile = profile && !profile.mobileVerified;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
      <div className="py-10 text-center">
        <p className="text-xs text-[#7a6b5a] mb-4">$ man antidosis_pro</p>
        <h1 className="heading-display text-2xl text-[#e8d5a3]">
          antidosis <span className="text-[#f5a623]">pro</span>
        </h1>
        <p className="text-sm text-[#7a6b5a] max-w-lg mx-auto mt-4">
          stand out. get selected. trade with confidence.
        </p>
      </div>

      {/* Free banner */}
      <div className="bg-[#00e676]/10 border border-[#00e676]/30 p-6 mb-12 text-center">
        <div className="flex items-center justify-center gap-2 text-[#00e676] mb-2">
          <Zap className="h-5 w-5" />
          <span className="font-semibold text-lg">pro is free — always</span>
        </div>
        <p className="text-sm text-[#7a6b5a]">
          no subscription, no credit card, no expiry. verify your identity and mobile number to
          claim Pro — the badge is earned with trust, not bought.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <FeatureItem
          icon={<Star className="h-5 w-5" />}
          title="Enhanced Visibility"
          description="pro badge on your profile and posts. need posters see you first when choosing who to trade with."
        />
        <FeatureItem
          icon={<Phone className="h-5 w-5" />}
          title="Emergency Support"
          description="priority access to our support team for urgent contract disputes, fraud concerns, or safety issues."
        />
        <FeatureItem
          icon={<Users className="h-5 w-5" />}
          title="Public Directory"
          description="opt-in to appear on the pro directory. get discovered by new users browsing trusted traders."
        />
        <FeatureItem
          icon={<Shield className="h-5 w-5" />}
          title="Trust Signal"
          description="the pro badge signals commitment. users are more likely to accept your offer or choose you for their need."
        />
      </div>

      {/* Pricing + CTA */}
      <div className="vessel-lit p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <h2 className="text-2xl font-bold text-[#e8d5a3]">free</h2>
              <Badge variant="default">with verification</Badge>
            </div>
            <p className="text-sm text-[#7a6b5a]">
              no credit card. no subscription. just a verified identity.
            </p>
          </div>

          {user ? (
            canClaimFree ? (
              <Button onClick={claimPro} disabled={claiming} size="lg">
                claim pro free
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="text-center md:text-right space-y-2">
                <div className="flex items-center gap-2 text-[#f5a623] justify-center md:justify-end">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">verification required</span>
                </div>
                <p className="text-xs text-[#7a6b5a]">
                  upload a government-issued ID in dashboard → credentials tab, then wait for admin
                  approval
                </p>
              </div>
            )
          ) : (
            <Button asChild size="lg">
              <Link href="/register" className="inline-flex items-center">
                get started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Verification gate */}
        {user && profile && !profile.isPro && (missingIdentity || missingMobile) && (
          <div className="mt-6 border border-[#f5a623]/20 bg-[#f5a623]/5 p-4">
            <p className="text-sm text-[#e8d5a3] mb-3">
              verify your identity and mobile number to claim free pro
            </p>
            <div className="flex flex-wrap gap-3">
              {missingIdentity && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-xs bg-[#1a1714] border border-[#2a2420] text-[#e8d5a3] px-3 py-2 rounded hover:border-[#f5a623]/40 transition-colors"
                >
                  <Lock className="h-3.5 w-3.5 text-[#f5a623]" />
                  upload ID in dashboard → credentials tab
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
              {missingMobile && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-xs bg-[#1a1714] border border-[#2a2420] text-[#e8d5a3] px-3 py-2 rounded hover:border-[#f5a623]/40 transition-colors"
                >
                  <Smartphone className="h-3.5 w-3.5 text-[#f5a623]" />
                  verify mobile number in dashboard
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {claimMsg && (
          <div className="mt-6 border border-[#00e676]/20 bg-[#00e676]/5 p-4 text-center">
            <p className="text-sm text-[#00e676]">{claimMsg}</p>
          </div>
        )}
        {claimError && (
          <div className="mt-6 border border-[#ff5252]/20 bg-[#ff5252]/5 p-4 text-center">
            <p className="text-sm text-[#ff5252]">error: {claimError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="vessel p-5">
      <div className="mb-4 inline-flex bg-[#1a1714] p-3 rounded-md text-[#f5a623]">{icon}</div>
      <h3 className="text-base font-bold text-[#e8d5a3] mb-2">{title}</h3>
      <p className="text-sm text-[#7a6b5a] leading-relaxed">{description}</p>
    </div>
  );
}
