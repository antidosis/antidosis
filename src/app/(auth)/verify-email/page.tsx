"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Mail, RefreshCw, ArrowLeft, Shield } from "lucide-react";

export default function VerifyEmailPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    getUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resendVerification() {
    setLoading(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
    setLoading(false);
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
          <p className="text-[12px] text-[#7a6b4a] mb-8">$ verify --email</p>
          <h1 className="text-2xl font-bold mb-2">
            verify_your_email<TerminalCursor />
          </h1>
          <p className="text-[13px] text-[#7a6b4a] mb-12">
            security checkpoint. check your inbox to continue.
          </p>

          <div className="border border-[#f5b800]/20 bg-[#f5b800]/5 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-[#f5b800] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] text-[#e8c97c] font-medium">verification email sent</p>
                {email && (
                  <p className="text-[12px] text-[#7a6b4a] mt-1">
                    sent to: <span className="text-[#e8c97c]">{email}</span>
                  </p>
                )}
                <p className="text-[12px] text-[#7a6b4a] mt-2">
                  click the link in the email to activate your account. the link expires in 1 hour.
                </p>
              </div>
            </div>
          </div>

          {resent && (
            <div className="border border-[#7cb87c]/20 bg-[#7cb87c]/5 p-4 mb-6 flex items-center gap-3">
              <Shield className="h-4 w-4 text-[#7cb87c] flex-shrink-0" />
              <p className="text-[13px] text-[#7cb87c]">verification email resent. check your inbox.</p>
            </div>
          )}

          {error && <p className="text-sm text-[#c97c7c] mb-6">error: {error}</p>}

          <button
            onClick={resendVerification}
            disabled={loading || resent}
            className="btn-cmd-primary w-full justify-center mb-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "sending..." : "$ resend_verification"}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />$ back_to_login
          </Link>
        </div>
      </div>
    </div>
  );
}
