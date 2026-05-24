import type { Metadata } from "next";

import ProClient from "./_components/pro-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Go Pro",
  description:
    "Upgrade to antidosis Pro. Stand out on the Central Coast with a verified badge, priority listing, credential verification, and more. Build trust and get more exchanges.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/pro`,
    siteName: "antidosis",
    title: "Go Pro — antidosis",
    description:
      "Upgrade to antidosis Pro. Stand out on the Central Coast with a verified badge, priority listing, and credential verification.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Go Pro on antidosis — Central Coast, NSW",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Go Pro — antidosis",
    description:
      "Upgrade to antidosis Pro. Stand out on the Central Coast with a verified badge, priority listing, and credential verification.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: `${siteUrl}/pro`,
  },
};

export default function ProPage() {
  return <ProClient />;
}
