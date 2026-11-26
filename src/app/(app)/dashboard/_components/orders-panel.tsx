"use client";

import Link from "next/link";

import { Package, PackageCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/swr-config";
import { cn } from "@/lib/utils";

type StoreOrder = {
  id: string;
  orderRef: string;
  meshName: string;
  status: string;
  priceAudCents: number;
  postageAudCents: number;
  totalAudCents: number;
  createdAt: string;
  product: { id: string; name: string; category: string; soldByAntidosis: boolean };
};

const STATUS_TONE: Record<string, string> = {
  placed: "text-sun border-sun/40 bg-sun/[0.06]",
  paid: "text-mercury border-mercury/40 bg-mercury/[0.06]",
  preparing: "text-mercury border-mercury/40 bg-mercury/[0.06]",
  shipped: "text-ok border-ok/40 bg-ok/[0.06]",
  delivered: "text-ok border-ok/40 bg-ok/[0.06]",
  cancelled: "text-bad border-bad/40 bg-bad/[0.06]",
};

const STATUS_LABEL: Record<string, string> = {
  placed: "order placed — awaiting payment",
  paid: "payment received",
  preparing: "being flashed & tested",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

function aud(cents: number): string {
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** The member's mesh store orders — every first-party purchase, tracked here. */
export function OrdersPanel() {
  const { data, isLoading } = useApi<{ orders: StoreOrder[] }>("/api/v1/store/orders/mine");
  const orders = data?.orders;

  if (isLoading || !orders) {
    return <div className="vessel h-32 animate-pulse bg-surface/40" aria-label="Loading orders" />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No store orders yet"
        description="Mesh hardware marked “sold by antidosis” ships configured to your mesh name — order it and track it here."
        action={
          <Button asChild size="sm">
            <Link href="/store">Visit the store</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className={cn(
            "vessel rounded-lg p-4 sm:p-5",
            order.status === "cancelled"
              ? "border-l-2 border-l-bad/40"
              : order.status === "delivered"
                ? "border-l-2 border-l-ok/40"
                : "border-l-2 border-l-sun/40"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/store/product/${order.product.id}`}
                className="block truncate text-base font-medium text-gold transition-colors hover:text-sun"
              >
                {order.product.name}
              </Link>
              <p className="mt-1 text-xs text-ash">
                <span className="font-mono text-sun">{order.orderRef}</span>
                {" · flashed as “"}
                {order.meshName}
                {"” · "}
                {new Date(order.createdAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-medium text-gold">{aud(order.totalAudCents)}</p>
              <p className="text-xs text-ash">
                {order.postageAudCents === 0
                  ? "free postage"
                  : `incl. ${aud(order.postageAudCents)} postage`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[11px] uppercase tracking-wider",
                STATUS_TONE[order.status]
              )}
            >
              {order.status === "shipped" || order.status === "delivered" ? (
                <Truck className="mr-1 h-3 w-3" />
              ) : (
                <Package className="mr-1 h-3 w-3" />
              )}
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
            {order.status === "placed" && (
              <span className="text-xs text-ash">
                pay by PayID or bank transfer quoting{" "}
                <span className="font-mono text-sun">{order.orderRef}</span> — details are in your
                confirmation and Relay messages
              </span>
            )}
            {order.status === "preparing" && (
              <span className="inline-flex items-center gap-1 text-xs text-ash">
                <PackageCheck className="h-3 w-3 text-mercury" /> your unit is being configured to “
                {order.meshName}”
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
