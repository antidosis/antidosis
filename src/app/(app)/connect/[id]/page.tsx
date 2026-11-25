"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowRight, Check, Loader2, MapPin, ShieldCheck, UserPlus, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { useApi } from "@/lib/swr-config";

interface ConnectProfile {
  id: string;
  fullName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locationName: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  skills: { id: string; name: string }[];
}

export default function ConnectPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const supabase = createClient();
  const {
    data: profile,
    isLoading,
    error,
  } = useApi<ConnectProfile>(id ? `/api/v1/profiles/${id}` : null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const next = `/connect/${id}`;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    if (!profile) return;
    setConnecting(true);
    try {
      const response = await fetch("/api/v1/terminal/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setConnected(true);
        return;
      }
      if (!response.ok) {
        toast(data.error || "Couldn't connect right now", "error");
        return;
      }
      setConnected(true);
      toast(`You are now connected with ${profile.fullName || "this member"}`, "success");
    } catch {
      toast("Couldn't connect — check your connection", "error");
    } finally {
      setConnecting(false);
    }
  }

  if (isLoading || loggedIn === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-mercury" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="heading-display text-2xl text-gold">Member unavailable</h1>
        <p className="mt-3 text-sm text-ash">
          This connection link is invalid or the profile is unavailable.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/exchange?band=directory">Browse the directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ok">
            Antidosis connection
          </p>
          <h1 className="heading-display mt-4 text-3xl text-gold md:text-5xl">
            Good exchanges start with people you know.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ash">
            Join {profile.fullName || "this member"} on Antidosis. Discover local skills, post what
            you need, and build trust through genuine exchanges and clear agreements.
          </p>
          <div className="mt-7">
            {connected ? (
              <div className="rounded-lg border border-ok/30 bg-ok/5 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-ok">
                  <Check className="h-4 w-4" /> You&apos;re connected
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link href="/dashboard?tab=relay">Open your relay</Link>
                </Button>
              </div>
            ) : loggedIn ? (
              <Button
                onClick={connect}
                disabled={connecting}
                size="lg"
                className="w-full sm:w-auto"
              >
                {connecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {connecting ? "Connecting…" : `Connect with ${profile.fullName || "member"}`}
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={`/register?next=${encodeURIComponent(next)}`}>
                    Join and connect <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
                </Button>
              </div>
            )}
            <p className="mt-3 text-xs text-ash">Connecting is always your choice. Free to join.</p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-xl border border-line bg-surface/55 p-6 shadow-[0_28px_90px_-50px_rgb(var(--c-ok)/0.3)] sm:p-8">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full border border-mercury/15 shadow-[0_0_0_40px_rgb(var(--c-mercury)/0.03),0_0_0_80px_rgb(var(--c-mercury)/0.02)]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ok">Antidosis</p>
              <Users className="h-4 w-4 text-mercury" />
            </div>
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              size="lg"
              className="mt-8 h-20 w-20"
            />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-gold">
                {profile.fullName || "Antidosis member"}
              </h2>
              {profile.isVerified && <ShieldCheck className="h-5 w-5 text-ok" />}
            </div>
            {profile.handle && <p className="mt-1 font-mono text-sm text-sun">@{profile.handle}</p>}
            {profile.locationName && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-ash">
                <MapPin className="h-4 w-4" /> {profile.locationName}
              </p>
            )}
            {profile.bio && (
              <p className="mt-5 line-clamp-4 text-sm leading-relaxed text-parchment">
                {profile.bio}
              </p>
            )}
            {profile.skills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded border border-line bg-inset px-2 py-1 text-xs text-ash"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-6 flex gap-5 border-t border-line/60 pt-4 text-xs text-ash">
              <span>{profile.ratingAvg.toFixed(1)} average</span>
              <span>{profile.ratingCount} reviews</span>
              <span>{profile.jobsCompleted} completed</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 px-0">
              <Link href={`/profile/${profile.handle || profile.id}`}>
                View full public profile
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
