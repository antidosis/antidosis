import type { Metadata } from "next";

import HomeClient from "./_components/home-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "antidosis — the exchange network.",
  description:
    "A reciprocal exchange network on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified locals you can trust. Running on the internet today — built to keep working when everything else doesn't.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: siteUrl,
    siteName: "antidosis",
    title: "antidosis — the exchange network.",
    description:
      "A reciprocal exchange network on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified locals you can trust.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "antidosis — the exchange network.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "antidosis — the exchange network.",
    description:
      "A reciprocal exchange network on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified locals you can trust.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
