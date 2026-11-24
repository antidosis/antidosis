import type { Metadata } from "next";

import { getPublicNeeds } from "@/lib/public-content";

import NeedsListClient from "./_components/needs-list-client";

export const dynamic = "force-dynamic";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Browse Needs",
  description:
    "Browse needs posted by verified locals on the Central Coast, NSW. Find skills, goods, and services people are looking for. Express interest and start exchanging.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/needs`,
    siteName: "antidosis",
    title: "Browse Needs — antidosis",
    description:
      "Browse needs posted by verified locals on the Central Coast, NSW. Find skills, goods, and services people are looking for.",
    images: [
      {
        url: "/images/social-card.png",
        width: 1200,
        height: 630,
        alt: "Browse needs on antidosis — Central Coast, NSW",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Needs — antidosis",
    description:
      "Browse needs posted by verified locals on the Central Coast, NSW. Find skills, goods, and services people are looking for.",
    images: ["/images/social-card.png"],
  },
  alternates: {
    canonical: `${siteUrl}/needs`,
  },
};

export default async function NeedsPage() {
  const initialData = await getPublicNeeds({ page: 1, limit: 12 }).catch(() => undefined);
  return <NeedsListClient initialData={initialData} />;
}
