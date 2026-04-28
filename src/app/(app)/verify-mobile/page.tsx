"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { maskMobile } from "@/lib/mobile";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import {
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function VerifyMobilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{
    mobile: string | null;
    mobileVerified: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [resendTimer, setResendTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/v1/profiles/me");
      if (res.ok) {
        const p = await res.json();
        setProfile({ mobile: p.mobile, mobileVerified: p.mobileVerified });
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (otpSent && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [otpSent, countdown]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setInterval(() => {
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(t);
    }
  }, [resendTimer]);

  async function sendOtp() {
    if (!profile?.mobile) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: profile.mobile }),
      });
      if (res.ok) {
        setOtpSent(true);
        setCountdown(600);
        setResendTimer(60);
        setCode("");
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSending(false);
  }

  async function verifyOtp() {
    if (!profile?.mobile || code.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: profile.mobile, code }),
      });
      if (res.ok) {
        setSuccess(true);
        setProfile((prev) => (prev ? { ...prev, mobileVerified: true } : prev));
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setVerifying(false);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#b8a078]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3]">
      <div className="px-4 md:px-8 py-4 border-b border-[#2a2420]">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <p className="text-xs text-[#7a6b5a] mb-8">$ verify-mobile --init</p>
          <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">
            mobile_verification<TerminalCursor />
          </h1>
          <p className="text-sm text-[#b8a078] mb-12">
            secure your account with a verified mobile number
          </p>

          <div className="vessel p-6 space-y-6">
            {profile?.mobileVerified || success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#00e676]/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-[#00e676]" />
                </div>
                <div>
                  <p className="text-[#e8d5a3] font-medium">Mobile Verified</p>
                  <p className="text-sm text-[#7a6b5a] mt-1">
                    {profile?.mobile ? maskMobile(profile.mobile) : ""}
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
              </div>
            ) : !profile?.mobile ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#ffb300]/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-[#ffb300]" />
                </div>
                <div>
                  <p className="text-[#e8d5a3] font-medium">No Mobile Number</p>
                  <p className="text-sm text-[#7a6b5a] mt-1">
                    Add a mobile number in your dashboard first.
                  </p>
                </div>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a1714] border border-[#2a2420] flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-[#f5a623]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#e8d5a3] font-medium">
                      {maskMobile(profile.mobile)}
                    </p>
                    <p className="text-xs text-[#7a6b5a]">awaiting verification</p>
                  </div>
                </div>

                {!otpSent ? (
                  <Button
                    onClick={sendOtp}
                    disabled={sending}
                    className="w-full"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Send OTP
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-[#7a6b5a]">6-digit code</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 6) setCode(val);
                        }}
                        className="text-center text-lg tracking-[0.5em]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#7a6b5a]">
                      <span>
                        expires in{" "}
                        <span className={countdown < 60 ? "text-[#ff5252]" : "text-[#e8d5a3]"}>
                          {formatTime(countdown)}
                        </span>
                      </span>
                      {countdown === 0 && (
                        <span className="text-[#ff5252]">code expired</span>
                      )}
                    </div>

                    <Button
                      onClick={verifyOtp}
                      disabled={verifying || code.length !== 6 || countdown === 0}
                      className="w-full"
                    >
                      {verifying ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Verify
                    </Button>

                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <span className="text-xs text-[#7a6b5a]">
                          Resend available in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={sendOtp}
                          disabled={sending}
                          className="text-xs text-[#f5a623] hover:underline underline-offset-4 disabled:opacity-40"
                        >
                          {sending ? "Sending..." : "Resend OTP"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-[#ff5252] text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
