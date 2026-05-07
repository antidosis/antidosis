"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const justRegistered = searchParams.get("registered") === "true";

  // Handle email verification callback from Supabase
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setLoading(true);
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            setError("verification failed: " + error.message);
            setLoading(false);
          } else {
            router.push("/needs");
            router.refresh();
          }
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user?.email_confirmed_at) {
      router.push("/verify-email");
      return;
    }

    router.push("/needs");
    router.refresh();
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
          <p className="text-xs text-[#7a6b5a] mb-8">$ login --existing-user</p>
          <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">
            authenticate<TerminalCursor />
          </h1>
          <p className="text-sm text-[#b8a078] mb-12">
            access your account and manage your exchanges
          </p>

          {emailVerified && (
            <div className="border border-[#00e676]/30 bg-[#00e676]/5 p-5 mb-8 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-[#00e676] flex-shrink-0" />
              <p className="text-sm text-[#00e676]">
                email verified. you can now log in.
              </p>
            </div>
          )}

          {justRegistered && !emailVerified && (
            <div className="border border-[#2a2420] bg-[#12100e] p-5 mb-8">
              <p className="text-sm text-[#00e676]">
                account created. please verify your email before logging in.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="password">password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="your_password"
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
            </div>
            {error && <p className="text-sm text-[#ff5252]">error: {error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "authenticating..." : "login"}
            </Button>
            <p className="text-center">
              <Button variant="link" size="sm" asChild>
                <Link href="/forgot-password">forgot_password?</Link>
              </Button>
            </p>
          </form>

          <p className="mt-12 text-sm text-[#7a6b5a]">
            no account?{" "}
            <Button variant="link" size="sm" asChild>
              <Link href="/register">register</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
