"use client";

import { useEffect, useRef, useState } from "react";

import { Check, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Self-contained mobile verification for embedding anywhere a participation
 * gate fires (MOBILE_NOT_VERIFIED). Handles the full flow in place:
 * collect mobile → save to profile → send OTP → verify — without sending the
 * member hunting for /verify-mobile.
 */
export function InlineMobileVerify({ onVerified }: { onVerified: () => void }) {
  const [mobile, setMobile] = useState("");
  const [savedMobile, setSavedMobile] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingMobile, setSavingMobile] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearInterval);
  }, []);

  // Load any mobile already on the profile
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/profiles/me")
      .then(async (res) => {
        if (!res.ok) return;
        const p = (await res.json()) as { mobile?: string | null; mobileVerified?: boolean };
        if (cancelled) return;
        if (p.mobile && !p.mobileVerified) setSavedMobile(p.mobile);
        if (p.mobileVerified) setDone(true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => (s <= 1 ? 0 : s - 1)), 1000);
    timersRef.current.push(t);
    return () => clearInterval(t);
  }, [resendTimer]);

  async function saveMobileAndSend() {
    setSavingMobile(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't save that number");
        return;
      }
      setSavedMobile(mobile);
      await sendCode(mobile);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSavingMobile(false);
    }
  }

  async function sendCode(to: string) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't send the code");
        return;
      }
      setOtpSent(true);
      setResendTimer(60);
      setCode("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    if (!savedMobile || code.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: savedMobile, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "That code didn't match");
        return;
      }
      setDone(true);
      onVerified();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-ash">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your verification status…
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok">
        <Check className="h-4 w-4" /> Mobile verified — continuing…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-sun/30 bg-sun/[0.05] p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-gold">
        <ShieldCheck className="h-4 w-4 text-sun" />
        One quick step — verify your mobile number
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ash">
        Confirming your mobile keeps deals between real locals. It takes under a minute.
      </p>

      {!savedMobile ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="04XX XXX XXX"
            inputMode="tel"
            autoComplete="tel"
            className="flex-1 min-w-44 text-base"
          />
          <Button
            type="button"
            size="sm"
            onClick={saveMobileAndSend}
            disabled={savingMobile || sending || mobile.trim().length < 8}
          >
            {(savingMobile || sending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send code
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-parchment">{savedMobile}</span>
          <button
            type="button"
            onClick={() => {
              setSavedMobile(null);
              setOtpSent(false);
            }}
            className="text-xs text-ash underline-offset-2 hover:underline"
          >
            change
          </button>
        </div>
      )}

      {otpSent && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="flex-1 min-w-32 tracking-[0.3em] text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") verify();
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={verify}
            disabled={verifying || code.length !== 6}
          >
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => savedMobile && sendCode(savedMobile)}
            disabled={sending || resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
