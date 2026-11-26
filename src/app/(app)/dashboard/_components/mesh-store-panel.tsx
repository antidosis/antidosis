"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Store,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { MeshPaymentTerm } from "@/lib/schemas/store";
import { deliverySummary, paymentTermLabel } from "@/lib/store-delivery";
import { EXTRA_SLOT_MONTHLY_AUD, FREE_PRODUCT_SLOTS } from "@/lib/store-slots";
import { cn } from "@/lib/utils";

type MeshProduct = {
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
};

type MeshBuilder = {
  id: string;
  businessName: string;
  suburb: string | null;
  website: string | null;
  description: string;
  status: string;
  reviewNote: string | null;
  products: MeshProduct[];
  slotLimit?: number;
};

const inputClass =
  "w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun";

const CATEGORIES = [
  { value: "node", label: "Node (complete)" },
  { value: "kit", label: "Kit" },
  { value: "gateway", label: "Gateway / home base" },
  { value: "board", label: "Board (LoRa dev board)" },
  { value: "antenna", label: "Antenna / cable" },
  { value: "power", label: "Power (battery / solar)" },
  { value: "enclosure", label: "Enclosure (3D-printed case)" },
  { value: "accessory", label: "Accessory" },
];

const STOCK_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "made_to_order", label: "Made to order" },
  { value: "out_of_stock", label: "Out of stock" },
];

const PAYMENT_OPTIONS: { value: MeshPaymentTerm; label: string }[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "payid", label: "PayID" },
  { value: "cash_on_pickup", label: "Cash on pickup" },
  { value: "card_checkout", label: "Card via my checkout link" },
];

const STATUS_UI: Record<string, { label: string; tone: string; body: string }> = {
  pending: {
    label: "in review",
    tone: "border-sun/40 bg-sun/[0.05]",
    body: "We review builder applications manually — hardware specs, range-test evidence and buyer support terms. Products unlock once approved.",
  },
  approved: {
    label: "approved — live",
    tone: "border-ok/40 bg-ok/[0.05]",
    body: "Your shelf is live in the mesh store. Keep pricing, stock and links current.",
  },
  rejected: {
    label: "rejected",
    tone: "border-bad/40 bg-bad/[0.05]",
    body: "Your application wasn't approved. Edit your details below to resubmit — it goes back into the review queue automatically.",
  },
  suspended: {
    label: "suspended",
    tone: "border-bad/40 bg-bad/[0.05]",
    body: "This listing is suspended. Contact support to resolve it.",
  },
};

type ProductDraft = {
  name: string;
  category: string;
  description: string;
  specs: string;
  price: string;
  stockStatus: string;
  buyUrl: string;
  offerPostage: boolean;
  postage: string;
  localPickup: boolean;
  postageNote: string;
  paymentTerms: string[];
  paymentNote: string;
  highlights: string[];
};

const EMPTY_DRAFT: ProductDraft = {
  name: "",
  category: "node",
  description: "",
  specs: "",
  price: "",
  stockStatus: "in_stock",
  buyUrl: "",
  offerPostage: true,
  postage: "",
  localPickup: false,
  postageNote: "",
  paymentTerms: ["bank_transfer"],
  paymentNote: "",
  highlights: [],
};

function draftFromProduct(product: MeshProduct): ProductDraft {
  return {
    name: product.name,
    category: product.category,
    description: product.description,
    specs: product.specs ?? "",
    price: product.priceAudCents === null ? "" : (product.priceAudCents / 100).toString(),
    stockStatus: product.stockStatus,
    buyUrl: product.buyUrl ?? "",
    offerPostage: product.offerPostage,
    postage: product.postageAudCents === null ? "" : (product.postageAudCents / 100).toString(),
    localPickup: product.localPickup,
    postageNote: product.postageNote ?? "",
    paymentTerms: product.paymentTerms,
    paymentNote: product.paymentNote ?? "",
    highlights: product.highlights,
  };
}

function draftIsValid(draft: ProductDraft): boolean {
  if (draft.name.trim().length < 3 || draft.description.trim().length < 20) return false;
  if (draft.price !== "" && Number.isNaN(Number(draft.price))) return false;
  if (!draft.offerPostage && !draft.localPickup) return false;
  if (draft.offerPostage && draft.postage !== "" && Number.isNaN(Number(draft.postage))) {
    return false;
  }
  return draft.paymentTerms.length > 0;
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-parchment">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[rgb(var(--c-sun))]"
      />
      {label}
    </label>
  );
}

