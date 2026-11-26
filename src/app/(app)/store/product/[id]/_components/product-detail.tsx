"use client";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ExternalLink,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { ReportButton } from "@/components/report-button";
import { Avatar } from "@/components/ui/avatar";
import { displayHostname } from "@/lib/security/link-policy";
import { deliverySummary, paymentTermLabel, postageLine } from "@/lib/store-delivery";
import { cn } from "@/lib/utils";

import { MessageSeller } from "../../../_components/message-seller";
import { ProductArt, type ProductArtVariant } from "../../../_components/product-art";
import { CATEGORY_LABEL, type StoreCategory } from "../../../_components/product-grid";

export type ProductPageData = {
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
  postageNote: string | null;
  paymentTerms: string[];
  paymentNote: string | null;
  highlights: string[];
  seller: {
    businessName: string;
    suburb: string | null;
    website: string | null;
    profile: {
      id: string;
      handle: string | null;
      fullName: string | null;
      avatarUrl: string | null;
      isVerified: boolean;
    };
  };
};

const CATEGORY_ART: Record<string, ProductArtVariant> = {
  node: "node",
  kit: "kit",
  gateway: "base",
  board: "board",
  antenna: "antenna",
  power: "power",
  enclosure: "case",
  accessory: "node",
};

const STOCK_LABEL: Record<string, { label: string; tone: string }> = {
  in_stock: { label: "in stock", tone: "text-ok border-ok/40 bg-ok/[0.06]" },
  made_to_order: {
    label: "made to order",
    tone: "text-mercury border-mercury/40 bg-mercury/[0.06]",
  },
  out_of_stock: { label: "out of stock", tone: "text-ash border-line bg-inset" },
};

function priceLabel(cents: number | null): string {
  if (cents === null) return "Price on application";
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function ProductDetail({ product }: { product: ProductPageData }) {
  const { seller } = product;
  const stock = STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock;
  const category = (
    product.category in CATEGORY_LABEL ? product.category : "node"
  ) as StoreCategory;
  const terms = {
    offerPostage: product.offerPostage,
    postageAudCents: product.postageAudCents,
    localPickup: product.localPickup,
    paymentTerms: product.paymentTerms,
  };
  const postage = postageLine(terms);

  return (
    <div className="chapter scene-mesh">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-ash transition-colors hover:text-sun"
        >
          <ArrowLeft className="h-4 w-4" /> back to the store
        </Link>

        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Art panel */}
          <div className="vessel flex items-center justify-center bg-gradient-to-b from-surface/60 to-transparent p-8 md:p-10">
            <ProductArt
              variant={CATEGORY_ART[product.category] ?? "node"}
              className="h-44 w-full max-w-[260px] md:h-56"
            />
          </div>

          {/* Headline + actions */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-mercury">
                {CATEGORY_LABEL[category]}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  stock.tone
                )}
              >
                {stock.label}
              </span>
            </div>
            <h1 className="heading-display mt-2 text-2xl text-gold md:text-3xl">{product.name}</h1>
            <p className="mt-2 text-xl font-medium text-sun md:text-2xl">
              {priceLabel(product.priceAudCents)}
              <span className="ml-2 align-middle text-sm font-normal text-ash">
                {deliverySummary(terms, seller.suburb)}
              </span>
            </p>

            {/* Seller card */}
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-line/70 bg-inset/40 p-3">
              <Avatar src={seller.profile.avatarUrl} name={seller.businessName} size="md" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-medium text-gold">
                  {seller.businessName}
                  {seller.profile.isVerified && (
                    <BadgeCheck
                      className="h-4 w-4 shrink-0 text-mercury"
                      aria-label="Verified member"
                    />
                  )}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 text-xs text-ash">
                  {seller.suburb && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {seller.suburb}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-ok" /> verified antidosis builder
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <MessageSellerSlot product={product} />
              {product.buyUrl && (
                <a
                  href={product.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-[15px] font-medium text-parchment transition-colors hover:border-sun/40 hover:text-sun"
                >
                  <ExternalLink className="h-4 w-4" /> Buy at {displayHostname(product.buyUrl)}
                </a>
              )}
            </div>

            <ol className="mt-4 space-y-1.5 rounded-lg border border-line/50 bg-inset/30 p-3.5 text-xs leading-relaxed text-ash">
              <li>
                <span className="mr-1.5 font-mono text-sun/70">1</span>
                Message the seller — agree price, postage and payment in chat.
              </li>
              <li>
                <span className="mr-1.5 font-mono text-sun/70">2</span>
                Pay the seller directly ({product.paymentTerms.map(paymentTermLabel).join(", ")}).
                Antidosis never processes the payment.
              </li>
              <li>
                <span className="mr-1.5 font-mono text-sun/70">3</span>
                It ships to you{product.localPickup ? " or you pick it up locally" : ""} — done.
              </li>
            </ol>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="vessel p-5">
            <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ash">
              <Package className="h-3.5 w-3.5 text-sun" /> about this item
            </h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-parchment">
              {product.description}
            </p>
            {product.highlights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.highlights.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-mercury/30 bg-mercury/[0.06] px-3 py-1 text-sm text-parchment"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
            {product.specs && (
              <p className="mt-3 border-t border-line/50 pt-3 text-sm leading-relaxed text-ash">
                {product.specs}
              </p>
            )}
          </section>

          <div className="space-y-4">
            <section className="vessel p-5">
              <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ash">
                <Truck className="h-3.5 w-3.5 text-sun" /> delivery
              </h2>
              <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-parchment">
                {postage && <li>{postage}</li>}
                {product.localPickup && (
                  <li>
                    Local pickup{seller.suburb ? ` — ${seller.suburb}` : ""}, arranged in chat
                  </li>
                )}
              </ul>
              {product.postageNote && (
                <p className="mt-2 text-sm text-ash">{product.postageNote}</p>
              )}
            </section>

            <section className="vessel p-5">
              <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ash">
                <Banknote className="h-3.5 w-3.5 text-sun" /> payment
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.paymentTerms.map((term) => (
                  <span
                    key={term}
                    className="rounded-full border border-line bg-inset px-3 py-1 text-sm text-parchment"
                  >
                    {paymentTermLabel(term)}
                  </span>
                ))}
              </div>
              {product.paymentNote && (
                <p className="mt-2 text-sm text-ash">{product.paymentNote}</p>
              )}
              <p className="mt-3 border-t border-line/50 pt-3 text-xs leading-relaxed text-ash/80">
                Payment happens directly with the seller — Antidosis never holds your money.
              </p>
            </section>
          </div>
        </div>

        {/* Fine print + report */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/50 pt-4">
          <p className="max-w-xl text-xs leading-relaxed text-ash/70">
            Antidosis is not the seller of this item. Price, delivery and warranty are between you
            and {seller.businessName} — agree the details in chat before paying.
          </p>
          <ReportButton
            targetType="profile"
            targetId={seller.profile.id}
            detailsPrefix={`Store listing report: "${product.name}" (${product.id})`}
          />
        </div>
      </div>
    </div>
  );
}

function MessageSellerSlot({ product }: { product: ProductPageData }) {
  return (
    <MessageSeller
      sellerProfileId={product.seller.profile.id}
      sellerName={product.seller.businessName}
      defaultMessage={`Hi ${product.seller.businessName} — I'm interested in "${product.name}" (${priceLabel(product.priceAudCents)}) from your mesh store shelf. Is it still available?`}
      loginPath={`/store/product/${product.id}`}
    />
  );
}
