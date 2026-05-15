import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "antidosis — exchange anything, build trust.",
    template: "%s — antidosis",
  },
  description:
    "A marketplace for reciprocal exchange on the Central Coast, NSW. Post what you need. Say what you'll give back. Connect with verified people you can trust. Barter, gift, or trade anything with verified locals.",
  keywords: [
    "barter",
    "exchange",
    "skills exchange",
    "Central Coast NSW",
    "mutual aid",
    "local marketplace",
    "trade goods",
    "skill swap",
    "community exchange",
    "reciprocal exchange",
    "gift economy",
    "local trade",
    "Gosford",
    "Wyong",
    "Terrigal",
    "Woy Woy",
    "Erina",
  ],
  authors: [{ name: "antidosis" }],
  creator: "antidosis",
  publisher: "antidosis",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    creator: "@antidosis",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/favicon-180x180.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Antidosis",
  },
  other: {
    "mobile-web-app-capable": "yes",
    // Geo-targeting for Central Coast NSW
    "geo.region": "AU-NSW",
    "geo.placename": "Central Coast, New South Wales, Australia",
    "geo.position": "-33.3208;151.2335",
    ICBM: "-33.3208, 151.2335",
  },
  verification: {
    google: "google-site-verification-code",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0806" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0806" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        {/* Structured Data: WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "antidosis",
              url: siteUrl,
              description:
                "A marketplace for reciprocal exchange. Post what you need. Say what you'll give back. Connect with verified people you can trust.",
              inLanguage: "en-AU",
              publisher: {
                "@type": "Organization",
                name: "antidosis",
                url: siteUrl,
                logo: {
                  "@type": "ImageObject",
                  url: `${siteUrl}/android-chrome-512x512.png`,
                  width: 512,
                  height: 512,
                },
                sameAs: [],
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/needs?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Structured Data: LocalBusiness / Place for Central Coast */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "Organization"],
              name: "antidosis",
              alternateName: "Antidosis Exchange",
              url: siteUrl,
              description:
                "A marketplace for reciprocal exchange on the Central Coast, NSW. Barter, gift, and trade anything with verified locals.",
              image: `${siteUrl}/opengraph-image`,
              email: "official.antidosis@gmail.com",
              areaServed: {
                "@type": "City",
                name: "Central Coast",
                containedInPlace: {
                  "@type": "State",
                  name: "New South Wales",
                  containedInPlace: {
                    "@type": "Country",
                    name: "Australia",
                  },
                },
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: "Central Coast",
                addressRegion: "NSW",
                addressCountry: "AU",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: -33.3208,
                longitude: 151.2335,
              },
              priceRange: "$$",
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "00:00",
                closes: "23:59",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#0a0806] text-[#e8d5a3]`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
