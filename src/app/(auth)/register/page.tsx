"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { TerminalCursor } from "@/components/effects/terminal-cursor";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
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

    router.push("/login?registered=true");
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
              <Input id="password" type="password" placeholder="min_6_chars" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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
