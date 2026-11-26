"use client";

import Link from "next/link";

import { ArrowUpRight, BellRing, ExternalLink } from "lucide-react";

import { displayHostname } from "@/lib/security/link-policy";
import { deliverySummary } from "@/lib/store-delivery";
import { cn } from "@/lib/utils";

import { formatAud } from "./builders-market";
import type { PublicMeshBuilder } from "./builders-market";
import type { InterestKind } from "./interest-form";
import { ProductArt, type ProductArtVariant } from "./product-art";

export type StoreCategory =
  "node" | "gateway" | "kit" | "board" | "antenna" | "power" | "enclosure" | "accessory";

export type StoreItem = {
  key: string;
  /** Live listings have an id and a public product page; flagship concepts don't. */
  id?: string;
  art: ProductArtVariant;
  category: StoreCategory;
  name: string;
  line: string;
  price: string;
  delivery?: string;
  status: { label: string; tone: string };
  builderName?: string;
  buyUrl?: string | null;
  notifyKind?: InterestKind;
  featured?: boolean;
  soldByAntidosis?: boolean;
  stockCount?: number | null;
  image?: string;
};

export const CATEGORY_LABEL: Record<StoreCategory, string> = {
  node: "Nodes",
  gateway: "Home bases",
  kit: "Field kits",
  board: "Boards",
  antenna: "Antennas",
  power: "Power",
  enclosure: "Enclosures",
  accessory: "Accessories",
};

const FLAGSHIP: StoreItem[] = [
  {
    key: "home-base",
    art: "base",
    category: "gateway",
    name: "Home Base",
    line: "A fixed relay that keeps your street on the air, day and night.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "node",
  },
  {
    key: "field-kit",
    art: "kit",
    category: "kit",
    name: "Field Kit",
    line: "Node, battery and solar — for the shed, the boat, the bush.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "node",
  },
  {
    key: "lora-boards",
    art: "board",
    category: "board",
    name: "LoRa Dev Boards",
    line: "Heltec, LilyGo and RAK-class 915 MHz boards for your own build.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "updates",
  },
  {
    key: "antennas",
    art: "antenna",
    category: "antenna",
    name: "915 MHz Antennas",
    line: "Whips, collinears and pigtails — range is antenna-first.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "updates",
  },
  {
    key: "power",
    art: "power",
    category: "power",
    name: "Batteries & Solar",
    line: "18650 packs, holders and panels to keep nodes alive off-grid.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "updates",
  },
  {
    key: "enclosures",
    art: "case",
    category: "enclosure",
    name: "Printed Enclosures",
    line: "3D-printed cases — pocket nodes to weatherproof roof boxes.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "updates",
  },
];

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
  in_stock: { label: "in stock", tone: "text-ok" },
  made_to_order: { label: "made to order", tone: "text-mercury" },
  out_of_stock: { label: "out of stock", tone: "text-ash" },
};

/** Flagship concepts fill empty departments; once a live listing exists in a category, its placeholder steps aside. Live products lead with featured placements first. */
export function buildStoreItems(builders: PublicMeshBuilder[] | null): StoreItem[] {
  const live: StoreItem[] = (builders ?? []).flatMap((builder) =>
    builder.products.map((product) => ({
      key: product.id,
      id: product.id,
      art: CATEGORY_ART[product.category] ?? "node",
      category: (product.category in CATEGORY_LABEL ? product.category : "node") as StoreCategory,
      name: product.name,
      line: product.description,
      price: formatAud(product.priceAudCents),
      delivery: deliverySummary(product, builder.suburb),
      status: STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock,
      builderName: builder.businessName,
      buyUrl: product.buyUrl,
      featured: product.featured === true,
      soldByAntidosis: product.soldByAntidosis === true,
      stockCount: product.stockCount ?? null,
      image: product.images?.[0],
    }))
  );
  const filledCategories = new Set(live.map((item) => item.category));
  const placeholders = FLAGSHIP.filter((item) => !filledCategories.has(item.category));
  const featured = live.filter((item) => item.featured);
  const standard = live.filter((item) => !item.featured);
  return [...featured, ...placeholders, ...standard];
}

function ProductCard({
  item,
  onNotify,
}: {
  item: StoreItem;
  onNotify: (kind: InterestKind) => void;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-void/40 transition-colors hover:border-sun/30",
        item.featured
          ? "border-sun/40 shadow-[0_0_24px_-8px_rgb(var(--c-sun)/0.35)]"
          : "border-line/70"
      )}
    >
      {/* The whole card is the link — this stretched overlay covers it */}
      {item.id && (
        <Link
          href={`/store/product/${item.id}`}
          aria-label={`View ${item.name}`}
          className="absolute inset-0 z-[1] rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun"
        />
      )}
      <div className="flex aspect-square items-center justify-center overflow-hidden border-b border-line/50 bg-gradient-to-b from-surface/50 to-transparent">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ProductArt
            variant={item.art}
            className="h-2/3 w-full max-w-[180px] transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mercury">
            {CATEGORY_LABEL[item.category]}
            {item.featured && (
              <span className="text-sun" title="Featured placement">
                ★ featured
              </span>
            )}
          </span>
          <span className={cn("font-mono text-[10px] uppercase tracking-wider", item.status.tone)}>
            {item.status.label}
          </span>
        </div>
        <h3 className="mt-1.5 text-[15px] font-medium text-gold transition-colors group-hover:text-sun sm:text-base">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-ash">{item.line}</p>
        {item.soldByAntidosis ? (
          <p className="mt-1 text-xs font-medium text-sun">
            sold by antidosis
            {item.stockCount !== null && item.stockCount !== undefined && item.stockCount > 0 && (
              <span className="font-normal text-ash/80"> · {item.stockCount} left</span>
            )}
          </p>
        ) : (
          item.builderName && <p className="mt-1 text-xs text-ash/80">by {item.builderName}</p>
        )}
        {item.delivery && <p className="mt-1.5 text-xs text-mercury/90">{item.delivery}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <span className="text-[15px] font-medium text-sun">{item.price}</span>
          {item.id ? (
            <span className="inline-flex items-center gap-1 text-sm text-ash transition-colors group-hover:text-sun">
              view <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          ) : item.buyUrl ? (
            <a
              href={item.buyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="relative z-[2] inline-flex items-center gap-1.5 rounded bg-sun px-2.5 py-1.5 text-sm font-medium text-void transition-colors hover:bg-sunhi"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {displayHostname(item.buyUrl)}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onNotify(item.notifyKind ?? "node")}
              className="relative z-[2] inline-flex items-center gap-1.5 rounded border border-sun/40 px-2.5 py-1.5 text-sm font-medium text-sun transition-colors hover:bg-sun/10"
            >
              <BellRing className="h-3.5 w-3.5" />
              Notify me
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  items,
  onNotify,
}: {
  items: StoreItem[];
  onNotify: (kind: InterestKind) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ash">
        Nothing in this department yet — check back soon.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {items.map((item) => (
        <ProductCard key={item.key} item={item} onNotify={onNotify} />
      ))}
    </div>
  );
}
