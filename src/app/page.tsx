import type { Metadata } from "next";

import HomeClient from "./_components/home-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "antidosis — exchange anything, build trust.",
  description:
    "A marketplace for reciprocal exchange on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified people you can trust. Barter, gift, or trade anything with verified locals.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: siteUrl,
    siteName: "antidosis",
    title: "antidosis — exchange anything, build trust.",
    description:
      "A marketplace for reciprocal exchange on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified people you can trust.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "antidosis — exchange anything, build trust.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "antidosis — exchange anything, build trust.",
    description:
      "A marketplace for reciprocal exchange on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified people you can trust.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
