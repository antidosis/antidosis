"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertTriangle, Loader2, Phone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface UrgentContactCardProps {
  needId: string;
  allowContact: boolean;
  isPoster: boolean;
}

export function UrgentContactCard({ needId, allowContact, isPoster }: UrgentContactCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/needs/${needId}/contact`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/needs/${needId}`)}`);
        return;
      }
      if (response.status === 403 && data.code === "MOBILE_NOT_VERIFIED") {
        router.push(`/verify-mobile?next=${encodeURIComponent(`/needs/${needId}`)}`);
        return;
      }
      if (!response.ok || typeof data.phone !== "string") {
        toast(data.error || "Phone contact is not available", "error");
        return;
      }
      setPhone(data.phone);
    } catch {
      toast("Couldn't reveal the number. Check your connection and try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-lg border border-alert/35 bg-alert/[0.055] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-gold">Urgent need</h2>
          <p className="mt-1 text-sm leading-relaxed text-parchment">
            Contact the poster promptly only if you can genuinely help. In-app interest and
            messaging remain available.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ash">
            Antidosis is not an emergency service. Call 000 for immediate danger or a
            life-threatening emergency.
          </p>
          {!isPoster && allowContact && !phone && (
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={reveal}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4 text-ok" />
              )}
              Reveal verified mobile
            </Button>
          )}
          {!isPoster && allowContact && phone && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button asChild>
                <a href={`tel:${phone}`}>
                  <Phone className="mr-2 h-4 w-4" /> Call {phone}
                </a>
              </Button>
              <span className="text-xs text-ok">Verified account mobile</span>
            </div>
          )}
          {!isPoster && !allowContact && (
            <p className="mt-3 text-xs text-ash">
              The poster has not enabled phone contact for this need.
            </p>
          )}
          {isPoster && allowContact && (
            <p className="mt-3 text-xs text-ok">
              Your current verified mobile can be revealed by verified members.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
