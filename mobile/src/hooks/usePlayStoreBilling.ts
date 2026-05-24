import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

/* ═══════════════════════════════════════════════════════════════
   GOOGLE PLAY BILLING HOOK
   Wraps cordova-plugin-purchase for Capacitor Android.
   Safe no-op on web / iOS.
   ═══════════════════════════════════════════════════════════════ */

declare global {
  interface Window {
    CdvPurchase?: any;
  }
}

const PRODUCT_IDS = ["pro_monthly", "pro_yearly"] as const;
type ProductId = (typeof PRODUCT_IDS)[number];

interface PlayStoreProduct {
  id: ProductId;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
  canPurchase: boolean;
  owned: boolean;
}

interface UsePlayStoreBillingReturn {
  initialized: boolean;
  initializing: boolean;
  products: PlayStoreProduct[];
  error: string | null;
  purchase: (productId: ProductId) => Promise<void>;
  restore: () => Promise<void>;
  isOwned: (productId: ProductId) => boolean;
}

function isAndroid() {
  return Capacitor.getPlatform() === "android";
}

function getStore() {
  if (typeof window === "undefined") return null;
  const w = window as Window & { CdvPurchase?: any };
  return w.CdvPurchase?.store ?? null;
}

function getEnums() {
  if (typeof window === "undefined") return null;
  const w = window as Window & { CdvPurchase?: any };
  return w.CdvPurchase
    ? {
        ProductType: w.CdvPurchase.ProductType,
        Platform: w.CdvPurchase.Platform,
        LogLevel: w.CdvPurchase.LogLevel,
      }
    : null;
}

export function usePlayStoreBilling(): UsePlayStoreBillingReturn {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [products, setProducts] = useState<PlayStoreProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const initAttempted = useRef(false);

  const refreshProducts = useCallback(() => {
    const store = getStore();
    if (!store) return;

    const updated: PlayStoreProduct[] = [];
    for (const id of PRODUCT_IDS) {
      const p = store.get(id);
      if (p) {
        const offer = p.offers?.[0];
        const pricing = offer?.pricingPhases?.[0];
        updated.push({
          id,
          title: p.title ?? id,
          description: p.description ?? "",
          price: pricing?.price ?? "",
          priceMicros: pricing?.priceMicros ?? 0,
          currency: pricing?.currency ?? "",
          canPurchase: p.canPurchase ?? false,
          owned: store.owned(id) ?? false,
        });
      }
    }
    setProducts(updated);
  }, []);

  useEffect(() => {
    if (!isAndroid()) return;
    if (initAttempted.current) return;
    initAttempted.current = true;

    const enums = getEnums();
    const store = getStore();
    if (!enums || !store) {
      setError("Billing plugin not available");
      return;
    }

    setInitializing(true);

    store.verbosity = enums.LogLevel.WARNING;

    store.register(
      PRODUCT_IDS.map((id) => ({
        id,
        type: enums.ProductType.PAID_SUBSCRIPTION,
        platform: enums.Platform.GOOGLE_PLAY,
      }))
    );

    store
      .when()
      .productUpdated(() => refreshProducts())
      .receiptUpdated(() => refreshProducts())
      .approved(async (transaction: any) => {
        // Send purchase token to backend for verification
        try {
          const productId = transaction.products?.[0]?.id;
          const purchaseToken = transaction.purchaseId;
          if (productId && purchaseToken) {
            const { verifyPlayStorePurchase } = await import("@mobile/lib/api");
            await verifyPlayStorePurchase(productId, purchaseToken);
            await transaction.finish();
          }
        } catch (e) {
          console.error("[PlayStore] Verification failed:", e);
        }
      });

    store
      .initialize([enums.Platform.GOOGLE_PLAY])
      .then(() => {
        setInitialized(true);
        setInitializing(false);
        refreshProducts();
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to initialize billing");
        setInitializing(false);
      });

    return () => {
      // Plugin has no explicit cleanup; listeners are managed internally
    };
  }, [refreshProducts]);

  const purchase = useCallback(async (productId: ProductId) => {
    if (!isAndroid()) {
      setError("Billing only available on Android");
      return;
    }
    const store = getStore();
    if (!store) {
      setError("Billing not initialized");
      return;
    }
    const product = store.get(productId);
    if (!product) {
      setError("Product not found");
      return;
    }
    const offer = product.offers?.[0];
    if (!offer) {
      setError("No offer available");
      return;
    }
    const err = await offer.order();
    if (err) {
      setError(err.message ?? "Purchase failed");
    }
  }, []);

  const restore = useCallback(async () => {
    if (!isAndroid()) return;
    const store = getStore();
    if (!store) return;
    try {
      await store.restorePurchases();
      refreshProducts();
    } catch (e: any) {
      setError(e?.message ?? "Restore failed");
    }
  }, [refreshProducts]);

  const isOwned = useCallback((productId: ProductId) => {
    if (!isAndroid()) return false;
    const store = getStore();
    if (!store) return false;
    return store.owned(productId) ?? false;
  }, []);

  return {
    initialized,
    initializing,
    products,
    error,
    purchase,
    restore,
    isOwned,
  };
}
