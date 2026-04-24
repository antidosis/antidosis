"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ProPage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{ isPro: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

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
      setProfile((p) => (p ? { ...p, isPro: true } : p));
    } else {
      setClaimError(data.error || "Something went wrong.");
    }
    setClaiming(false);
  }

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-[#7a6b4a]">
        loading...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-10 text-center">
        <p className="text-[12px] text-[#7a6b4a] mb-4">$ man antidosis_pro</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          antidosis <span className="text-[#f5b800]">pro</span>
        </h1>
        <p className="text-[15px] text-[#7a6b4a] max-w-lg mx-auto mt-4">
          stand out. get selected. trade with confidence.
        </p>
      </div>

      {/* Trial banner */}
      <div className="border border-[#7cb87c]/20 bg-[#7cb87c]/5 p-6 mb-12 text-center">
        <div className="flex items-center justify-center gap-2 text-[#7cb87c] mb-2">
          <Zap className="h-5 w-5" />
          <span className="font-semibold text-lg">free during trial</span>
        </div>
        <p className="text-[13px] text-[#7a6b4a]">
          pro is currently free while we build traction. claim it now and keep
          it when we launch paid tiers.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-px bg-[#2a2a2a] mb-12">
        <FeatureItem
          icon={<Star className="h-5 w-5" />}
          title="enhanced_visibility"
          description="pro badge on your profile and posts. need posters see you first when choosing who to trade with."
        />
        <FeatureItem
          icon={<Phone className="h-5 w-5" />}
          title="emergency_support"
          description="priority access to our support team for urgent contract disputes, fraud concerns, or safety issues."
        />
        <FeatureItem
          icon={<Users className="h-5 w-5" />}
          title="public_directory"
          description="opt-in to appear on the pro directory. get discovered by new users browsing trusted traders."
        />
        <FeatureItem
          icon={<Shield className="h-5 w-5" />}
          title="trust_signal"
          description="the pro badge signals commitment. users are more likely to accept your offer or choose you for their need."
        />
      </div>

      {/* Pricing + CTA */}
      <div className="border border-[#2a2a2a] p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <h2 className="text-2xl font-bold">$4.99/month</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-[#7cb87c]/30 text-[#7cb87c]">
                free now
              </span>
            </div>
            <p className="text-[13px] text-[#7a6b4a]">
              cancel anytime. no credit card required during trial.
            </p>
          </div>

          {user ? (
            profile?.isPro ? (
              <div className="flex items-center gap-2 px-6 py-3 border border-[#7cb87c]/20 bg-[#7cb87c]/5 text-[#7cb87c]">
                <Check className="h-5 w-5" />
                <span className="font-semibold">you are pro</span>
              </div>
            ) : (
              <button
                onClick={claimPro}
                disabled={claiming}
                className="btn-cmd-primary px-6 py-3"
              >
                {claiming ? "activating..." : "$ claim_pro_free"}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </button>
            )
          ) : (
            <Link
              href="/register"
              className="btn-cmd-primary px-6 py-3 inline-flex items-center"
            >
              $ get_started
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>

        {claimMsg && (
          <div className="mt-6 border border-[#7cb87c]/20 bg-[#7cb87c]/5 p-4 text-center">
            <p className="text-[13px] text-[#7cb87c]">{claimMsg}</p>
          </div>
        )}
        {claimError && (
          <div className="mt-6 border border-[#c97c7c]/20 bg-[#c97c7c]/5 p-4 text-center">
            <p className="text-[13px] text-[#c97c7c]">error: {claimError}</p>
          </div>
        )}
      </div>

      {/* Directory link */}
      <div className="text-center pb-12">
        <Link
          href="/pros"
          className="inline-flex items-center gap-2 text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors"
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
    <div className="bg-[#0c0c0c] p-6">
      <div className="mb-4 text-[#f5b800]">{icon}</div>
      <h3 className="text-base font-bold mb-2">{title}</h3>
      <p className="text-[13px] text-[#7a6b4a] leading-relaxed">{description}</p>
    </div>
  );
}
