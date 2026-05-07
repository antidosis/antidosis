import type { Metadata } from "next";
import HowItWorksClient from "./_components/how-it-works-client";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how antidosis works. Create a need, connect with verified locals on the Central Coast, exchange skills and goods, build your reputation. Free form or binding contract — you choose.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/how-it-works`,
    siteName: "antidosis",
    title: "How It Works — antidosis",
    description:
      "Learn how antidosis works. Create a need, connect with verified locals on the Central Coast, exchange skills and goods, build your reputation.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "How antidosis works — exchange skills. build trust.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works — antidosis",
    description:
      "Learn how antidosis works. Create a need, connect with verified locals on the Central Coast, exchange skills and goods, build your reputation.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: `${siteUrl}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
