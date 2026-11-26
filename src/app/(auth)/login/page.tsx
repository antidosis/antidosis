"use client";

import { Suspense, useState, useEffect } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeInternalPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-void">
          <Loader2 className="h-8 w-8 animate-spin text-sun" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const justRegistered = searchParams.get("registered") === "true";

  // Internal-path-only redirect target for post-login (set by the proxy when
  // a protected page bounced an unauthenticated user here)
  // Invitation links survive signup even if `next` was dropped along the way
  const nextParam = searchParams.get("next");
  let stashedInvite: string | null = null;
  if (!nextParam) {
    try {
      stashedInvite = sessionStorage.getItem("antidosis-pending-invite");
      sessionStorage.removeItem("antidosis-pending-invite");
    } catch {
      /* ignore */
    }
  }
  const redirectTarget = nextParam ? safeInternalPath(nextParam) : safeInternalPath(stashedInvite);

  // Handle email verification callback from Supabase
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- OAuth/email verification callback handling from the URL
      setError(urlError);
      return;
    }
    const code = searchParams.get("code");
    if (code) {
      setLoading(true);
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError("Verification failed: " + error.message);
          setLoading(false);
        } else {
          router.push(redirectTarget);
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

    router.push(redirectTarget);
    router.refresh();
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
          <p className="text-xs text-ash mb-8">$ login --existing-user</p>
          <h1 className="heading-display text-2xl text-gold mb-2">
            authenticate
            <TerminalCursor />
          </h1>
          <p className="text-sm text-parchment mb-12">
            access your account and manage your exchanges
          </p>

          {justRegistered && (
            <div className="border border-line bg-surface p-5 mb-8">
              <p className="text-sm text-ok">
                Account created. Please verify your email before logging in.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
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
            </div>
            {searchParams.get("next") && !error && (
              <p className="text-sm text-ash border border-line bg-inset/50 p-3">
                your session expired — sign in to continue where you left off.
              </p>
            )}
            {error && <p className="text-sm text-bad">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
            <p className="text-center">
              <Button variant="link" size="sm" asChild>
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </p>
          </form>

          <p className="mt-12 text-sm text-ash">
            Don&apos;t have an account?{" "}
            <Button variant="link" size="sm" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
