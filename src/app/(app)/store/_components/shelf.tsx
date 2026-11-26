"use client";

import { BellRing, ExternalLink } from "lucide-react";

import { displayHostname } from "@/lib/security/link-policy";
import { cn } from "@/lib/utils";

import type { PublicMeshBuilder } from "./builders-market";
import { formatAud } from "./builders-market";
import type { InterestKind } from "./interest-form";
import { ProductArt, type ProductArtVariant } from "./product-art";

type ShelfItem = {
  key: string;
  art: ProductArtVariant;
  chip: string;
  name: string;
  line: string;
  price: string;
  status: { label: string; tone: string };
  builderName?: string;
  buyUrl?: string | null;
  notifyKind?: InterestKind;
};

const FLAGSHIP: ShelfItem[] = [
  {
    key: "antidosis-node",
    art: "node",
    chip: "flagship",
    name: "The Antidosis Node",
    line: "Turn it on — you're on the mesh. Pre-configured, ready out of the box.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "node",
  },
  {
    key: "home-base",
    art: "base",
    chip: "home base",
    name: "Home Base",
    line: "A fixed relay that keeps your street on the air, day and night.",
    price: "Pilot pricing soon",
    status: { label: "coming soon", tone: "text-sun" },
    notifyKind: "node",
  },
  {
    key: "field-kit",
    art: "kit",
    chip: "field kit",
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

function ShelfCard({
  item,
  onNotify,
}: {
  item: ShelfItem;
  onNotify: (kind: InterestKind) => void;
}) {
  return (
    <article className="vessel group flex flex-col overflow-hidden transition-colors hover:border-sun/30">
      <div className="relative border-b border-line/60 bg-gradient-to-b from-surface/60 to-inset/40 px-4 pt-4">
        <ProductArt
          variant={item.art}
          className="mx-auto h-32 w-full max-w-[220px] transition-transform duration-300 group-hover:scale-[1.03] sm:h-36"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mercury">
            {item.chip}
          </span>
          <span className={cn("font-mono text-[10px] uppercase tracking-wider", item.status.tone)}>
            {item.status.label}
          </span>
        </div>
        <h3 className="mt-2 text-base font-medium text-gold sm:text-lg">{item.name}</h3>
        <p className="mt-1 text-[15px] leading-snug text-ash">{item.line}</p>
        {item.builderName && <p className="mt-1.5 text-xs text-ash/80">by {item.builderName}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <span className="text-base font-medium text-sun">{item.price}</span>
          {item.buyUrl ? (
            <a
              href={item.buyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 rounded bg-sun px-3 py-2 text-sm font-medium text-void transition-colors hover:bg-sunhi"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {displayHostname(item.buyUrl)}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onNotify(item.notifyKind ?? "node")}
              className="inline-flex items-center gap-1.5 rounded border border-sun/40 px-3 py-2 text-sm font-medium text-sun transition-colors hover:bg-sun/10"
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

/**
 * The store shelf. Flagship concepts are always on display so the store
 * never looks empty; approved builders' live products join the same grid.
 */
export function Shelf({
  builders,
  onNotify,
}: {
  builders: PublicMeshBuilder[] | null;
  onNotify: (kind: InterestKind) => void;
}) {
  const liveItems: ShelfItem[] = (builders ?? []).flatMap((builder) =>
    builder.products.map((product) => ({
      key: product.id,
      art: CATEGORY_ART[product.category] ?? "node",
      chip: product.category,
      name: product.name,
      line: product.description,
      price: formatAud(product.priceAudCents),
      status: STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL.in_stock,
      builderName: builder.businessName,
      buyUrl: product.buyUrl,
    }))
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {[...FLAGSHIP, ...liveItems].map((item) => (
        <ShelfCard key={item.key} item={item} onNotify={onNotify} />
      ))}
    </div>
  );
}
