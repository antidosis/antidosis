import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mutate } from "swr";
import { ArrowLeft, Smartphone, ShieldCheck, CheckCircle } from "lucide-react";
import { sendOtp, verifyOtp, updateProfile, ApiError } from "@mobile/lib/api";
import { useProfile } from "@mobile/hooks/useApi";
import { useHaptics } from "@mobile/hooks/useNative";
import { hapticImpact } from "@mobile/lib/native";
import { Button, Input, Vessel, SkeletonCard } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   VERIFY MOBILE SCREEN
   $ verify-mobile --init — OTP verification required before
   posting needs, expressing interest, or messaging (the web gates
   these behind 403 MOBILE_NOT_VERIFIED).
   ═══════════════════════════════════════════════════════════════ */

function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("04")) return `+61${digits.slice(1)}`;
  if (digits.startsWith("4")) return `+61${digits}`;
  if (digits.startsWith("614")) return `+${digits}`;
  return input;
}

function isValidAustralianMobile(input: string): boolean {
  return /^\+614\d{8}$/.test(normalizeMobile(input));
}

const CODE_TTL_SECONDS = 600; // matches the 10-minute server-side expiry
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyMobileScreen() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { tap, success, error: hapticError } = useHaptics();

  const [mobile, setMobile] = useState("");
  const [mobileTouched, setMobileTouched] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(CODE_TTL_SECONDS);
  const [resendTimer, setResendTimer] = useState(0);

  // Prefill from the profile once loaded
  useEffect(() => {
    if (profile?.mobile && !mobileTouched) {
      setMobile(profile.mobile);
    }
  }, [profile?.mobile, mobileTouched]);

  // Code expiry countdown
  useEffect(() => {
    if (!otpSent || countdown <= 0) return;
    const t = setInterval(() => setCountdown((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(t);
  }, [otpSent, countdown]);

  // Resend cooldown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const normalized = normalizeMobile(mobile);
  const mobileValid = isValidAustralianMobile(mobile);

  const handleSendOtp = async () => {
    if (!mobileValid) {
      setError("Enter a valid Australian mobile (04XX XXX XXX)");
      hapticError();
      return;
    }
    setError("");
    setErrorCode(undefined);
    setSending(true);
    tap("medium");
    try {
      // send-otp requires profile.mobile to match the number being verified,
      // so save a changed number to the profile first.
      if (profile && profile.mobile !== normalized) {
        await updateProfile({ mobile: normalized });
      }
      await sendOtp(normalized);
      setOtpSent(true);
      setCountdown(CODE_TTL_SECONDS);
      setResendTimer(RESEND_COOLDOWN_SECONDS);
      setCode("");
      success();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
      if (err instanceof ApiError) setErrorCode(err.code);
      hapticError();
    }
    setSending(false);
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setError("");
    setErrorCode(undefined);
    setVerifying(true);
    tap("medium");
    try {
      await verifyOtp(normalized, code);
      setVerified(true);
      mutate("profile");
      success();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      hapticError();
    }
    setVerifying(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-full pb-20 pt-4 safe-top px-4 space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  const alreadyVerified = profile?.mobileVerified || verified;

  return (
    <div className="min-h-full pb-20 pt-4 safe-top px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => {
            hapticImpact("light");
            navigate(-1);
          }}
          className="flex items-center gap-1.5 p-2 -ml-2 mb-4 text-[var(--leather)] tap-highlight-none hover:text-[var(--parchment)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-mono text-xs">Back</span>
        </button>

        <div className="mb-6">
          <p className="font-mono text-xs text-[var(--leather)]">$ verify-mobile --init</p>
          <h1 className="heading-display text-2xl text-[var(--gold)] mt-1">Verify Mobile</h1>
          <p className="text-sm text-[var(--leather)] mt-2">
            A verified mobile is required before posting needs, expressing interest, or messaging —
            it stops scammers cycling accounts.
          </p>
        </div>

        <Vessel className="p-5">
          {alreadyVerified ? (
            <div className="text-center space-y-4">
              <ShieldCheck size={48} className="text-[var(--emerald)] mx-auto" />
              <div>
                <p className="text-[var(--parchment)] font-medium">Mobile Verified</p>
                <p className="text-sm text-[var(--leather)] mt-1">
                  You can now post needs, express interest, and message other users.
                </p>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => navigate("/profile")}>
                Back to Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[var(--sun)]/10 border border-[var(--sun)]/20 flex items-center justify-center shrink-0">
                  <Smartphone size={18} className="text-[var(--sun)]" />
                </div>
                <p className="text-sm text-[var(--parchment)]">
                  We'll SMS a 6-digit code to your Australian mobile.
                </p>
              </div>

              <Input
                label="Mobile Number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="04XX XXX XXX"
                value={mobile}
                disabled={otpSent}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setMobileTouched(true);
                }}
              />

              {!otpSent ? (
                <Button
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={sending || !mobile.trim()}
                  haptic={false}
                >
                  {sending ? "$ sending..." : "Send Code"}
                </Button>
              ) : (
                <>
                  <Input
                    label="6-digit Code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    className="text-center text-lg tracking-[0.5em] font-mono"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setCode(val);
                    }}
                  />

                  <div className="flex items-center justify-between font-mono text-xs text-[var(--leather)]">
                    <span>
                      expires in{" "}
                      <span
                        className={
                          countdown < 60 ? "text-[var(--ruby)]" : "text-[var(--parchment)]"
                        }
                      >
                        {formatTime(countdown)}
                      </span>
                    </span>
                    {countdown === 0 && <span className="text-[var(--ruby)]">code expired</span>}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleVerify}
                    disabled={verifying || code.length !== 6 || countdown === 0}
                    haptic={false}
                  >
                    {verifying ? "$ verifying..." : "Verify"}
                  </Button>

                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <span className="font-mono text-xs text-[var(--leather)]">
                        Resend available in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sending}
                        className="font-mono text-xs text-[var(--sun)] hover:underline underline-offset-4 disabled:opacity-40 tap-highlight-none"
                      >
                        {sending ? "Sending..." : "Resend Code"}
                      </button>
                    )}
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30">
                  <p className="font-mono text-xs text-[var(--ruby)]">
                    $ error: {error}
                    {errorCode === "MOBILE_BANNED" ? " (this number cannot be verified)" : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </Vessel>

        {alreadyVerified && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <CheckCircle size={14} className="text-[var(--emerald)]" />
            <span className="font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider">
              participation unlocked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
