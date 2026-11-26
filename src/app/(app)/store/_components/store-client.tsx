"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { ArrowRight, Package, Power, RadioTower } from "lucide-react";

import { SellPanel, SellersList } from "./builders-market";
import type { PublicMeshBuilder } from "./builders-market";
import { InterestForm } from "./interest-form";
import type { InterestKind } from "./interest-form";
import { MeshVisual } from "./mesh-visual";
import { ProductArt } from "./product-art";
import type { ProductArtVariant } from "./product-art";
import { buildStoreItems } from "./product-grid";
import { Shop } from "./shop";
import type { StoreFilter, StorePopup } from "./shop";
import { StoreModal } from "./store-modal";

const HOW_STEPS = [
  {
    icon: Package,
    title: "Get a node",
    body: "One small device from the floor — or any Meshtastic device you already own.",
  },
  {
    icon: Power,
    title: "Turn it on",
    body: "No SIM. No Wi-Fi. No internet. It talks to other nodes over licence-free radio.",
  },
  {
    icon: RadioTower,
    title: "You're connected",
    body: "Message your neighbours and trade — even in a blackout or a dead zone.",
  },
];

const DEPARTMENTS: { id: StoreFilter; art: ProductArtVariant; label: string }[] = [
  { id: "node", art: "node", label: "Nodes" },
  { id: "gateway", art: "base", label: "Home bases" },
  { id: "kit", art: "kit", label: "Field kits" },
];

/**
 * The mesh store. The banner is the shopfront window; below it, department
 * tiles filter a framed shop floor. Everything informational — how it works,
 * channel access, sellers, selling, the mailing list — lives in popups, so
 * the page itself is just the store.
 */
export function StoreClient() {
  const [builders, setBuilders] = useState<PublicMeshBuilder[] | null>(null);
  const [filter, setFilter] = useState<StoreFilter>("all");
  const [popup, setPopup] = useState<StorePopup | null>(null);
  const [interestKind, setInterestKind] = useState<InterestKind>("node");

  const loadBuilders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/store/builders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuilders(data.builders ?? []);
    } catch {
      setBuilders((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount; setState lives inside the async loader
    void loadBuilders();
  }, [loadBuilders]);

  function openInterest(kind: InterestKind) {
    setInterestKind(kind);
    setPopup("list");
  }

  function pickDepartment(id: StoreFilter) {
    setFilter((current) => (current === id ? "all" : id));
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const items = buildStoreItems(builders);

  return (
    <div className="chapter scene-mesh">
      <div className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
        {/* Hero — the banner members asked to keep */}
        <div className="pt-8 md:pt-12">
          <p className="mb-4 font-mono text-xs text-ash">» STORE — OFF-GRID HARDWARE</p>
          <div className="vessel relative overflow-hidden">
            <MeshVisual className="h-72 w-full md:h-[26rem]" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="heading-display text-2xl text-gold md:text-4xl">
                when the internet stops,
                <br />
                <span className="text-sun">the mesh doesn&apos;t.</span>
              </p>
              <p className="mt-3 max-w-md text-sm text-ash md:text-base">
                Every dot is a neighbour. Every line is a message finding its way home.
              </p>
              <div className="pointer-events-auto mt-6">
                <a
                  href="#shop"
                  className="inline-flex items-center gap-2 rounded bg-sun px-5 py-2.5 text-[15px] font-medium text-void transition-colors hover:bg-sunhi"
                >
                  Enter the store <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Department tiles — filters, three-up on every screen */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => pickDepartment(dept.id)}
              aria-pressed={filter === dept.id}
              className={`vessel group flex flex-col items-center px-2 py-3 transition-colors sm:py-4 ${
                filter === dept.id ? "border-sun/50 bg-sun/[0.05]" : "hover:border-sun/25"
              }`}
            >
              <ProductArt
                variant={dept.art}
                className="h-14 w-full max-w-[110px] transition-transform duration-300 group-hover:scale-105 sm:h-16"
              />
              <span
                className={`mt-1 text-[13px] font-medium sm:text-[15px] ${
                  filter === dept.id ? "text-sun" : "text-gold"
                }`}
              >
                {dept.label}
              </span>
            </button>
          ))}
        </div>

        {/* The shop */}
        <div id="shop" className="mt-6 scroll-mt-24">
          <Shop
            builders={builders}
            items={items}
            filter={filter}
            onFilterChange={setFilter}
            onNotify={openInterest}
            onOpenPopup={setPopup}
          />
        </div>

        {/* Fine print */}
        <p className="mt-10 text-center text-sm leading-relaxed text-ash/70">
          915–928 MHz ISM in Australia is licence-free under ACMA LIPD class conditions. Antidosis
          is not the seller of builder-listed products — pricing, warranty and delivery are between
          you and the builder.{" "}
          <Link href="/safety" className="underline-offset-4 hover:text-gold hover:underline">
            How we keep the platform safe
          </Link>
          .
        </p>
      </div>

      {/* Popups — everything informational lives here */}
      {popup === "how" && (
        <StoreModal title="How it works" onClose={() => setPopup(null)}>
          <div className="space-y-4">
            {HOW_STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sun/30 bg-sun/[0.06]">
                  <step.icon className="h-5 w-5 text-sun" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-gold">
                    <span className="mr-1.5 font-mono text-xs text-sun/60">0{i + 1}</span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ash">{step.body}</p>
                </div>
              </div>
            ))}
            <p className="border-t border-line/50 pt-3 text-sm text-ash">
              If you can pair Bluetooth headphones, you can do this. Full setup guide ships with
              every node.
            </p>
          </div>
        </StoreModal>
      )}

      {popup === "byo" && (
        <StoreModal title="Already have a device?" onClose={() => setPopup(null)}>
          <p className="mb-4 text-sm leading-relaxed text-ash">
            Any Meshtastic-compatible node joins the antidosis channel — five-minute setup, no
            firmware changes. Tell us your model and we&apos;ll send channel access.
          </p>
          <InterestForm key="byo" initialKind="byo_device" />
        </StoreModal>
      )}

      {popup === "sellers" && (
        <StoreModal title="Verified sellers" onClose={() => setPopup(null)} wide>
          <SellersList builders={builders} />
        </StoreModal>
      )}

      {popup === "sell" && (
        <StoreModal title="Sell in this store" onClose={() => setPopup(null)} wide>
          <SellPanel onApplied={loadBuilders} />
        </StoreModal>
      )}

      {popup === "list" && (
        <StoreModal title="Get on the list" onClose={() => setPopup(null)}>
          <InterestForm key={interestKind} initialKind={interestKind} />
        </StoreModal>
      )}
    </div>
  );
}
