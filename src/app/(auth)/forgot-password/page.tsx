"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
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
          <p className="text-xs text-ash mb-8">$ passwd --reset</p>
          <h1 className="heading-display text-2xl text-gold mb-2">
            reset_password
            <TerminalCursor />
          </h1>
          <p className="text-sm text-parchment mb-12">
            Enter your email and we&apos;ll send you a reset link
          </p>

          {sent ? (
            <div className="border border-line bg-surface p-5">
              <p className="text-sm text-ok mb-2">Reset link sent.</p>
              <p className="text-xs text-ash">
                Check your inbox (and spam folder) for an email from us.
              </p>
              <div className="mt-6 text-center">
                <Button variant="link" size="sm" asChild>
                  <Link href="/login" className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
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
              {error && <p className="text-sm text-bad">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-sm text-ash text-center">
                <Button variant="link" size="sm" asChild>
                  <Link href="/login">Back to login</Link>
                </Button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
