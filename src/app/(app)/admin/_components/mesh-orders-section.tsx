"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader2, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MESH_ORDER_STATUS_LABEL } from "@/lib/store-first-party";
import { cn } from "@/lib/utils";

type AdminMeshOrder = {
  id: string;
  orderRef: string;
  meshName: string;
  deliveryName: string;
  deliveryAddress: string;
  buyerNote: string | null;
  priceAudCents: number;
  postageAudCents: number;
  totalAudCents: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
  product: { id: string; name: string; category: string };
  buyer: {
    id: string;
    memberCode: string;
    fullName: string | null;
    handle: string | null;
    email: string;
    mobileVerified: boolean;
  };
};

const STATUSES = ["placed", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;

const ORDER_TONE: Record<string, string> = {
  placed: "border-sun/40 bg-sun/[0.05]",
  paid: "border-mercury/40 bg-mercury/[0.05]",
  preparing: "border-mercury/40 bg-mercury/[0.05]",
  shipped: "border-ok/30 bg-ok/[0.04]",
  delivered: "border-ok/30 bg-ok/[0.04]",
  cancelled: "border-bad/30 bg-bad/[0.04]",
};

function aud(cents: number): string {
  return `AU$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** Fulfilment queue for first-party store orders. */
export function MeshOrdersQueue() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminMeshOrder[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/store/orders?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on filter change/mount; setState lives inside the async loader
    void load(filter);
  }, [filter, load]);

  async function setStatus(order: AdminMeshOrder, status: string) {
    if (status === order.status) return;
    if (
      status === "cancelled" &&
      !window.confirm(`Cancel ${order.orderRef}? The unit returns to shelf stock.`)
    ) {
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/v1/admin/store/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast(`Order ${order.orderRef} → ${status}`, "success");
        await load(filter);
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Could not update the order", "error");
      }
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs",
              filter === option
                ? "bg-sun/10 text-sun"
                : "text-ash hover:bg-surface hover:text-parchment"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-ash">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          loading…
        </div>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-ash">No orders in this view.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className={cn(
                "rounded-lg border p-4 sm:p-5",
                ORDER_TONE[order.status] ?? "border-line"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Package className="h-4 w-4 text-sun" />
                  <span className="font-mono font-medium text-gold">{order.orderRef}</span>
                  <Badge
                    variant={
                      order.status === "cancelled"
                        ? "destructive"
                        : order.status === "delivered" || order.status === "shipped"
                          ? "success"
                          : "warning"
                    }
                  >
                    {MESH_ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>
                <span className="text-xs text-ash/70">
                  {new Date(order.createdAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="mt-1.5 text-sm text-parchment">
                {order.product.name} · <span className="text-gold">{aud(order.totalAudCents)}</span>
                <span className="text-ash">
                  {" "}
                  ({aud(order.priceAudCents)} + {aud(order.postageAudCents)} postage)
                </span>
              </p>
              <p className="mt-1 text-xs text-ash">
                flash as: <span className="font-medium text-mercury">“{order.meshName}”</span>
              </p>
              <p className="mt-1 text-xs text-ash">
                {order.buyer.fullName ?? order.buyer.handle ?? "member"} ·{" "}
                <span className="font-mono text-mercury">{order.buyer.memberCode}</span> ·{" "}
                {order.buyer.email} ·{" "}
                {order.buyer.mobileVerified ? "mobile verified" : "mobile NOT verified"}
              </p>
              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-parchment">
                ship to: {order.deliveryName} — {order.deliveryAddress}
              </p>
              {order.buyerNote && (
                <p className="mt-1 text-xs italic text-ash">buyer note: {order.buyerNote}</p>
              )}
              {order.adminNote && (
                <p className="mt-1 text-xs italic text-ash">note: {order.adminNote}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== order.status).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={status === "cancelled" ? "destructive" : "ghost"}
                    disabled={acting || order.status === "cancelled"}
                    onClick={() => setStatus(order, status)}
                  >
                    → {status}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
