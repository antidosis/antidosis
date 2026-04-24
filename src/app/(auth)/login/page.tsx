"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";
import { Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const justRegistered = searchParams.get("registered") === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check email verification
    if (!data.user?.email_confirmed_at) {
      router.push("/verify-email");
      return;
    }

    router.push("/needs");
    router.refresh();
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
          <p className="text-[12px] text-[#7a6b4a] mb-8">$ login --existing-user</p>
          <h1 className="text-2xl font-bold mb-2">
            authenticate<TerminalCursor />
          </h1>
          <p className="text-[13px] text-[#7a6b4a] mb-12">access your account and manage your exchanges</p>

          {justRegistered && (
            <div className="border border-[#7cb87c]/20 bg-[#7cb87c]/5 p-4 mb-8">
              <p className="text-[13px] text-[#7cb87c]">account created. please verify your email before logging in.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="email">email_address</Label>
              <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="your_password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6b4a] hover:text-[#e8c97c]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-[#c97c7c]">error: {error}</p>}
            <button type="submit" className="btn-cmd-primary w-full justify-center" disabled={loading}>
              {loading ? "authenticating..." : "$ login"}
            </button>
          </form>

          <p className="mt-12 text-[13px] text-[#7a6b4a]">
            no account?{" "}
            <Link href="/register" className="text-[#f5b800] hover:underline underline-offset-4">$ register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
