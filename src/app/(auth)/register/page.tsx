"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { validatePassword, getPasswordStrength } from "@/lib/security/password";
import { isValidAustralianMobile, normalizeMobile } from "@/lib/mobile";
import { Check, X, Eye, EyeOff, Smartphone } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [agreeTos, setAgreeTos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!agreeTos) {
      setError("you must agree to the terms of service.");
      setLoading(false);
      return;
    }

    if (!validation.valid) {
      setError("password does not meet requirements.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("passwords do not match.");
      setLoading(false);
      return;
    }

    if (mobile && !isValidAustralianMobile(mobile)) {
      setError("invalid mobile number. use australian format: +61 412 345 678");
      setLoading(false);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${appUrl}/login`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      try {
        await fetch("/api/v1/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authData.user.id,
            email,
            fullName,
            mobile: mobile ? normalizeMobile(mobile) : undefined,
          }),
        });
      } catch (err) {
        console.error("Profile creation error:", err);
      }
    }

    router.push("/verify-email");
  }

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col">
      <div className="px-4 md:px-8 py-4 border-b border-[#2a2420]">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="antidosis"
            className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-xs text-[#7a6b5a] mb-8">$ register --new-user</p>
          <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">
            create_account<TerminalCursor />
          </h1>
          <p className="text-sm text-[#b8a078] mb-12">
            initialize profile and join the network
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">full_name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="john_doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">email_address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">mobile_number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a6b5a]" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+61 412 345 678"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-[#7a6b5a]">optional. australian mobiles only.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">password</Label>
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
                    <span className={`text-xs font-medium ${strengthColor}`}>
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
                      { label: "8+ characters", test: password.length >= 8 },
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

            <div className="flex items-start gap-2">
              <input
                id="tos"
                type="checkbox"
                checked={agreeTos}
                onChange={(e) => setAgreeTos(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#2a2420] bg-[#0f0c0a] text-[#f5a623] focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0806]"
              />
              <Label
                htmlFor="tos"
                className="text-xs text-[#7a6b5a] font-normal leading-relaxed cursor-pointer"
              >
                i agree to the{" "}
                <Link
                  href="/terms"
                  className="text-[#f5a623] hover:underline underline-offset-4"
                >
                  terms of service
                </Link>
              </Label>
            </div>

            {error && (
              <p className="text-sm text-[#ff5252]">error: {error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "creating..." : "create_account"}
            </Button>
          </form>

          <p className="mt-12 text-sm text-[#7a6b5a]">
            have account?{" "}
            <Button variant="link" size="sm" asChild>
              <Link href="/login">login</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
