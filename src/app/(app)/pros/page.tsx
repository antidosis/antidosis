import type { Metadata } from "next";
import ProsClient from "./_components/pros-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Pro Directory",
  description:
    "Browse verified Pro members on the Central Coast, NSW. Find skilled locals with verified credentials in trades, services, creative arts, and more.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/pros`,
    siteName: "antidosis",
    title: "Pro Directory — antidosis",
    description:
      "Browse verified Pro members on the Central Coast, NSW. Find skilled locals with verified credentials.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pro Directory on antidosis — Central Coast, NSW",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Directory — antidosis",
    description:
      "Browse verified Pro members on the Central Coast, NSW. Find skilled locals with verified credentials.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: `${siteUrl}/pros`,
  },
};

export default function ProsDirectoryPage() {
  return <ProsClient />;
}
