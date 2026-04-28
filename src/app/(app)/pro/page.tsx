"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  Star,
  Phone,
  Users,
  Check,
  ArrowUpRight,
  Zap,
  Globe,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Smartphone,
} from "lucide-react";



type ProfileData = {
  isPro: boolean;
  showInDirectory: boolean;
  isVerified: boolean;
  mobileVerified: boolean;
  proActivatedAt: string | null;
  proSource: string | null;
};

export default function ProPage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [togglingDir, setTogglingDir] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        try {
          const res = await fetch("/api/v1/profiles/me");
          if (res.ok) setProfile(await res.json());
        } catch { /* ignore */ }
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function claimPro() {
    setClaiming(true);
    setClaimMsg(null);
    setClaimError(null);
    const res = await fetch("/api/v1/pro/claim", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setClaimMsg(data.message);
      // Refetch profile to get accurate pro state
      try {
        const meRes = await fetch("/api/v1/profiles/me");
        if (meRes.ok) setProfile(await meRes.json());
      } catch { /* ignore */ }
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
      setProfile((p) => (p ? { ...p, showInDirectory: newValue } : p));
    }
    setTogglingDir(false);
  }

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-sm text-[#7a6b5a]">
        loading...
      </div>
    );

  const canClaimFree = profile && profile.isVerified && profile.mobileVerified && !profile.isPro;
  const missingIdentity = profile && !profile.isVerified;
  const missingMobile = profile && !profile.mobileVerified;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-10 text-center">
        <p className="text-xs text-[#7a6b5a] mb-4">$ man antidosis_pro</p>
        <h1 className="heading-display text-2xl text-[#e8d5a3]">
          antidosis <span className="text-[#f5a623]">pro</span>
        </h1>
        <p className="text-sm text-[#7a6b5a] max-w-lg mx-auto mt-4">
          stand out. get selected. trade with confidence.
        </p>
      </div>

      {/* Trial banner */}
      <div className="bg-[#00e676]/10 border border-[#00e676]/30 p-6 mb-12 text-center">
        <div className="flex items-center justify-center gap-2 text-[#00e676] mb-2">
          <Zap className="h-5 w-5" />
          <span className="font-semibold text-lg">free for trial region members</span>
        </div>
        <p className="text-sm text-[#7a6b5a]">
          the Central Coast is the first trial region. verify your identity and mobile number to claim free Pro for life. no credit card. no expiry.
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
              <h2 className="text-2xl font-bold text-[#e8d5a3]">$4.99/month</h2>
              <Badge variant="default">free now</Badge>
            </div>
            <p className="text-sm text-[#7a6b5a]">
              cancel anytime. no credit card required during trial.
            </p>
          </div>

          {user ? (
            profile?.isPro ? (
              <div className="vessel p-3 flex items-center gap-2 text-[#00e676]">
                <Check className="h-5 w-5" />
                <span className="font-semibold">you are pro</span>
              </div>
            ) : canClaimFree ? (
              <Button
                onClick={claimPro}
                disabled={claiming}
                size="lg"
              >
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
                  complete verification to unlock free pro
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

        {/* Verification gate message for logged-in non-pro users */}
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
                  verify identity in dashboard
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

      {/* Pro status details */}
      {profile?.isPro && (
        <div className="vessel p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-[#f5a623]" />
            <h3 className="text-sm font-bold text-[#e8d5a3]">Pro Status</h3>
          </div>
          <div className="text-xs text-[#7a6b5a] space-y-1">
            {profile.proActivatedAt && (
              <p>
                activated:{" "}
                <span className="text-[#b8a078]">
                  {new Date(profile.proActivatedAt).toLocaleDateString()}
                </span>
              </p>
            )}
            {profile.proSource && (
              <p>
                source:{" "}
                <span className="text-[#b8a078]">{profile.proSource}</span>
              </p>
            )}
            <p>
              expires:{" "}
              <span className="text-[#00e676]">never (perpetual)</span>
            </p>
          </div>
        </div>
      )}

      {/* Directory settings for pro users */}
      {profile?.isPro && (
        <div className="vessel p-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {profile.showInDirectory ? (
                <Eye className="h-5 w-5 text-[#00e676] mt-0.5" />
              ) : (
                <EyeOff className="h-5 w-5 text-[#7a6b5a] mt-0.5" />
              )}
              <div>
                <h3 className="text-sm font-bold text-[#e8d5a3]">Public Directory</h3>
                <p className="text-xs text-[#7a6b5a] mt-1">
                  {profile.showInDirectory
                    ? "your profile is visible on the pro directory."
                    : "your profile is hidden from the pro directory."}
                </p>
              </div>
            </div>
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
                ? "hide"
                : "show"}
            </Button>
          </div>
        </div>
      )}

      {/* Directory link */}
      <div className="text-center pb-12">
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
      <div className="mb-4 inline-flex bg-[#1a1714] p-3 rounded-md text-[#f5a623]">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#e8d5a3] mb-2">{title}</h3>
      <p className="text-sm text-[#7a6b5a] leading-relaxed">{description}</p>
    </div>
  );
}
