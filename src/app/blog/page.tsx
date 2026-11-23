import { Fragment } from "react";

import Link from "next/link";

import { ArrowRight, Clock, Calendar } from "lucide-react";
import type { Metadata } from "next";

import { SponsoredSlot } from "@/components/ads/sponsored-slot";
import { EmailLink } from "@/components/email-link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { blogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

const siteUrl = "https://antidosis.com";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, stories, and insights about barter, exchange, and community on the Central Coast, NSW. Learn how to trade safely, find valuable skills, and build local trust.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: `${siteUrl}/blog`,
    siteName: "antidosis",
    title: "Blog — antidosis",
    description:
      "Guides, stories, and insights about barter, exchange, and community on the Central Coast, NSW.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "antidosis blog — Central Coast exchange guides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — antidosis",
    description:
      "Guides, stories, and insights about barter, exchange, and community on the Central Coast, NSW.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
};

/** Rotating accent families — each card picks one by index for a schematic look. */
const ACCENTS = [
  {
    text: "text-mercury",
    border: "border-mercury/40",
    bg: "bg-mercury/5",
    ghost: "text-mercury/30",
  },
  { text: "text-sun", border: "border-sun/40", bg: "bg-sun/5", ghost: "text-sun/30" },
  { text: "text-orchid", border: "border-orchid/40", bg: "bg-orchid/5", ghost: "text-orchid/30" },
  { text: "text-aqua", border: "border-aqua/40", bg: "bg-aqua/5", ghost: "text-aqua/30" },
  { text: "text-ok", border: "border-ok/40", bg: "bg-ok/5", ghost: "text-ok/30" },
  { text: "text-ember", border: "border-ember/40", bg: "bg-ember/5", ghost: "text-ember/30" },
] as const;

/** Blueprint registration-mark corner. `pos` picks which corner. */
function CornerMark({ pos, className }: { pos: string; className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute h-2.5 w-2.5", pos, className)} />
  );
}

function txId(n: number) {
  return `TX-${String(n).padStart(3, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
          {/* Header */}
          <div className="mb-14 md:mb-20 border border-line bg-surface/60 p-6 md:p-10 relative">
            <CornerMark
              pos="left-0 top-0 border-l border-t"
              className="-translate-x-px -translate-y-px border-mercury/60"
            />
            <CornerMark
              pos="right-0 top-0 border-r border-t"
              className="translate-x-px -translate-y-px border-mercury/60"
            />
            <CornerMark
              pos="left-0 bottom-0 border-l border-b"
              className="-translate-x-px translate-y-px border-mercury/60"
            />
            <CornerMark
              pos="right-0 bottom-0 border-r border-b"
              className="translate-x-px translate-y-px border-mercury/60"
            />
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-mono text-ash mb-4">
                  » TRANSMISSION LOG — {blogPosts.length} RECORDS
                </p>
                <h1 className="heading-display text-4xl md:text-6xl text-gold mb-4">Blog</h1>
                <p className="text-parchment max-w-xl leading-relaxed">
                  Guides, stories, and insights about barter, exchange, and building a network that
                  keeps working — on the Central Coast.
                </p>
              </div>
              <div
                aria-hidden
                className="hidden md:block font-mono text-[10px] text-ash/60 leading-relaxed text-right"
              >
                FREQ 146.520MHZ
                <br />
                MODE FM — OPEN
                <br />
                NET STATUS: ON AIR
              </div>
            </div>
          </div>

          {/* Mosaic grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {blogPosts.map((post, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              // Every 7th card after the first goes wide with a horizontal layout
              const wide = i > 0 && i % 7 === 6;
              const featured = i === 0;
              return (
                <Fragment key={post.slug}>
                  <article
                    className={cn(
                      "group relative border bg-surface/40 p-5 md:p-6 flex flex-col transition-all duration-200",
                      "hover:bg-surface/70 hover:-translate-y-0.5 hover:border-linehi",
                      wide ? "md:col-span-2" : "",
                      featured ? "lg:col-span-2 lg:row-span-1" : "",
                      accent.border
                    )}
                  >
                    {/* Registration corners */}
                    <CornerMark
                      pos="left-0 top-0 border-l border-t"
                      className={cn(accent.border, "-translate-x-px -translate-y-px")}
                    />
                    <CornerMark
                      pos="right-0 top-0 border-r border-t"
                      className={cn(accent.border, "translate-x-px -translate-y-px")}
                    />
                    <CornerMark
                      pos="left-0 bottom-0 border-l border-b"
                      className={cn(accent.border, "-translate-x-px translate-y-px")}
                    />
                    <CornerMark
                      pos="right-0 bottom-0 border-r border-b"
                      className={cn(accent.border, "translate-x-px translate-y-px")}
                    />

                    <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                      {/* Index row */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn("font-mono text-[11px] tracking-widest", accent.ghost)}>
                          {txId(i + 1)}
                        </span>
                        <span
                          aria-hidden
                          className={cn("font-mono text-[11px] tracking-widest", accent.ghost)}
                        >
                          ━━━
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "text-xs font-mono uppercase tracking-wider px-1.5 py-1 border",
                              accent.border,
                              accent.bg,
                              accent.text
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h2
                        className={cn(
                          "heading-display text-gold group-hover:text-parchment transition-colors mb-2",
                          featured
                            ? "text-2xl md:text-3xl"
                            : wide
                              ? "text-xl md:text-2xl"
                              : "text-lg"
                        )}
                      >
                        {post.title}
                      </h2>
                      <p
                        className={cn(
                          "text-sm text-parchment/85 leading-relaxed mb-5",
                          featured ? "" : "line-clamp-3"
                        )}
                      >
                        {post.excerpt}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ash">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {post.readingTime}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 font-mono text-[11px] tracking-wider",
                            accent.text
                          )}
                        >
                          READ
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </article>
                  {/* In-feed sponsored placement (reserved for Phase 2 featured listings) */}
                  {i === 5 && (
                    <SponsoredSlot placement="blog-feed" className="md:col-span-2 lg:col-span-3" />
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-16 border border-line bg-surface/40 p-6 md:p-8 text-center">
            <p className="text-sm text-parchment mb-4">Want to share your exchange story?</p>
            <EmailLink
              email="support@antidosis.com"
              subject="Blog Submission"
              className="inline-flex items-center gap-2 text-sm text-mercury hover:underline"
            >
              Submit an article idea
              <ArrowRight className="h-4 w-4" />
            </EmailLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
