"use client";

import { BellRing, ExternalLink } from "lucide-react";

import { displayHostname } from "@/lib/security/link-policy";
import { cn } from "@/lib/utils";

import { formatAud } from "./builders-market";
import type { PublicMeshBuilder } from "./builders-market";
import type { InterestKind } from "./interest-form";
import { ProductArt, type ProductArtVariant } from "./product-art";

export type StoreCategory = "node" | "gateway" | "kit" | "accessory";

export type StoreItem = {
  key: string;
  art: ProductArtVariant;
  category: StoreCategory;
  name: string;
  line: string;
  price: string;
  status: { label: string; tone: string };
  builderName?: string;
  buyUrl?: string | null;
  notifyKind?: InterestKind;
};

export const CATEGORY_LABEL: Record<StoreCategory, string> = {
  node: "Nodes",
  gateway: "Home bases",
  kit: "Field kits",
  accessory: "Accessories",
};

const FLAGSHIP: StoreItem[] = [
  {
    key: "antidosis-node",
    art: "node",
    category: "node",
    name: "The Antidosis Node",
    line: "Turn it on — you're on the mesh. Ready out of the box.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "node",
  },
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
];

const CATEGORY_ART: Record<string, ProductArtVariant> = {
  node: "node",
  kit: "kit",
  gateway: "base",
  accessory: "node",
};

const STOCK_LABEL: Record<string, { label: string; tone: string }> = {
  in_stock: { label: "in stock", tone: "text-ok" },
  made_to_order: { label: "made to order", tone: "text-mercury" },
  out_of_stock: { label: "out of stock", tone: "text-ash" },
};

/** Flagship concepts are always on the floor; live builder products join them. */
export function buildStoreItems(builders: PublicMeshBuilder[] | null): StoreItem[] {
  const live: StoreItem[] = (builders ?? []).flatMap((builder) =>
    builder.products.map((product) => ({
      key: product.id,
      art: CATEGORY_ART[product.category] ?? "node",
      category: (product.category in CATEGORY_LABEL ? product.category : "node") as StoreCategory,
      name: product.name,
      line: product.description,
      price: formatAud(product.priceAudCents),
      status: STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock,
      builderName: builder.businessName,
      buyUrl: product.buyUrl,
    }))
  );
  return [...FLAGSHIP, ...live];
}

function ProductCard({
  item,
  onNotify,
}: {
  item: StoreItem;
  onNotify: (kind: InterestKind) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line/70 bg-void/40 transition-colors hover:border-sun/30">
      <div className="border-b border-line/50 bg-gradient-to-b from-surface/50 to-transparent px-3 pt-3">
        <ProductArt
          variant={item.art}
          className="mx-auto h-24 w-full max-w-[180px] transition-transform duration-300 group-hover:scale-[1.04] sm:h-28"
        />
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mercury">
            {CATEGORY_LABEL[item.category]}
          </span>
          <span className={cn("font-mono text-[10px] uppercase tracking-wider", item.status.tone)}>
            {item.status.label}
          </span>
        </div>
        <h3 className="mt-1.5 text-[15px] font-medium text-gold sm:text-base">{item.name}</h3>
        <p className="mt-1 text-sm leading-snug text-ash">{item.line}</p>
        {item.builderName && <p className="mt-1 text-xs text-ash/80">by {item.builderName}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <span className="text-[15px] font-medium text-sun">{item.price}</span>
          {item.buyUrl ? (
            <a
              href={item.buyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 rounded bg-sun px-2.5 py-1.5 text-sm font-medium text-void transition-colors hover:bg-sunhi"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {displayHostname(item.buyUrl)}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onNotify(item.notifyKind ?? "node")}
              className="inline-flex items-center gap-1.5 rounded border border-sun/40 px-2.5 py-1.5 text-sm font-medium text-sun transition-colors hover:bg-sun/10"
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
