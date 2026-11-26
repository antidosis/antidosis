"use client";

import { useState } from "react";

import Link from "next/link";

import { BadgeCheck, ExternalLink, Loader2, MapPin, PackageOpen, Wrench } from "lucide-react";

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
  offerPostage: boolean;
  postageAudCents: number | null;
  localPickup: boolean;
  paymentTerms: string[];
  featuredUntil?: string | null;
  featured?: boolean;
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
    <article className="rounded-lg border border-line/70 bg-void/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={builder.profile.avatarUrl} name={builder.businessName} size="lg" />
          <div>
            <h3 className="flex items-center gap-1.5 text-base font-medium text-gold">
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
      <p className="mt-3 text-sm leading-relaxed text-parchment">{builder.description}</p>
      <p className="mt-2 flex items-center gap-2 text-xs text-ash">
        <PackageOpen className="h-3.5 w-3.5 text-sun" />
        {builder.products.length > 0
          ? `${builder.products.length} product${builder.products.length === 1 ? "" : "s"} on the floor`
          : "Shelf being stocked — products coming soon"}
      </p>
    </article>
  );
}

/** The sellers directory — every verified builder with a stall in the store. */
export function SellersList({ builders }: { builders: PublicMeshBuilder[] | null }) {
  if (builders === null) {
    return (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-ash">
        <Loader2 className="h-4 w-4 animate-spin" /> loading sellers…
      </p>
    );
  }
  if (builders.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ash">
        No sellers yet — the first verified builders are being reviewed now.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {builders.map((builder) => (
        <BuilderCard key={builder.id} builder={builder} />
      ))}
    </div>
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
    <form onSubmit={submit}>
      <p className="text-sm leading-relaxed text-ash">
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
        <Wrench className="mr-2 h-4 w-4" />
        Apply as a builder
      </Button>
    </form>
  );
}

export type BuilderSnapshot = {
  businessName: string;
  status: string;
  used: number;
  limit: number;
};

export type BuilderSession = "loading" | "anon" | "none" | "applied";

/** Probe once (page mount) so the sell popup opens instantly. */
export async function probeBuilderSession(): Promise<{
  session: BuilderSession;
  builder: BuilderSnapshot | null;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { session: "anon", builder: null };
    const res = await fetch("/api/v1/store/builders/mine");
    if (!res.ok) return { session: "none", builder: null };
    const data = await res.json();
    if (!data.builder) return { session: "none", builder: null };
    return {
      session: "applied",
      builder: {
        businessName: data.builder.businessName,
        status: data.builder.status,
        used: (data.builder.products ?? []).length,
        limit: data.builder.slotLimit ?? 3,
      },
    };
  } catch {
    return { session: "anon", builder: null };
  }
}

/**
 * The sell flow, session-aware: anonymous visitors get a sign-in prompt,
 * members get the application form, existing builders get their live slot
 * usage and a straight path to adding products. The session is probed by
 * the page on mount and passed in.
 */
export function SellPanel({
  session,
  builder,
  onApplied,
}: {
  session: BuilderSession;
  builder: BuilderSnapshot | null;
  onApplied: () => void;
}) {
  if (session === "loading") {
    return (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-ash">
        <Loader2 className="h-4 w-4 animate-spin" /> checking your account…
      </p>
    );
  }
  if (session === "anon") {
    return (
      <div>
        <p className="text-sm leading-relaxed text-ash">
          Build nodes? Sell them here. Applications are tied to a verified account — sign in (or
          create a free account and verify your mobile) to apply.
        </p>
        <Button asChild className="mt-4">
          <Link href="/login?next=/store">Sign in to apply</Link>
        </Button>
      </div>
    );
  }
  if (session === "applied") {
    const approved = builder?.status === "approved";
    return (
      <div>
        <p className="text-sm leading-relaxed text-ash">
          {approved
            ? `${builder?.businessName ?? "Your shelf"} is live in this store — ${builder?.used ?? 0} of ${builder?.limit ?? 3} slots used.`
            : builder?.status === "pending"
              ? "Your builder application is in review — products unlock once approved."
              : "You have a builder record — check its status in your dashboard."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ash/70">
          Every builder gets 3 free product slots; extra slots are AU$4/month each once rentals
          launch (free during the pilot).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard?tab=mesh-store">
              {approved ? "Manage shelf & add products" : "Open Mesh store dashboard"}
            </Link>
          </Button>
          {approved && (
            <Button asChild variant="secondary">
              <a href="#shop">View the floor</a>
            </Button>
          )}
        </div>
      </div>
    );
  }
  return <ApplicationForm onApplied={onApplied} />;
}
