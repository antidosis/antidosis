"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { displayHostname } from "@/lib/security/link-policy";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

const CATEGORY_LABEL: Record<string, string> = {
  node: "node",
  kit: "kit",
  gateway: "gateway",
  accessory: "accessory",
};

const STOCK_LABEL: Record<string, { label: string; tone: string }> = {
  in_stock: { label: "in stock", tone: "text-ok" },
  made_to_order: { label: "made to order", tone: "text-mercury" },
  out_of_stock: { label: "out of stock", tone: "text-ash" },
};

export function formatAud(cents: number | null): string {
  if (cents === null) return "POA";
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function ProductCard({ product }: { product: MeshProductListing }) {
  const stock = STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock;
  return (
    <div className="rounded-lg border border-line/70 bg-inset/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mercury">
          {CATEGORY_LABEL[product.category] ?? product.category}
        </span>
        <span className={cn("font-mono text-[10px] uppercase tracking-wider", stock.tone)}>
          {stock.label}
        </span>
      </div>
      <h4 className="mt-2 text-base font-medium text-gold">{product.name}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-ash">{product.description}</p>
      {product.specs && (
        <p className="mt-2 border-l-2 border-line pl-3 font-mono text-xs leading-relaxed text-ash/80">
          {product.specs}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-base font-medium text-sun">{formatAud(product.priceAudCents)}</span>
        {product.buyUrl && (
          <a
            href={product.buyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded border border-line px-2.5 py-1.5 text-xs text-parchment transition-colors hover:border-sun/40 hover:text-sun"
          >
            <ExternalLink className="h-3 w-3" />
            {displayHostname(product.buyUrl)}
          </a>
        )}
      </div>
    </div>
  );
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {builder.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-line px-4 py-3 text-sm text-ash">
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
        <Wrench className="h-5 w-5 text-sun" /> Apply as a mesh builder
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ash">
        One application per account. We review manually — hardware specs, range-test evidence, buyer
        support terms. Approved builders get a public shelf in this store and manage it from their
        dashboard.
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
            placeholder="https://… (your own site, Etsy, eBay — full address, no shorteners)"
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
            placeholder="Boards you flash, antennas and enclosures you use, range tests you've run, warranty/repair terms… (min 40 characters)"
            className={applicationInputClass}
            maxLength={2000}
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <Button type="submit" className="mt-4" disabled={sending || description.trim().length < 40}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit application
      </Button>
    </form>
  );
}

type BuilderSession = "loading" | "anon" | "none" | "applied";

/**
 * The builders marketplace: live approved builders + their product shelves,
 * plus the application path (login-gated — products need an owner).
 */
export function BuildersMarket() {
  const [builders, setBuilders] = useState<PublicMeshBuilder[] | null>(null);
  const [session, setSession] = useState<BuilderSession>("loading");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/store/builders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuilders(data.builders ?? []);
    } catch {
      setBuilders([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount; setState lives inside the async loaders
    void load();
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
  }, [load]);

  return (
    <div>
      {builders === null ? (
        <div className="vessel flex items-center justify-center gap-2 p-10 text-sm text-ash">
          <Loader2 className="h-4 w-4 animate-spin" /> loading builders…
        </div>
      ) : builders.length === 0 ? (
        <div className="vessel p-8 text-center md:p-10">
          <ShieldCheck className="mx-auto h-8 w-8 text-mercury" />
          <h3 className="heading-display mt-4 text-xl text-gold">
            The first shelves are being built
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ash">
            No builders listed yet — the pilot is reviewing its first applications. Listings are
            earned through evidence (hardware specs, documented range tests, real buyer support),
            never purchased.
          </p>
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
              Verified builders get a public product shelf here and buyer referrals from the
              platform. Applications are tied to a verified account — sign in (or create a free
              account and verify your mobile) to apply.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login?next=/store%23builders">Sign in to apply</Link>
            </Button>
          </div>
        ) : session === "applied" ? (
          <div className="rounded-lg border border-ok/25 bg-ok/[0.04] p-5 md:p-6">
            <h3 className="text-lg font-medium text-gold">You have a builder record</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ash">
              Track your application status, edit your details and manage your product shelf from
              your dashboard.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/dashboard?tab=mesh-store">Open Mesh store in dashboard</Link>
            </Button>
          </div>
        ) : (
          <ApplicationForm onApplied={() => setSession("applied")} />
        )}
      </div>
    </div>
  );
}
