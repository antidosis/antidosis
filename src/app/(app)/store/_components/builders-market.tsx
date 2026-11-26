"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  MapPin,
  PackageOpen,
  Store,
  Wrench,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { displayHostname } from "@/lib/security/link-policy";
import { createClient } from "@/lib/supabase/client";

export type MeshProductListing = {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: string | null;
  priceAudCents: number | null;
  stockStatus: string;
  buyUrl: string | null;
};

export type PublicMeshBuilder = {
  id: string;
  businessName: string;
  suburb: string | null;
  website: string | null;
  description: string;
  profile: {
    id: string;
    handle: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  products: MeshProductListing[];
};

export function formatAud(cents: number | null): string {
  if (cents === null) return "POA";
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function BuilderCard({ builder }: { builder: PublicMeshBuilder }) {
  return (
    <article className="vessel p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={builder.profile.avatarUrl} name={builder.businessName} size="lg" />
          <div>
            <h3 className="flex items-center gap-1.5 text-lg font-medium text-gold">
              {builder.businessName}
              {builder.profile.isVerified && (
                <BadgeCheck className="h-4 w-4 text-mercury" aria-label="Verified member" />
              )}
            </h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ash">
              {builder.suburb && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {builder.suburb}
                </span>
              )}
              {builder.website && (
                <a
                  href={builder.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 transition-colors hover:text-sun"
                >
                  <ExternalLink className="h-3 w-3" /> {displayHostname(builder.website)}
                </a>
              )}
              {builder.profile.handle && (
                <Link
                  href={`/profile/${builder.profile.id}`}
                  className="transition-colors hover:text-sun"
                >
                  @{builder.profile.handle} on antidosis
                </Link>
              )}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-ok/40 text-ok">
          verified builder
        </Badge>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-parchment">{builder.description}</p>

      {builder.products.length > 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ash">
          <PackageOpen className="h-4 w-4 text-sun" />
          {builder.products.length} product{builder.products.length === 1 ? "" : "s"} on the shelf
          above
        </p>
      ) : (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-line px-4 py-3 text-sm text-ash">
          <PackageOpen className="h-4 w-4" /> Shelf being stocked — products coming soon.
        </p>
      )}
    </article>
  );
}

const applicationInputClass =
  "w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun";

function ApplicationForm({ onApplied }: { onApplied: () => void }) {
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/v1/store/builders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          suburb: suburb || undefined,
          website: website || undefined,
          description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Application failed — try again");
      toast("Application received — we review builders manually", "success");
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed — try again");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-sun/25 bg-sun/[0.03] p-5 md:p-6">
      <h3 className="flex items-center gap-2 text-lg font-medium text-gold">
        <Wrench className="h-5 w-5 text-sun" /> Sell your nodes here
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ash">
        Approved builders get a public shelf in this store and manage it from their dashboard. We
        review manually — hardware, range tests, buyer support.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">
            Builder / business name <span className="text-sun">*</span>
          </span>
          <input
            type="text"
            required
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="e.g. CoastMesh Works"
            className={applicationInputClass}
            maxLength={160}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">Suburb</span>
          <input
            type="text"
            value={suburb}
            onChange={(event) => setSuburb(event.target.value)}
            placeholder="Where you're based"
            className={applicationInputClass}
            maxLength={120}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">Website or store link</span>
          <input
            type="url"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://… (full address, no shorteners)"
            className={applicationInputClass}
            maxLength={500}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">
            What you build and how you support buyers <span className="text-sun">*</span>
          </span>
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Boards you flash, antennas and enclosures, range tests you've run, warranty terms… (min 40 characters)"
            className={applicationInputClass}
            maxLength={2000}
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <Button type="submit" className="mt-4" disabled={sending || description.trim().length < 40}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Apply as a builder
      </Button>
    </form>
  );
}

type BuilderSession = "loading" | "anon" | "none" | "applied";

/**
 * The builders marketplace. The builders list itself is fetched once by the
 * store page and shared with the shelf; this component renders the stalls
 * and owns the application path (login-gated — products need an owner).
 */
export function BuildersMarket({
  builders,
  onApplied,
}: {
  builders: PublicMeshBuilder[] | null;
  onApplied: () => void;
}) {
  const [session, setSession] = useState<BuilderSession>("loading");

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSession("anon");
          return;
        }
        const res = await fetch("/api/v1/store/builders/mine");
        if (!res.ok) {
          setSession("none");
          return;
        }
        const data = await res.json();
        setSession(data.builder ? "applied" : "none");
      } catch {
        setSession("anon");
      }
    })();
  }, []);

  return (
    <div>
      {builders === null ? (
        <div className="vessel flex items-center justify-center gap-2 p-10 text-sm text-ash">
          <Loader2 className="h-4 w-4 animate-spin" /> loading builders…
        </div>
      ) : builders.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line/80 px-6 py-10 text-center"
            >
              <Store className="h-7 w-7 text-ash/60" />
              <p className="mt-3 text-base font-medium text-parchment">This stall could be yours</p>
              <p className="mt-1 text-sm text-ash">
                The first verified builders are being reviewed now.
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {builders.map((builder) => (
            <BuilderCard key={builder.id} builder={builder} />
          ))}
        </div>
      )}

      <div className="mt-6">
        {session === "loading" ? null : session === "anon" ? (
          <div className="rounded-lg border border-line bg-surface/40 p-5 md:p-6">
            <h3 className="text-lg font-medium text-gold">Build nodes? Join the shelf.</h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ash">
              Sign in (or create a free account and verify your mobile) to apply.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login?next=/store%23builders">Sign in to apply</Link>
            </Button>
          </div>
        ) : session === "applied" ? (
          <div className="rounded-lg border border-ok/25 bg-ok/[0.04] p-5 md:p-6">
            <h3 className="text-lg font-medium text-gold">You have a builder record</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ash">
              Track your application and manage your shelf from your dashboard.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/dashboard?tab=mesh-store">Open Mesh store in dashboard</Link>
            </Button>
          </div>
        ) : (
          <ApplicationForm
            onApplied={() => {
              setSession("applied");
              onApplied();
            }}
          />
        )}
      </div>
    </div>
  );
}
