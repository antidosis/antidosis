"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { validatePassword, getPasswordStrength } from "@/lib/security/password";
import { Check, X, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);

  const strengthColor = {
    weak: "text-[#c97c7c]",
    fair: "text-[#f5b800]",
    strong: "text-[#7cb87c]",
    "very-strong": "text-[#7cb87c]",
  }[strength];

  const strengthBar = {
    weak: "w-1/4 bg-[#c97c7c]",
    fair: "w-2/4 bg-[#f5b800]",
    strong: "w-3/4 bg-[#7cb87c]",
    "very-strong": "w-full bg-[#7cb87c]",
  }[strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validation.valid) {
      setError("password does not meet requirements.");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    if (authData.user) {
      try {
        await fetch("/api/v1/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authData.user.id, email, fullName }),
        });
      } catch (err) { console.error("Profile creation error:", err); }
    }

    router.push("/verify-email");
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#e8c97c] flex flex-col">
      <div className="px-4 md:px-8 py-4 border-b border-[#2a2a2a]">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="antidosis" className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-[12px] text-[#7a6b4a] mb-8">$ register --new-user</p>
          <h1 className="text-2xl font-bold mb-2">
            create_account<TerminalCursor />
          </h1>
          <p className="text-[13px] text-[#7a6b4a] mb-12">initialize profile and join the network</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="fullName">full_name</Label>
              <Input id="fullName" type="text" placeholder="john_doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">email_address</Label>
              <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="min_8_chars_complex" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6b4a] hover:text-[#e8c97c]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#7a6b4a]">strength</span>
                    <span className={`text-[11px] font-medium ${strengthColor}`}>{strength.replace("-", " ")}</span>
                  </div>
                  <div className="h-1 bg-[#1a1a1a]">
                    <div className={`h-full transition-all duration-300 ${strengthBar}`} />
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: "8+ characters", test: password.length >= 8 },
                      { label: "uppercase letter", test: /[A-Z]/.test(password) },
                      { label: "lowercase letter", test: /[a-z]/.test(password) },
                      { label: "number", test: /[0-9]/.test(password) },
                      { label: "special character", test: /[^A-Za-z0-9]/.test(password) },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-2 text-[11px]">
                        {req.test ? <Check className="h-3 w-3 text-[#7cb87c]" /> : <X className="h-3 w-3 text-[#c97c7c]" />}
                        <span className={req.test ? "text-[#7a6b4a]" : "text-[#7a6b4a]/50"}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-[#c97c7c]">error: {error}</p>}
            <button type="submit" className="btn-cmd-primary w-full justify-center" disabled={loading}>
              {loading ? "creating..." : "$ create_account"}
            </button>
          </form>

          <p className="mt-12 text-[13px] text-[#7a6b4a]">
            have account?{" "}
            <Link href="/login" className="text-[#f5b800] hover:underline underline-offset-4">$ login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
