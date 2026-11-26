"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Clock,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
};

const EMPTY_DRAFT: ProductDraft = {
  name: "",
  category: "node",
  description: "",
  specs: "",
  price: "",
  stockStatus: "in_stock",
  buyUrl: "",
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
  };
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
  const set = (key: keyof ProductDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await onSubmit(draft);
    if (ok) setDraft(EMPTY_DRAFT);
  }

  const priceInvalid = draft.price !== "" && Number.isNaN(Number(draft.price));

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
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
          placeholder="Board · antenna · battery · enclosure — shown verbatim on your shelf"
          className={inputClass}
          maxLength={1000}
        />
      </label>
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
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button
          type="submit"
          disabled={
            submitting ||
            priceInvalid ||
            draft.name.trim().length < 3 ||
            draft.description.trim().length < 20
          }
        >
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

/**
 * Mesh Store — the member's builder workspace: application status, listing
 * details, and the product shelf shown publicly at /store#builders.
 */
export function MeshStorePanel() {
  const { toast } = useToast();
  const [builder, setBuilder] = useState<MeshBuilder | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState({
    businessName: "",
    suburb: "",
    website: "",
    description: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/store/builders/mine");
      if (res.status === 404) {
        setBuilder(null);
        return;
      }
      if (!res.ok) throw new Error("Your builder record could not be loaded");
      const data = await res.json();
      setBuilder(data.builder ?? null);
      if (data.builder) {
        setDetails({
          businessName: data.builder.businessName,
          suburb: data.builder.suburb ?? "",
          website: data.builder.website ?? "",
          description: data.builder.description,
        });
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
      toast(productId ? "Product updated" : "Product added to your shelf", "success");
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
      toast("Product removed", "success");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
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
            href="/store#builders"
            className="mt-3 inline-block text-sm text-mercury underline-offset-4 hover:underline"
          >
            View your live shelf in the store →
          </Link>
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
          <h3 className="text-lg font-medium text-gold">
            Product shelf
            <span className="ml-2 text-sm font-normal text-ash">{builder.products.length}/12</span>
          </h3>
          {builder.status === "approved" && !addingProduct && (
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
                    submitLabel="Save product"
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
                      <p className="mt-1.5 line-clamp-2 text-sm text-ash">{product.description}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
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
