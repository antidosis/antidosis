"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Check, X, Eye, EyeOff, Loader2 } from "lucide-react";

import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword, getPasswordStrength } from "@/lib/security/password";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();
  const supabase = createClient();

  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);

  const strengthColor = {
    weak: "text-bad",
    fair: "text-alert",
    strong: "text-ok",
    "very-strong": "text-ok",
  }[strength];

  const strengthBar = {
    weak: "w-1/4 bg-bad",
    fair: "w-2/4 bg-alert",
    strong: "w-3/4 bg-ok",
    "very-strong": "w-full bg-ok",
  }[strength];

  useEffect(() => {
    if (!success) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [success, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!validation.valid) {
      setError("Password does not meet the requirements below.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-void text-gold flex flex-col">
      <div className="px-4 md:px-8 py-3 border-b border-line">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/images/logo.webp"
            alt="antidosis"
            width={138}
            height={56}
            fetchPriority="high"
            className="brand-logo opacity-80 hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-xs text-ash mb-8">$ passwd --new</p>
          <h1 className="heading-display text-2xl text-gold mb-2">
            new_password
            <TerminalCursor />
          </h1>
          <p className="text-sm text-parchment mb-12">set a new password for your account</p>

          {success ? (
            <div className="border border-line bg-surface p-5">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 text-ok animate-spin" />
                <p className="text-sm text-ok">Password updated.</p>
              </div>
              <p className="text-xs text-ash">Redirecting to login in {countdown}s...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-void rounded-sm"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ash">Strength</span>
                      <span className={`text-xs font-medium ${strengthColor}`}>
                        {strength.replace("-", " ")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface">
                      <div className={`h-full transition-all duration-300 ${strengthBar}`} />
                    </div>
                    <div className="space-y-1">
                      {[
                        {
                          label: "8+ characters",
                          test: password.length >= 8,
                        },
                        {
                          label: "uppercase letter",
                          test: /[A-Z]/.test(password),
                        },
                        {
                          label: "lowercase letter",
                          test: /[a-z]/.test(password),
                        },
                        { label: "number", test: /[0-9]/.test(password) },
                        {
                          label: "special character",
                          test: /[^A-Za-z0-9]/.test(password),
                        },
                      ].map((req) => (
                        <div key={req.label} className="flex items-center gap-2 text-xs">
                          {req.test ? (
                            <Check className="h-3 w-3 text-ok" />
                          ) : (
                            <X className="h-3 w-3 text-bad" />
                          )}
                          <span className="text-xs text-ash">{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-void rounded-sm"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-bad">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
