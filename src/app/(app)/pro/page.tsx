"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  Scale,
  MessageCircle,
  AlertTriangle,
  Building2,
  Clock,
  Lock,
  Check,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ProPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await supabase.auth.getUser();
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-24 text-center text-[#7a6b4a]">
        loading...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-10 text-center">
        <p className="text-[12px] text-[#7a6b4a] mb-4">
          $ man antidosis_protection
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          built-in <span className="text-[#7a6b4a]">protection</span>
        </h1>
        <p className="text-[15px] text-[#7a6b4a] max-w-lg mx-auto mt-4">
          every exchange on antidosis is protected by default. no subscription
          required.
        </p>
      </div>

      {/* Default protections — all users */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-4 w-4 text-[#7cb87c]" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#7cb87c]">
            included for all users
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-[#2a2a2a]">
          <ProtectionItem
            icon={<Scale className="h-5 w-5" />}
            title="dispute_resolution"
            description="structured dispute process when exchanges go wrong. both parties present evidence, and our team mediates a fair outcome."
          />
          <ProtectionItem
            icon={<MessageCircle className="h-5 w-5" />}
            title="mediation_support"
            description="neutral third-party mediation to resolve conflicts before they escalate. available for any active contract."
          />
          <ProtectionItem
            icon={<AlertTriangle className="h-5 w-5" />}
            title="anti_fraud_monitoring"
            description="automated detection of suspicious patterns, duplicate accounts, and scam behavior. flagged users are reviewed manually."
          />
          <ProtectionItem
            icon={<Building2 className="h-5 w-5" />}
            title="authority_reporting"
            description="serious fraud or criminal activity is reported to relevant authorities with full transaction records and evidence."
          />
          <ProtectionItem
            icon={<Lock className="h-5 w-5" />}
            title="secure_escrow"
            description="funds held in escrow until both parties confirm contract completion. no payment released prematurely."
          />
          <ProtectionItem
            icon={<Clock className="h-5 w-5" />}
            title="contract_timeline"
            description="clear milestones, deadlines, and deliverables tracked in every contract. both sides know what to expect and when."
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#2a2a2a] mb-12" />

      {/* Coming soon — insurance tier */}
      <div className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-4 w-4 text-[#f5b800]" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#f5b800]">
            coming soon
          </h2>
        </div>

        <div className="border border-[#f5b800]/20 bg-[#f5b800]/5 p-8">
          <h3 className="text-xl font-bold mb-3">antidosis insurance</h3>
          <p className="text-[13px] text-[#7a6b4a] leading-relaxed mb-6">
            we are exploring partnerships with insurance providers to offer
            real compensation for verified losses from incomplete or fraudulent
            exchanges. this would go beyond mediation — actual financial
            coverage backed by an underwriter.
          </p>

          <div className="space-y-3">
            {[
              "compensation for verified losses on completed contracts",
              "integration with licensed insurance underwriters",
              "optional premium tiers based on exchange value",
              "fast-track claims process with documented evidence",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-[#f5b800] mt-0.5 flex-shrink-0" />
                <span className="text-[13px] text-[#e8c97c]/80">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-[#7a6b4a]/60 mt-6">
            this is not yet available. we will announce it when partnerships are
            finalized.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProtectionItem({
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
      <div className="mb-4 text-[#7cb87c]">{icon}</div>
      <h3 className="text-base font-bold mb-2">{title}</h3>
      <p className="text-[13px] text-[#7a6b4a] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
