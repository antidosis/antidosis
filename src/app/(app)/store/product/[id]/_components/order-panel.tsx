"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { CheckCircle2, Copy, Loader2, PackageCheck, ShoppingBag } from "lucide-react";

import { InlineMobileVerify } from "@/components/inline-mobile-verify";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { MeshPaymentInstructions } from "@/lib/store-first-party";
import { createClient } from "@/lib/supabase/client";

type Session = "loading" | "anon" | "authed";

type PlacedOrder = {
  id: string;
  orderRef: string;
  meshName: string;
  totalAudCents: number;
};

function aud(cents: number): string {
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * First-party checkout: the member orders an Antidosis-stocked unit, tells us
 * the mesh name to flash, and pays by PayID/bank transfer quoting their order
 * reference. Mobile verification happens inline — nobody gets bounced away.
 */
export function OrderPanel({
  productId,
  productName,
  priceAudCents,
  postageAudCents,
  loginPath,
}: {
  productId: string;
  productName: string;
  priceAudCents: number;
  postageAudCents: number;
  loginPath: string;
}) {
  const { toast } = useToast();
  const [session, setSession] = useState<Session>("loading");
  const [open, setOpen] = useState(false);
  const [meshName, setMeshName] = useState("");
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{
    order: PlacedOrder;
    payment: MeshPaymentInstructions;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) setSession(user ? "authed" : "anon");
      })
      .catch(() => {
        if (!cancelled) setSession("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = priceAudCents + postageAudCents;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          meshName: meshName.trim(),
          deliveryName: deliveryName.trim(),
          deliveryAddress: deliveryAddress.trim(),
          buyerNote: buyerNote.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setPlaced(body);
        return;
      }
      if (res.status === 403 && body.code === "MOBILE_NOT_VERIFIED") {
        setNeedsVerify(true);
        return;
      }
      setError(body.error || "Order could not be placed — try again.");
    } catch {
      setError("Order could not be placed — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    const { order, payment } = placed;
    return (
      <div className="rounded-lg border border-ok/30 bg-ok/[0.05] p-4">
        <p className="flex items-center gap-2 text-[15px] font-medium text-ok">
          <CheckCircle2 className="h-4 w-4" /> Order placed — {order.orderRef}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-parchment">
          {productName} · total{" "}
          <span className="font-medium text-gold">{aud(order.totalAudCents)}</span> · flashed as{" "}
          <span className="font-medium text-gold">“{order.meshName}”</span>
        </p>
        <div className="mt-3 rounded border border-line/60 bg-inset/50 p-3 text-sm leading-relaxed">
          <p className="font-medium text-gold">Pay by PayID or bank transfer</p>
          {payment.sentManually ? (
            <p className="mt-1 text-ash">
              Payment details are on their way to you by Relay message and email — quote{" "}
              <span className="font-mono text-sun">{order.orderRef}</span> so we can match it.
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-ash">
              {payment.payId && (
                <li>
                  PayID: <span className="text-parchment">{payment.payId}</span>
                </li>
              )}
              {payment.bsb && payment.accountNumber && (
                <li>
                  Bank: <span className="text-parchment">{payment.accountName ?? "Antidosis"}</span>{" "}
                  · BSB <span className="text-parchment">{payment.bsb}</span> · Acc{" "}
                  <span className="text-parchment">{payment.accountNumber}</span>
                </li>
              )}
              <li>
                Reference:{" "}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(order.orderRef);
                    toast("Order reference copied", "success");
                  }}
                  className="inline-flex items-center gap-1 font-mono text-sun transition-colors hover:text-sunhi"
                >
                  {order.orderRef} <Copy className="h-3 w-3" />
                </button>
              </li>
            </ul>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ash/80">
          We confirm payment, flash and test your unit, then ship with tracking. Follow every step
          from your dashboard.
        </p>
        <Button asChild size="sm" variant="secondary" className="mt-3">
          <Link href="/dashboard?tab=orders">Track this order</Link>
        </Button>
      </div>
    );
  }

  if (session === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line/70 p-4 text-sm text-ash">
        <Loader2 className="h-4 w-4 animate-spin" /> checking your session…
      </div>
    );
  }

  if (session === "anon") {
    return (
      <div className="rounded-lg border border-line/70 p-4">
        <p className="text-sm leading-relaxed text-ash">
          Ordering is for Antidosis members — sign in so your unit is connected to your member ID
          and you can track it to your door.
        </p>
        <Button asChild className="mt-3">
          <Link href={`/login?next=${encodeURIComponent(loginPath)}`}>
            <ShoppingBag className="mr-2 h-4 w-4" /> Sign in to order
          </Link>
        </Button>
      </div>
    );
  }

  if (needsVerify) {
    return (
      <div className="rounded-lg border border-sun/30 bg-sun/[0.04] p-4">
        <p className="mb-3 text-sm leading-relaxed text-parchment">
          One quick step — verify your mobile so your order is tied to a real person, then it goes
          straight through.
        </p>
        <InlineMobileVerify
          onVerified={() => {
            setNeedsVerify(false);
            void submit();
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line/70 p-4">
      {!open ? (
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <ShoppingBag className="mr-2 h-4 w-4" /> Order — {aud(total)}{" "}
          <span className="ml-1 font-normal opacity-80">
            ({postageAudCents === 0 ? "free postage" : `incl. ${aud(postageAudCents)} postage`})
          </span>
        </Button>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="order-mesh-name" className="mb-1 block text-sm text-parchment">
              Mesh name{" "}
              <span className="text-ash">— what the network sees (flashed before dispatch)</span>
            </label>
            <input
              id="order-mesh-name"
              value={meshName}
              onChange={(event) => setMeshName(event.target.value)}
              maxLength={40}
              placeholder="e.g. Kookaburra-1"
              className="w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="order-delivery-name" className="mb-1 block text-sm text-parchment">
                Delivery name
              </label>
              <input
                id="order-delivery-name"
                value={deliveryName}
                onChange={(event) => setDeliveryName(event.target.value)}
                maxLength={120}
                autoComplete="name"
                className="w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun"
              />
            </div>
            <div>
              <label htmlFor="order-buyer-note" className="mb-1 block text-sm text-parchment">
                Note <span className="text-ash">(optional)</span>
              </label>
              <input
                id="order-buyer-note"
                value={buyerNote}
                onChange={(event) => setBuyerNote(event.target.value)}
                maxLength={500}
                placeholder="Anything we should know?"
                className="w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun"
              />
            </div>
          </div>
          <div>
            <label htmlFor="order-delivery-address" className="mb-1 block text-sm text-parchment">
              Delivery address
            </label>
            <textarea
              id="order-delivery-address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              rows={2}
              maxLength={500}
              autoComplete="street-address"
              placeholder="Street, suburb, state, postcode"
              className="w-full rounded border border-line bg-inset px-3 py-2.5 text-base text-gold outline-none transition-colors placeholder:text-ash/50 focus:border-sun"
            />
          </div>
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={submit}
              disabled={
                submitting ||
                meshName.trim().length < 2 ||
                deliveryName.trim().length < 2 ||
                deliveryAddress.trim().length < 10
              }
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 h-4 w-4" />
              )}
              Place order — {aud(total)}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-ash/70">
            Nothing is charged now — you pay by PayID or bank transfer after placing, quoting your
            order reference. Your details are used only to configure and deliver this order.
          </p>
        </div>
      )}
    </div>
  );
}
