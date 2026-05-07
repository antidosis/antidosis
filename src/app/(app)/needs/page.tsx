import type { Metadata } from "next";
import NeedsListClient from "./_components/needs-list-client";

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
        url: "/opengraph-image",
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
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: `${siteUrl}/needs`,
  },
};

export default function NeedsPage() {
  return <NeedsListClient />;
}
