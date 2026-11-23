"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ArrowRight, Check, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

interface Invitation {
  title: string;
  inviter: { fullName: string | null; avatarUrl: string | null };
  expiresAt: string;
}

export default function ContractInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;
  const supabase = createClient();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = `/contracts/join/${token}`;

  useEffect(() => {
    async function load() {
      const [inviteResponse, { data }] = await Promise.all([
        fetch(`/api/v1/contracts/invite/${token}`, { cache: "no-store" }),
        supabase.auth.getUser(),
      ]);
      setLoggedIn(!!data.user);
      const inviteData = await inviteResponse.json().catch(() => ({}));
      if (!inviteResponse.ok) setError(inviteData.error || "This invitation is unavailable");
      else setInvitation(inviteData.invitation);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/contracts/invite/${token}`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Couldn't accept this invitation");
        return;
      }
      toast("Invitation accepted — review the terms together", "success");
      router.replace(`/contracts/${data.contractId}`);
    } catch {
      setError("Couldn't accept the invitation. Check your connection and try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-mercury" />
        <p className="mt-3 text-sm text-ash">Checking private invitation…</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <section className="vessel rounded-xl p-8 text-center">
          <LockKeyhole className="mx-auto h-7 w-7 text-ash" />
          <h1 className="heading-display mt-4 text-2xl text-gold">Invitation unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-ash">
            {error ||
              "This link is invalid, has already been used, or has expired. Ask the sender for a new invitation."}
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/exchange">Open the Exchange</Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="mb-8 text-center">
        <div className="contract-seal inline-block">Antidosis</div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mercury">
          Private direct agreement
        </p>
        <h1 className="heading-display mt-3 text-3xl text-gold md:text-4xl">
          You&apos;re invited to make it clear.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ash">
          Review a private arrangement, contribute your terms, and sign only when both of you agree.
          No public Exchange listing is created.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-surface/55">
        <div className="h-1 bg-gradient-to-r from-sun via-mercury to-transparent" />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4">
            <Avatar
              src={invitation.inviter.avatarUrl}
              name={invitation.inviter.fullName}
              size="md"
            />
            <div>
              <p className="text-xs text-ash">Invitation from</p>
              <p className="text-base font-medium text-gold">
                {invitation.inviter.fullName || "An Antidosis member"}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-line bg-inset/55 p-5">
            <p className="text-xs uppercase tracking-wide text-ash">Agreement</p>
            <h2 className="mt-2 text-xl font-medium text-parchment">{invitation.title}</h2>
            <p className="mt-3 text-xs text-ash">
              Invitation expires{" "}
              {new Date(invitation.expiresAt).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Full details become visible after you accept.
            </p>
          </div>

          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "Create your secure account",
              "Read and contribute terms",
              "Sign when both agree",
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-md border border-line/70 p-3 text-sm text-parchment"
              >
                <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-sun/10 font-mono text-xs text-sun">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          {error && (
            <p className="mt-5 rounded border border-bad/30 bg-bad/5 p-3 text-sm text-bad">
              {error}
            </p>
          )}

          <div className="mt-6">
            {loggedIn ? (
              <Button onClick={accept} disabled={accepting} className="w-full">
                {accepting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {accepting ? "Accepting…" : "Accept invitation and review agreement"}
              </Button>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild>
                  <Link href={`/register?next=${encodeURIComponent(next)}`}>
                    Create account to continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/login?next=${encodeURIComponent(next)}`}>
                    I already have an account
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <p className="mx-auto mt-6 flex max-w-xl items-start gap-2 text-xs leading-relaxed text-ash">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
        Accepting the invitation does not accept or sign the terms. You will review the full
        agreement before making any binding commitment. Antidosis provides a general-purpose record,
        not legal advice.
      </p>
    </div>
  );
}
