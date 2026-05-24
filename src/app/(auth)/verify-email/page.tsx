"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Mail, RefreshCw, ArrowLeft, Shield } from "lucide-react";

import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resendVerification() {
    setLoading(true);
    setError(null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${appUrl}/login` },
    });
    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
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
          <p className="text-xs text-[#7a6b5a] mb-8">$ verify --email</p>
          <h1 className="heading-display text-2xl text-[#e8d5a3] mb-2">
            verify_your_email
            <TerminalCursor />
          </h1>
          <p className="text-sm text-[#b8a078] mb-12">
            security checkpoint. check your inbox to continue.
          </p>

          <div className="vessel p-5 mb-8">
            <div className="flex items-start gap-3">
              <Mail className="h-6 w-6 text-[#f5a623] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[#e8d5a3] font-medium">verification email sent</p>
                {email && (
                  <p className="text-xs text-[#7a6b5a] mt-1">
                    sent to: <span className="text-[#e8d5a3]">{email}</span>
                  </p>
                )}
                <p className="text-xs text-[#7a6b5a] mt-2">
                  click the link in the email to activate your account. the link expires in 1 hour.
                </p>
              </div>
            </div>
          </div>

          {resent && (
            <div className="border border-[#2a2420] bg-[#12100e] p-5 mb-6 flex items-center gap-3">
              <Shield className="h-4 w-4 text-[#00e676] flex-shrink-0" />
              <p className="text-sm text-[#00e676]">verification email resent. check your inbox.</p>
            </div>
          )}

          {error && <p className="text-sm text-[#ff5252] mb-6">error: {error}</p>}

          <Button onClick={resendVerification} disabled={loading || resent} className="w-full mb-4">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "sending..." : "resend_verification"}
          </Button>

          <Button variant="ghost" size="sm" asChild className="px-0">
            <Link href="/login" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              back_to_login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
