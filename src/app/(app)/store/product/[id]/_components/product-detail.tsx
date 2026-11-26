"use client";

import { useEffect, useState } from "react";

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
  X,
} from "lucide-react";

import { ReportButton } from "@/components/report-button";
import { Avatar } from "@/components/ui/avatar";
import { displayHostname } from "@/lib/security/link-policy";
import { deliverySummary, paymentTermLabel, postageLine } from "@/lib/store-delivery";
import { cn } from "@/lib/utils";

import { OrderPanel } from "./order-panel";
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
  soldByAntidosis: boolean;
  stockCount: number | null;
  images: string[];
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
          {/* Art panel — real photos when the listing has them, SVG otherwise */}
          {product.images.length > 0 ? (
            <ProductGallery name={product.name} images={product.images} />
          ) : (
            <div className="vessel flex items-center justify-center bg-gradient-to-b from-surface/60 to-transparent p-8 md:p-10">
              <ProductArt
                variant={CATEGORY_ART[product.category] ?? "node"}
                className="h-44 w-full max-w-[260px] md:h-56"
              />
            </div>
          )}

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
            {product.soldByAntidosis ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-sun/30 bg-sun/[0.05] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sun/40 bg-void font-mono text-sm text-sun">
                  A
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[15px] font-medium text-gold">
                    Sold by Antidosis
                    <BadgeCheck className="h-4 w-4 shrink-0 text-sun" aria-label="First-party" />
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-ash">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-ok" /> first-party stock — configured,
                      tested and shipped by us
                    </span>
                    {product.stockCount !== null && product.stockCount > 0 && (
                      <span className="text-sun">{product.stockCount} left in this batch</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
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
            )}

            <div className="mt-4 space-y-3">
              {product.soldByAntidosis && product.priceAudCents !== null ? (
                <>
                  <OrderPanel
                    productId={product.id}
                    productName={product.name}
                    priceAudCents={product.priceAudCents}
                    postageAudCents={product.offerPostage ? (product.postageAudCents ?? 0) : 0}
                    loginPath={`/store/product/${product.id}`}
                  />
                  <MessageSellerSlot product={product} />
                </>
              ) : (
                <MessageSellerSlot product={product} />
              )}
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

            {product.soldByAntidosis ? (
              <ol className="mt-4 space-y-1.5 rounded-lg border border-line/50 bg-inset/30 p-3.5 text-xs leading-relaxed text-ash">
                <li>
                  <span className="mr-1.5 font-mono text-sun/70">1</span>
                  Order with your mesh name — the callsign the network will see.
                </li>
                <li>
                  <span className="mr-1.5 font-mono text-sun/70">2</span>
                  Pay by PayID or bank transfer, quoting your order reference.
                </li>
                <li>
                  <span className="mr-1.5 font-mono text-sun/70">3</span>
                  We flash, test and ship — tracking lands in your inbox.
                </li>
              </ol>
            ) : (
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
            )}
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
                {product.soldByAntidosis
                  ? "You pay Antidosis directly by PayID or bank transfer, quoting your order reference — payment is matched to your order before anything ships."
                  : "Payment happens directly with the seller — Antidosis never holds your money."}
              </p>
            </section>
          </div>
        </div>

        {/* Fine print + report */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/50 pt-4">
          <p className="max-w-xl text-xs leading-relaxed text-ash/70">
            {product.soldByAntidosis
              ? "Sold and shipped by Martin Khoury trading as antidosis (ABN 96 557 008 393). Australian Consumer Law applies — faulty units are replaced or refunded. Your unit is configured to your mesh name on the Australia Mid profile (915.075 MHz) before dispatch; re-flashing it yourself to other firmware or profiles is your choice and leaves our setup support."
              : `Antidosis is not the seller of this item. Price, delivery and warranty are between you and ${seller.businessName} — agree the details in chat before paying.`}
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

function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [hoverOrigin, setHoverOrigin] = useState("50% 50%");
  const [hovering, setHovering] = useState(false);
  const [tapZoom, setTapZoom] = useState<{ scale: number; origin: string }>({
    scale: 1,
    origin: "50% 50%",
  });
  const current = images[Math.min(active, images.length - 1)];

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  function trackPointer(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setHoverOrigin(`${x}% ${y}%`);
  }

  function openLightbox() {
    setTapZoom({ scale: 1, origin: "50% 50%" });
    setLightbox(true);
  }

  function toggleTapZoom(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    if (tapZoom.scale > 1) {
      setTapZoom({ scale: 1, origin: "50% 50%" });
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setTapZoom({ scale: 2.2, origin: `${x}% ${y}%` });
  }

  return (
    <div className="vessel overflow-hidden bg-gradient-to-b from-surface/60 to-transparent">
      {/* Main panel: hover magnifies (desktop), tap opens the lightbox (touch) */}
      <button
        type="button"
        onClick={openLightbox}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={trackPointer}
        aria-label={`Enlarge photo ${active + 1} of ${images.length}`}
        className="block aspect-square w-full cursor-zoom-in overflow-hidden p-4"
      >
        {}
        <img
          src={current}
          alt={`${name} — photo ${active + 1} of ${images.length}`}
          className="pointer-events-none max-h-full max-w-full rounded object-contain transition-transform duration-200 ease-out"
          style={
            hovering
              ? { transform: "scale(1.9)", transformOrigin: hoverOrigin }
              : { transform: "scale(1)" }
          }
        />
      </button>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-line/50 p-3">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded border transition-colors",
                index === active
                  ? "border-sun/70 bg-sun/10"
                  : "border-line/60 opacity-70 hover:opacity-100"
              )}
            >
              {}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox: tap the image to toggle deep zoom, tap outside / Esc to close */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo viewer`}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-void/95 p-4 backdrop-blur-sm"
        >
          {}
          <img
            src={current}
            alt={`${name} — enlarged`}
            onClick={toggleTapZoom}
            className={cn(
              "max-h-[92vh] max-w-full rounded object-contain transition-transform duration-200 ease-out",
              tapZoom.scale > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
            )}
            style={{ transform: `scale(${tapZoom.scale})`, transformOrigin: tapZoom.origin }}
          />
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close photo viewer"
            className="absolute right-4 top-4 rounded-full border border-line bg-void/80 p-2 text-ash transition-colors hover:text-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
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
