import type { Metadata } from "next";

import { SafetyClient } from "./_components/safety-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Safety & Trust",
  description:
    "How Antidosis keeps the exchange safe: verified identity, signed contracts with a full audit trail, guarded external links, and a reporting system with a reporter reputation engine.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/safety`,
    siteName: "antidosis",
    title: "Safety & Trust — antidosis",
    description:
      "Verified identity, signed agreements with a full audit trail, guarded links and a reporting system that rewards good-faith reports.",
    images: [
      {
        url: "/images/social-card.png",
        width: 1200,
        height: 630,
        alt: "Safety on the Antidosis exchange network.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Safety & Trust — antidosis",
    description:
      "Verified identity, signed agreements with a full audit trail, guarded links and a reporting system that rewards good-faith reports.",
    images: ["/images/social-card.png"],
  },
  alternates: {
    canonical: `${siteUrl}/safety`,
  },
};

export default function SafetyPage() {
  return <SafetyClient />;
}
