"use client";

import { useState } from "react";

import Link from "next/link";

import { KeyRound, Loader2, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

interface SecuritySectionProps {
  profile: {
    email: string;
    mobile: string | null;
    mobileVerified: boolean;
  };
}

/** Account-security workspace: sign-in mobile, password, future 2FA. */
export function SecuritySection({ profile }: SecuritySectionProps) {
  const { toast } = useToast();
  const [supabase] = useState(() => createClient());
  const [mobile, setMobile] = useState(profile.mobile ?? "");
  const [savingMobile, setSavingMobile] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const mobileChanged = mobile.trim() !== (profile.mobile ?? "");

  async function saveMobile() {
    if (!mobileChanged || savingMobile) return;
    setSavingMobile(true);
    try {
      const response = await fetch("/api/v1/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast(typeof data.error === "string" ? data.error : "Couldn't update mobile", "error");
        return;
      }
      await mutate("/api/v1/profiles/me");
      toast("Mobile updated — verify it to restore your verified status", "success");
    } catch {
      toast("Couldn't update mobile — try again", "error");
    } finally {
      setSavingMobile(false);
    }
  }

  async function changePassword() {
    if (savingPassword) return;
    if (password.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    if (password !== confirmPassword) {
      toast("Passwords don't match", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast(error.message, "error");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      toast("Password updated", "success");
    } catch {
      toast("Couldn't update password — try again", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="vessel rounded-lg border-mercury/20 bg-mercury/[0.02] p-4 sm:p-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
          Sign-in & recovery
        </p>

        <div className="space-y-2">
          <Label htmlFor="security-mobile">Account mobile</Label>
          <div className="relative">
            <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <Input
              id="security-mobile"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="+61 412 345 678"
              type="tel"
              autoComplete="tel"
              className="pl-9 text-base"
            />
          </div>
          <p className="text-xs text-ash">
            Used for account security and verification. Never shown publicly. Changing it requires
            fresh verification.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={saveMobile}
              disabled={!mobileChanged || savingMobile}
            >
              {savingMobile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update mobile
            </Button>
            <Link
              href="/verify-mobile?next=/dashboard?tab=settings"
              className="inline-flex min-h-8 items-center text-xs font-medium text-sun hover:underline"
            >
              {profile.mobileVerified && !mobileChanged ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-ok" /> Mobile verified · manage
                </span>
              ) : (
                "Verify this mobile →"
              )}
            </Link>
          </div>
        </div>

        <div className="mt-6 space-y-2 border-t border-line/60 pt-5">
          <Label htmlFor="security-email">Email</Label>
          <Input id="security-email" value={profile.email} readOnly className="text-base" />
          <p className="text-xs text-ash">Your sign-in email. Change it by contacting support.</p>
        </div>
      </section>

      <div className="space-y-4">
        <section className="vessel rounded-lg border-mercury/20 bg-mercury/[0.02] p-4 sm:p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
            Password
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="security-password">New password</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
                <Input
                  id="security-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  autoComplete="new-password"
                  className="pl-9 text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-password-confirm">Confirm new password</Label>
              <Input
                id="security-password-confirm"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="text-base"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={changePassword}
              disabled={savingPassword || !password}
            >
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        </section>

        <section className="vessel rounded-lg border-line/60 bg-surface/30 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-ash" />
            <div>
              <p className="text-sm font-medium text-gold">Two-step verification & passkeys</p>
              <p className="mt-1 text-sm leading-relaxed text-ash">
                Authenticator-app codes and passkey sign-in are on the security roadmap. Your
                verified mobile is the account trust layer until they land.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
