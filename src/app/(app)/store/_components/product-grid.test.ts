import { describe, it, expect } from "vitest";

import type { PublicMeshBuilder } from "./builders-market";
import { buildStoreItems } from "./product-grid";

function builderWith(
  products: Partial<PublicMeshBuilder["products"][number]>[]
): PublicMeshBuilder {
  return {
    id: "builder-1",
    businessName: "Antidosis",
    suburb: "Noraville NSW",
    website: null,
    description: "",
    profile: { id: "p1", handle: null, fullName: null, avatarUrl: null, isVerified: true },
    products: products.map((product, index) => ({
      id: `product-${index}`,
      name: `Product ${index}`,
      category: "node",
      description: "A listing.",
      specs: null,
      priceAudCents: 8900,
      stockStatus: "in_stock",
      buyUrl: null,
      offerPostage: true,
      postageAudCents: 800,
      localPickup: false,
      paymentTerms: ["payid"],
      ...product,
    })),
  };
}

describe("buildStoreItems", () => {
  it("shows every flagship placeholder when there are no live listings", () => {
    const items = buildStoreItems([]);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.id === undefined)).toBe(true);
  });

  it("removes a category's placeholder once a live listing fills it", () => {
    const items = buildStoreItems([builderWith([{ category: "gateway" }])]);
    const gatewayItems = items.filter((item) => item.category === "gateway");
    expect(gatewayItems).toHaveLength(1);
    expect(gatewayItems[0].id).toBe("product-0");
    // Other departments keep their placeholders
    expect(items.some((item) => item.category === "board" && item.id === undefined)).toBe(true);
  });

  it("keeps placeholders for categories with no live listing", () => {
    const items = buildStoreItems([builderWith([{ category: "node" }])]);
    expect(items.some((item) => item.category === "node" && item.id === "product-0")).toBe(true);
    expect(items.some((item) => item.category === "gateway" && item.id === undefined)).toBe(true);
  });

  it("orders featured placements first", () => {
    const items = buildStoreItems([
      builderWith([
        { category: "node", name: "standard" },
        { category: "board", name: "featured", featured: true },
      ]),
    ]);
    expect(items[0].name).toBe("featured");
  });
});
