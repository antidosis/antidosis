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
          <p className="text-xs text-[#8f7f6e] mb-8">$ passwd --reset</p>
          <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">
            reset_password
            <TerminalCursor />
          </h1>
          <p className="text-sm text-[#b8a078] mb-12">
            Enter your email and we&apos;ll send you a reset link
          </p>

          {sent ? (
            <div className="border border-[#2a2420] bg-[#12100e] p-5">
              <p className="text-sm text-[#00e676] mb-2">Reset link sent.</p>
              <p className="text-xs text-[#8f7f6e]">
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
              {error && <p className="text-sm text-[#ff5252]">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-sm text-[#8f7f6e] text-center">
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
