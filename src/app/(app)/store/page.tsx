import type { Metadata } from "next";

import { StoreClient } from "./_components/store-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Store — Mesh Nodes",
  description:
    "The antidosis mesh store: off-grid radio nodes for everyday people. No SIM, no Wi-Fi, no internet — one small device keeps you connected. Built by verified local makers.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/store`,
    siteName: "antidosis",
    title: "Store — antidosis mesh nodes",
    description:
      "Off-grid radio nodes for everyday people. One small device keeps you connected when the internet stops.",
    images: [
      { url: "/images/social-card.png", width: 1200, height: 630, alt: "antidosis mesh store" },
    ],
  },
  alternates: { canonical: `${siteUrl}/store` },
};

export default function StorePage() {
  return <StoreClient />;
}
