import Link from "next/link";

import { ArrowRight, Clock, Calendar } from "lucide-react";
import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { blogPosts } from "@/lib/blog";

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

export default function BlogIndexPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24">
          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-mono text-[#7a6b5a] mb-4">$ ls articles/</p>
            <h1 className="heading-display text-4xl md:text-5xl text-[#e8d5a3] mb-4">Blog</h1>
            <p className="text-[#b8a078] max-w-xl">
              Guides, stories, and insights about barter, exchange, and building community on the
              Central Coast.
            </p>
          </div>

          {/* Posts */}
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="vessel p-6 md:p-8 group hover:border-[#00e5ff]/30 transition-colors"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-[#00e5ff]/5 border border-[#00e5ff]/10 text-[#00e5ff]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="heading-display text-xl md:text-2xl text-[#e8d5a3] group-hover:text-[#00e5ff] transition-colors mb-3">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[#b8a078] leading-relaxed mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-[#7a6b5a]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {post.readingTime}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-[#00e5ff] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Read article</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-sm text-[#7a6b5a] mb-4">Want to share your exchange story?</p>
            <a
              href="mailto:official.antidosis@gmail.com?subject=Blog%20Submission"
              className="inline-flex items-center gap-2 text-sm text-[#00e5ff] hover:underline"
            >
              Submit an article idea
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
