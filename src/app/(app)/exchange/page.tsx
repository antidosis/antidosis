import type { Metadata } from "next";

import ExchangePage from "./_components/exchange-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "The Exchange",
  description:
    "The Central Coast exchange: local needs, verified nodes, and the community relay — one living marketplace. Post what you need, offer what you have.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/exchange`,
    siteName: "antidosis",
    title: "The Exchange — antidosis",
    description:
      "The Central Coast exchange: local needs, verified nodes, and the community relay — one living marketplace.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The antidosis exchange" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Exchange — antidosis",
    description: "Local needs, verified nodes, and the community relay — one living marketplace.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: `${siteUrl}/exchange` },
};

export default function Page() {
  return <ExchangePage />;
}
