"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { validatePassword, getPasswordStrength } from "@/lib/security/password";
import { Check, X, Eye, EyeOff, Loader2 } from "lucide-react";

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
    weak: "text-[#ff5252]",
    fair: "text-[#ffb300]",
    strong: "text-[#00e676]",
    "very-strong": "text-[#00e676]",
  }[strength];

  const strengthBar = {
    weak: "w-1/4 bg-[#ff5252]",
    fair: "w-2/4 bg-[#ffb300]",
    strong: "w-3/4 bg-[#00e676]",
    "very-strong": "w-full bg-[#00e676]",
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
      setError("passwords do not match.");
      setLoading(false);
      return;
    }

    if (!validation.valid) {
      setError("password does not meet requirements.");
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
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col">
      <div className="px-4 md:px-8 py-4 border-b border-[#2a2420]">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="antidosis"
            className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-xs text-[#7a6b5a] mb-8">$ passwd --new</p>
          <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">
            new_password<TerminalCursor />
          </h1>
          <p className="text-sm text-[#b8a078] mb-12">
            set a new password for your account
          </p>

          {success ? (
            <div className="border border-[#2a2420] bg-[#12100e] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 text-[#00e676] animate-spin" />
                <p className="text-sm text-[#00e676]">password updated.</p>
              </div>
              <p className="text-xs text-[#7a6b5a]">
                redirecting to login in {countdown}s...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">new_password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="min_8_chars_complex"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6b5a] hover:text-[#e8d5a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0806] rounded-sm"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7a6b5a]">strength</span>
                      <span
                        className={`text-xs font-medium ${strengthColor}`}
                      >
                        {strength.replace("-", " ")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#12100e]">
                      <div
                        className={`h-full transition-all duration-300 ${strengthBar}`}
                      />
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
                        <div
                          key={req.label}
                          className="flex items-center gap-2 text-xs"
                        >
                          {req.test ? (
                            <Check className="h-3 w-3 text-[#00e676]" />
                          ) : (
                            <X className="h-3 w-3 text-[#ff5252]" />
                          )}
                          <span className="text-xs text-[#7a6b5a]">{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">confirm_password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="repeat_password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6b5a] hover:text-[#e8d5a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0806] rounded-sm"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#ff5252]">error: {error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "updating..." : "update_password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
