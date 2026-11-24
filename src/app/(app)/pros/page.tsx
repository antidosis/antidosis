import type { Metadata } from "next";

import { getDirectoryProfiles } from "@/lib/public-content";

import ProsClient from "./_components/pros-client";

export const dynamic = "force-dynamic";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Browse identity-verified members on the Central Coast, NSW. Review experience, ratings, and separately verified credentials in trades, services, creative arts, and more.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/pros`,
    siteName: "antidosis",
    title: "Directory — antidosis",
    description:
      "Browse verified members on the Central Coast, NSW. Find skilled locals with verified credentials.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Directory on antidosis — Central Coast, NSW",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Directory — antidosis",
    description:
      "Browse verified members on the Central Coast, NSW. Find skilled locals with verified credentials.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: `${siteUrl}/pros`,
  },
};

export default async function ProsDirectoryPage() {
  const initialData = await getDirectoryProfiles().catch(() => undefined);
  return <ProsClient initialData={initialData} />;
}
