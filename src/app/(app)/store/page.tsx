import type { Metadata } from "next";

import { StoreClient } from "./_components/store-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Store — Mesh Nodes",
  description:
    "The antidosis mesh store: the antidosis node, verified node builders, and the setup runbook. Off-grid radio for the Central Coast exchange — licence-free 915 MHz.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/store`,
    siteName: "antidosis",
    title: "Store — antidosis mesh nodes",
    description:
      "The antidosis node, verified node builders, and the setup runbook for the off-grid mesh.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "antidosis mesh store" }],
  },
  alternates: { canonical: `${siteUrl}/store` },
};

export default function StorePage() {
  return <StoreClient />;
}
