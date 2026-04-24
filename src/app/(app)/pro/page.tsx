"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Shield, Scale, MessageCircle, Check, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ProPage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{ isPro: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  async function startCheckout() {
    setCheckoutLoading(true);
    const res = await fetch("/api/v1/billing/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(false);
  }

  if (loading) return <div className="max-w-3xl mx-auto py-24 text-center text-[#7a6b4a]">loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-10 text-center">
        <p className="text-[12px] text-[#7a6b4a] mb-4">$ man antidosis_pro</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">antidosis <span className="text-[#7a6b4a]">pro</span></h1>
        <p className="text-[15px] text-[#7a6b4a] max-w-lg mx-auto mt-4">peace of mind for every exchange. dispute resolution, coverage, and verified trust.</p>
      </div>

      {profile?.isPro && (
        <div className="mb-16 border border-[#7cb87c]/20 bg-[#7cb87c]/5 p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[#7cb87c] mb-2">
            <Check className="h-5 w-5" />
            <span className="font-semibold text-lg">you are subscribed to pro</span>
          </div>
          <p className="text-[13px] text-[#7a6b4a]">your exchanges are protected. you can file disputes and access premium support.</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-px bg-[#2a2a2a] mb-16">
        <FeatureItem icon={<Shield className="h-5 w-5" />} title="dispute_resolution" description="access to our dispute resolution system if an exchange goes wrong." />
        <FeatureItem icon={<Scale className="h-5 w-5" />} title="loss_coverage" description="up to $500 coverage for verified losses from incomplete work." />
        <FeatureItem icon={<MessageCircle className="h-5 w-5" />} title="priority_support" description="direct line to our team for urgent contract issues." />
      </div>

      <div className="border border-[#2a2a2a] p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h2 className="text-2xl font-bold">$9/month</h2>
              <Badge variant="default">pro</Badge>
            </div>
            <p className="text-[13px] text-[#7a6b4a]">cancel anytime. coverage begins immediately.</p>
          </div>
          {user ? (
            profile?.isPro ? <Button size="lg" variant="secondary" disabled>already subscribed</Button> : <Button size="lg" onClick={startCheckout} disabled={checkoutLoading}>{checkoutLoading ? "redirecting..." : "$ subscribe_now"}<ArrowUpRight className="ml-2 h-4 w-4" /></Button>
          ) : <Button size="lg" asChild><Link href="/register">$ get_started<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>}
        </div>
      </div>

      <p className="text-center text-[12px] text-[#7a6b4a]/50 pb-12">by subscribing, you agree to the pro terms. coverage limits and conditions apply.</p>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#0c0c0c] p-6">
      <div className="mb-4 text-[#f5b800]">{icon}</div>
      <h3 className="text-base font-bold mb-2">{title}</h3>
      <p className="text-[13px] text-[#7a6b4a] leading-relaxed">{description}</p>
    </div>
  );
}