function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  initial: ProductDraft;
  onSubmit: (draft: ProductDraft) => Promise<boolean>;
  onCancel?: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [chipInput, setChipInput] = useState("");
  const set = (key: keyof ProductDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const setFlag = (key: "offerPostage" | "localPickup") => (value: boolean) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function addChip() {
    const chip = chipInput.trim().slice(0, 40);
    if (!chip) return;
    setDraft((current) =>
      current.highlights.includes(chip) || current.highlights.length >= 6
        ? current
        : { ...current, highlights: [...current.highlights, chip] }
    );
    setChipInput("");
  }

  function removeChip(chip: string) {
    setDraft((current) => ({
      ...current,
      highlights: current.highlights.filter((value) => value !== chip),
    }));
  }

  function toggleTerm(term: string) {
    setDraft((current) => ({
      ...current,
      paymentTerms: current.paymentTerms.includes(term)
        ? current.paymentTerms.filter((value) => value !== term)
        : [...current.paymentTerms, term],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await onSubmit(draft);
    if (ok) setDraft(EMPTY_DRAFT);
  }

  const priceInvalid = draft.price !== "" && Number.isNaN(Number(draft.price));
  const postageInvalid =
    draft.offerPostage && draft.postage !== "" && Number.isNaN(Number(draft.postage));

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Basics */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">
            Product name <span className="text-sun">*</span>
          </span>
          <input
            type="text"
            required
            value={draft.name}
            onChange={(event) => set("name")(event.target.value)}
            placeholder="e.g. CoastMesh Field Node — T-Beam 915"
            className={inputClass}
            maxLength={120}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-parchment">Category</span>
            <select
              value={draft.category}
              onChange={(event) => set("category")(event.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-parchment">Stock</span>
            <select
              value={draft.stockStatus}
              onChange={(event) => set("stockStatus")(event.target.value)}
              className={inputClass}
            >
              {STOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">
            Description <span className="text-sun">*</span>
          </span>
          <textarea
            required
            value={draft.description}
            onChange={(event) => set("description")(event.target.value)}
            rows={3}
            placeholder="What it is, who it's for, what's included… (min 20 characters)"
            className={inputClass}
            maxLength={1500}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">Specs</span>
          <textarea
            value={draft.specs}
            onChange={(event) => set("specs")(event.target.value)}
            rows={2}
            placeholder="Board · antenna · battery · enclosure — shown verbatim on your listing"
            className={inputClass}
            maxLength={1000}
          />
        </label>
        <div className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-parchment">
            Highlights{" "}
            <span className="text-ash/60">(optional — battery life, range, frequency…)</span>
          </span>
          {draft.highlights.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {draft.highlights.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-mercury/30 bg-mercury/[0.06] px-2.5 py-1 text-xs text-parchment"
                >
                  {chip}
                  <button
                    type="button"
                    onClick={() => removeChip(chip)}
                    className="text-ash hover:text-bad"
                    aria-label={`Remove ${chip}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={chipInput}
              onChange={(event) => setChipInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addChip();
                }
              }}
              placeholder="e.g. 7-day battery, 5 km tested range, 915 MHz"
              className={inputClass}
              maxLength={40}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addChip}
              disabled={!chipInput.trim() || draft.highlights.length >= 6}
            >
              Add
            </Button>
          </div>
          <span className="mt-1 block text-xs text-ash/60">
            Up to 6 short chips — the details buyers scan first.
          </span>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">Price (AUD)</span>
          <input
            type="text"
            inputMode="decimal"
            value={draft.price}
            onChange={(event) => set("price")(event.target.value)}
            placeholder="Blank = price on application"
            className={inputClass}
          />
          {priceInvalid && <span className="mt-1 block text-xs text-bad">Enter a number</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-parchment">Buy link</span>
          <input
            type="url"
            value={draft.buyUrl}
            onChange={(event) => set("buyUrl")(event.target.value)}
            placeholder="https://… your own checkout (no shorteners)"
            className={inputClass}
            maxLength={500}
          />
        </label>
      </div>

      {/* Delivery */}
      <fieldset className="rounded-lg border border-line/70 bg-inset/30 p-4">
        <legend className="flex items-center gap-1.5 px-1 font-mono text-xs uppercase tracking-[0.16em] text-ash">
          <Truck className="h-3.5 w-3.5 text-sun" /> delivery
        </legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox
            checked={draft.offerPostage}
            onChange={setFlag("offerPostage")}
            label="Postage (Australia-wide)"
          />
          <Checkbox
            checked={draft.localPickup}
            onChange={setFlag("localPickup")}
            label="Local pickup"
          />
        </div>
        {!draft.offerPostage && !draft.localPickup && (
          <p className="mt-2 text-xs text-bad">
            Offer postage, local pickup, or both — buyers need a way to receive it.
          </p>
        )}
        {draft.offerPostage && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-parchment">Flat postage cost (AUD)</span>
              <input
                type="text"
                inputMode="decimal"
                value={draft.postage}
                onChange={(event) => set("postage")(event.target.value)}
                placeholder="0 = free · blank = work it out in chat"
                className={inputClass}
              />
              {postageInvalid && (
                <span className="mt-1 block text-xs text-bad">Enter a number</span>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-parchment">Delivery note</span>
              <input
                type="text"
                value={draft.postageNote}
                onChange={(event) => set("postageNote")(event.target.value)}
                placeholder="e.g. AusPost tracked, ships in 2 business days"
                className={inputClass}
                maxLength={300}
              />
            </label>
          </div>
        )}
      </fieldset>

      {/* Payment */}
      <fieldset className="rounded-lg border border-line/70 bg-inset/30 p-4">
        <legend className="flex items-center gap-1.5 px-1 font-mono text-xs uppercase tracking-[0.16em] text-ash">
          <Banknote className="h-3.5 w-3.5 text-sun" /> payment you accept
        </legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PAYMENT_OPTIONS.map((option) => (
            <Checkbox
              key={option.value}
              checked={draft.paymentTerms.includes(option.value)}
              onChange={() => toggleTerm(option.value)}
              label={option.label}
            />
          ))}
        </div>
        {draft.paymentTerms.length === 0 && (
          <p className="mt-2 text-xs text-bad">Pick at least one way buyers can pay you.</p>
        )}
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm text-parchment">Payment note</span>
          <input
            type="text"
            value={draft.paymentNote}
            onChange={(event) => set("paymentNote")(event.target.value)}
            placeholder="e.g. PayID sent once you message me — never pay before we agree details"
            className={inputClass}
            maxLength={300}
          />
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting || !draftIsValid(draft)}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

/** Visual slot meter: free slots in sun, rented/granted extras in mercury. */
function SlotPips({ used, limit }: { used: number; limit: number }) {
  if (limit > 12) {
    return (
      <span className="font-mono text-sm text-parchment">
        {used} of {limit} slots used
      </span>
    );
  }
  return (
    <span
      className="flex flex-wrap items-center gap-1.5"
      aria-label={`${used} of ${limit} slots used`}
    >
      {Array.from({ length: limit }, (_, index) => {
        const isExtra = index >= FREE_PRODUCT_SLOTS;
        const filled = index < used;
        return (
          <span
            key={index}
            title={isExtra ? "Extra slot" : "Free slot"}
            className={cn(
              "h-3.5 w-3.5 rounded-sm border",
              filled
                ? isExtra
                  ? "border-mercury bg-mercury/70"
                  : "border-sun bg-sun/70"
                : isExtra
                  ? "border-mercury/40 bg-transparent"
                  : "border-sun/40 bg-transparent"
            )}
          />
        );
      })}
    </span>
  );
}

/**
 * Mesh Store — the member's builder workspace: application status, shelf
 * plan (slots + pricing), listing details, and the product shelf shown
 * publicly at /store.
 */
export function MeshStorePanel() {
  const { toast } = useToast();
  const [builder, setBuilder] = useState<MeshBuilder | null>(null);
  const [slotRequestPending, setSlotRequestPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestingSlot, setRequestingSlot] = useState(false);
  const [details, setDetails] = useState({
    businessName: "",
    suburb: "",
    website: "",
    description: "",
  });

  const load = useCallback(async () => {
    try {
      const [builderRes, supportRes] = await Promise.all([
        fetch("/api/v1/store/builders/mine"),
        fetch("/api/v1/support"),
      ]);
      if (builderRes.status === 404) {
        setBuilder(null);
        return;
      }
      if (!builderRes.ok) throw new Error("Your builder record could not be loaded");
      const data = await builderRes.json();
      setBuilder(data.builder ?? null);
      if (data.builder) {
        setDetails({
          businessName: data.builder.businessName,
          suburb: data.builder.suburb ?? "",
          website: data.builder.website ?? "",
          description: data.builder.description,
        });
      }
      if (supportRes.ok) {
        const support = await supportRes.json();
        setSlotRequestPending(
          (support.requests ?? []).some(
            (request: { subject: string; status: string }) =>
              request.subject === "mesh_store" &&
              (request.status === "open" || request.status === "in_progress")
          )
        );
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Your builder record could not be loaded",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch; setState lives inside the async loader
    void load();
  }, [load]);

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/store/builders/mine", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: details.businessName,
          suburb: details.suburb || null,
          website: details.website || null,
          description: details.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast("Builder details saved", "success");
      setEditingDetails(false);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitProduct(draft: ProductDraft, productId?: string): Promise<boolean> {
    setSubmitting(true);
    try {
      const payload = {
        name: draft.name,
        category: draft.category,
        description: draft.description,
        specs: draft.specs || null,
        priceAud: draft.price === "" ? null : Number(draft.price),
        stockStatus: draft.stockStatus,
        buyUrl: draft.buyUrl || null,
        offerPostage: draft.offerPostage,
        postageAud: !draft.offerPostage || draft.postage === "" ? null : Number(draft.postage),
        localPickup: draft.localPickup,
        postageNote: draft.postageNote || null,
        paymentTerms: draft.paymentTerms,
        paymentNote: draft.paymentNote || null,
        highlights: draft.highlights,
      };
      const res = await fetch(
        productId ? `/api/v1/store/products/${productId}` : "/api/v1/store/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(productId ? "Listing updated" : "Listing added to your shelf", "success");
      setAddingProduct(false);
      setEditingProduct(null);
      await load();
      return true;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteProduct(product: MeshProduct) {
    if (!window.confirm(`Remove “${product.name}” from your shelf?`)) return;
    try {
      const res = await fetch(`/api/v1/store/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast("Listing removed", "success");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function requestExtraSlot() {
    if (!builder) return;
    setRequestingSlot(true);
    try {
      const limit = builder.slotLimit ?? FREE_PRODUCT_SLOTS;
      const res = await fetch("/api/v1/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "mesh_store",
          message: `Extra product slot request — ${builder.businessName} is using ${builder.products.length} of ${limit} shelf slots and wants to list more. (Pilot: grant via admin → mesh store → adjust extra slots.)`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed — try again");
      setSlotRequestPending(true);
      toast("Slot request sent — we switch extras on manually during the pilot", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Request failed — try again", "error");
    } finally {
      setRequestingSlot(false);
    }
  }

  if (loading) {
    return (
      <div className="vessel flex items-center justify-center gap-2 p-10 text-sm text-ash">
        <Loader2 className="h-4 w-4 animate-spin" /> loading your builder record…
      </div>
    );
  }

  if (!builder) {
    return (
      <div className="vessel p-8 text-center md:p-10">
        <Store className="mx-auto h-8 w-8 text-mercury" />
        <h3 className="heading-display mt-4 text-xl text-gold">Sell nodes to your neighbours</h3>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ash">
          Verified mesh builders get a public product shelf in the store and buyer referrals from
          the platform. Apply from the store page — applications are reviewed manually.
        </p>
        <Button asChild className="mt-5">
          <Link href="/store#builders">Apply as a mesh builder</Link>
        </Button>
      </div>
    );
  }

  const status = STATUS_UI[builder.status] ?? STATUS_UI.pending;
  const slotLimit = builder.slotLimit ?? FREE_PRODUCT_SLOTS;
  const used = builder.products.length;
  const shelfFull = used >= slotLimit;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn("rounded-lg border p-5", status.tone)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-medium text-gold">
            {builder.status === "approved" ? (
              <CheckCircle2 className="h-5 w-5 text-ok" />
            ) : builder.status === "pending" ? (
              <Clock className="h-5 w-5 text-sun" />
            ) : (
              <XCircle className="h-5 w-5 text-bad" />
            )}
            {builder.businessName}
          </h3>
          <Badge variant="outline">{status.label}</Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ash">{status.body}</p>
        {builder.reviewNote && (
          <p className="mt-2 rounded-md border border-line bg-inset/50 px-3 py-2 text-sm text-parchment">
            Reviewer note: {builder.reviewNote}
          </p>
        )}
        {builder.status === "approved" && (
          <Link
            href="/store#shop"
            className="mt-3 inline-block text-sm text-mercury underline-offset-4 hover:underline"
          >
            View your live shelf in the store →
          </Link>
        )}
      </div>

      {/* How selling works — the ground rules, always visible to approved builders */}
      {builder.status === "approved" && (
        <div className="vessel p-5 md:p-6">
          <h3 className="text-lg font-medium text-gold">How selling works</h3>
          <ol className="mt-3 grid gap-3 text-sm leading-relaxed text-ash sm:grid-cols-2">
            <li className="flex gap-2.5">
              <span className="font-mono text-sun/70">1</span>
              List your gear with price, delivery options and the payment methods you accept.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-sun/70">2</span>
              Buyers message you through Relay (it lands in your inbox and notifications) — agree
              the final price, postage and payment details in chat.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-sun/70">3</span>
              The buyer pays <span className="text-parchment">you directly</span> — bank transfer,
              PayID, cash on pickup or your own checkout link. Antidosis never processes the
              payment, never holds funds, and takes no cut during the pilot.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-sun/70">4</span>
              Ship it or meet up, then keep your stock status current so buyers aren&apos;t chasing
              sold items.
            </li>
          </ol>
          <p className="mt-3 rounded-md border border-line/60 bg-inset/40 px-3 py-2 text-xs leading-relaxed text-ash/80">
            Safety: keep negotiations in Relay so both sides stay protected, never share your
            PayID/bank details publicly (chat only, once agreed), and report suspicious buyers from
            their profile.
          </p>
        </div>
      )}

      {/* Shelf plan — slots + pricing, always visible */}
      <div className="vessel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-medium text-gold">Shelf plan</h3>
          <SlotPips used={used} limit={slotLimit} />
        </div>
        <p className="mt-1 font-mono text-xs text-ash">
          {used} of {slotLimit} slots used
          {slotLimit > FREE_PRODUCT_SLOTS
            ? ` (${slotLimit - FREE_PRODUCT_SLOTS} extra granted)`
            : ""}
        </p>
        <div className="mt-3 grid gap-3 text-sm leading-relaxed text-ash sm:grid-cols-2">
          <p className="rounded-md border border-sun/25 bg-sun/[0.04] px-3 py-2.5">
            <span className="font-medium text-sun">{FREE_PRODUCT_SLOTS} slots free</span> with every
            builder account — list your main products at no cost, forever.
          </p>
          <p className="rounded-md border border-mercury/25 bg-mercury/[0.04] px-3 py-2.5">
            <span className="font-medium text-mercury">
              Extra slots AU${EXTRA_SLOT_MONTHLY_AUD}/month each
            </span>{" "}
            when slot rentals launch — <span className="text-parchment">free during the pilot</span>
            , just ask.
          </p>
        </div>

        {shelfFull && builder.status === "approved" && (
          <div className="mt-4 rounded-lg border border-sun/30 bg-sun/[0.05] p-4">
            <p className="text-[15px] font-medium text-gold">Your shelf is full</p>
            <p className="mt-1 text-sm leading-relaxed text-ash">
              You&apos;re using all {slotLimit} slots. Need room for another product? Request an
              extra slot — AU${EXTRA_SLOT_MONTHLY_AUD}/month once rentals launch,{" "}
              <span className="text-parchment">free while the pilot runs</span>.
            </p>
            {slotRequestPending ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-ok">
                <CheckCircle2 className="h-4 w-4" /> Slot request received — we switch extras on
                manually during the pilot, usually within a day. Track it in Support &amp; Report.
              </p>
            ) : (
              <Button
                size="sm"
                className="mt-3"
                onClick={requestExtraSlot}
                disabled={requestingSlot}
              >
                {requestingSlot && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" /> Request an extra slot
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="vessel p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gold">Listing details</h3>
          {!editingDetails && builder.status !== "suspended" && (
            <Button size="sm" variant="ghost" onClick={() => setEditingDetails(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
        {editingDetails ? (
          <form onSubmit={saveDetails} className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-parchment">Builder name</span>
              <input
                type="text"
                required
                value={details.businessName}
                onChange={(event) =>
                  setDetails((current) => ({ ...current, businessName: event.target.value }))
                }
                className={inputClass}
                maxLength={160}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-parchment">Suburb</span>
              <input
                type="text"
                value={details.suburb}
                onChange={(event) =>
                  setDetails((current) => ({ ...current, suburb: event.target.value }))
                }
                className={inputClass}
                maxLength={120}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm text-parchment">Website or store link</span>
              <input
                type="url"
                value={details.website}
                onChange={(event) =>
                  setDetails((current) => ({ ...current, website: event.target.value }))
                }
                className={inputClass}
                maxLength={500}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm text-parchment">Description</span>
              <textarea
                required
                value={details.description}
                onChange={(event) =>
                  setDetails((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                className={inputClass}
                maxLength={2000}
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save details
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditingDetails(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ash">Suburb</dt>
              <dd className="text-parchment">{builder.suburb ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ash">Website</dt>
              <dd className="text-parchment">{builder.website ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ash">Description</dt>
              <dd className="whitespace-pre-line leading-relaxed text-parchment">
                {builder.description}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Product shelf */}
      <div className="vessel p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-medium text-gold">Product shelf</h3>
          {builder.status === "approved" && !addingProduct && !shelfFull && (
            <Button size="sm" onClick={() => setAddingProduct(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add product
            </Button>
          )}
        </div>

        {builder.status !== "approved" && (
          <p className="mb-4 rounded-md border border-dashed border-line px-4 py-3 text-sm text-ash">
            Products unlock once your application is approved.
          </p>
        )}

        {addingProduct && (
          <div className="mb-5 rounded-lg border border-sun/25 bg-sun/[0.03] p-4">
            <ProductForm
              initial={EMPTY_DRAFT}
              onSubmit={(draft) => submitProduct(draft)}
              onCancel={() => setAddingProduct(false)}
              submitting={submitting}
              submitLabel="Add to shelf"
            />
          </div>
        )}

        {builder.products.length === 0 && !addingProduct ? (
          <p className="flex items-center gap-2 py-4 text-sm text-ash">
            <PackageOpen className="h-4 w-4" /> Nothing on your shelf yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {builder.products.map((product) => (
              <li key={product.id} className="rounded-lg border border-line/70 bg-inset/40 p-4">
                {editingProduct === product.id ? (
                  <ProductForm
                    initial={draftFromProduct(product)}
                    onSubmit={(draft) => submitProduct(draft, product.id)}
                    onCancel={() => setEditingProduct(null)}
                    submitting={submitting}
                    submitLabel="Save listing"
                  />
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gold">{product.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-ash">
                        {product.category} ·{" "}
                        {product.priceAudCents === null
                          ? "POA"
                          : `AU$${(product.priceAudCents / 100).toFixed(2)}`}{" "}
                        · {product.stockStatus.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 text-xs text-mercury/90">
                        {deliverySummary(product, builder.suburb)}
                      </p>
                      {product.paymentTerms.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-1.5">
                          {product.paymentTerms.map((term) => (
                            <span
                              key={term}
                              className="rounded-full border border-line bg-inset px-2 py-0.5 text-[11px] text-parchment"
                            >
                              {paymentTermLabel(term)}
                            </span>
                          ))}
                        </p>
                      )}
                      {product.highlights.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-1.5">
                          {product.highlights.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full border border-mercury/30 bg-mercury/[0.06] px-2 py-0.5 text-[11px] text-parchment"
                            >
                              {chip}
                            </span>
                          ))}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-sm text-ash">{product.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {builder.status === "approved" && (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/store/product/${product.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View {product.name} live</span>
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingProduct(product.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {product.name}</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteProduct(product)}>
                        <Trash2 className="h-4 w-4 text-bad" />
                        <span className="sr-only">Delete {product.name}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
