import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";
import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { blogPosts, getPostBySlug } from "@/lib/blog";

const siteUrl = "https://antidosis.com";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      locale: "en_AU",
      url: `${siteUrl}/blog/${post.slug}`,
      siteName: "antidosis",
      title: `${post.title} — antidosis`,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — antidosis`,
      description: post.excerpt,
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
  };
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Combined regex for **bold** and *italic*
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[2] !== undefined) {
      // Bold
      parts.push(
        <strong key={key++} className="text-[#e8d5a3] font-medium">
          {match[2]}
        </strong>
      );
    } else if (match[4] !== undefined) {
      // Italic
      parts.push(
        <em key={key++} className="text-[#b8a078] italic">
          {match[4]}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={key++}>{text}</span>];
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s|:\-]+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(rows: string[], startKey: number): [React.ReactNode, number] {
  let key = startKey;
  const headerCells = parseTableRow(rows[0]);
  const dataRows = rows.slice(1).filter((r) => !isTableSeparator(r));

  return [
    <div key={key++} className="overflow-x-auto mb-6">
      <table className="w-full text-left border border-[#2a2420]">
        <thead>
          <tr className="bg-[#1a1714]">
            {headerCells.map((cell, ci) => (
              <th
                key={ci}
                className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#e8d5a3] border-b border-[#2a2420]"
              >
                {parseInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => {
            const cells = parseTableRow(row);
            return (
              <tr key={ri} className="border-b border-[#2a2420] last:border-0">
                {cells.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 text-sm text-[#b8a078] leading-relaxed">
                    {parseInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>,
    key,
  ];
}

function renderMarkdownContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Collect consecutive table rows
    if (isTableRow(line)) {
      const tableRows: string[] = [line];
      let j = i + 1;
      while (j < lines.length && isTableRow(lines[j])) {
        tableRows.push(lines[j]);
        j++;
      }
      const [tableEl, nextKey] = renderTable(tableRows, key);
      elements.push(tableEl);
      key = nextKey;
      i = j - 1;
      continue;
    }

    // Collect consecutive blockquote lines
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [line.slice(2)];
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith("> ")) {
        quoteLines.push(lines[j].slice(2));
        j++;
      }
      elements.push(
        <blockquote
          key={key++}
          className="border-l-2 border-[#f5a623] pl-4 py-2 my-4 bg-[#1a1714]/50 rounded-r"
        >
          <p className="text-sm text-[#b8a078] italic leading-relaxed">
            {parseInlineMarkdown(quoteLines.join(" "))}
          </p>
        </blockquote>
      );
      i = j - 1;
      continue;
    }

    // Collect consecutive ordered list items
    const orderedMatch = line.match(/^(\d+)\.\s/);
    if (orderedMatch) {
      const listItems: string[] = [line.slice(orderedMatch[0].length)];
      let j = i + 1;
      while (j < lines.length) {
        const nextMatch = lines[j].match(/^(\d+)\.\s/);
        if (nextMatch) {
          listItems.push(lines[j].slice(nextMatch[0].length));
          j++;
        } else {
          break;
        }
      }
      elements.push(
        <ol key={key++} className="list-decimal ml-6 mb-4 space-y-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm text-[#b8a078] pl-2">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      i = j - 1;
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="heading-display text-3xl md:text-4xl text-[#e8d5a3] mt-12 mb-6">
          {parseInlineMarkdown(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="heading-display text-xl md:text-2xl text-[#e8d5a3] mt-10 mb-4">
          {parseInlineMarkdown(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="heading-display text-lg text-[#e8d5a3] mt-8 mb-3">
          {parseInlineMarkdown(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={key++} className="text-sm text-[#b8a078] ml-4 mb-2 list-disc">
          {parseInlineMarkdown(line.slice(2))}
        </li>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={key++} className="border-[#2a2420] my-8" />);
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-4" />);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="text-sm text-[#e8d5a3] font-medium mb-4">
          {parseInlineMarkdown(line.slice(2, -2))}
        </p>
      );
    } else {
      elements.push(
        <p key={key++} className="text-sm text-[#b8a078] leading-relaxed mb-4">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  }

  return elements;
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center text-[13px] text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />$ cd ../blog
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-[#00e5ff]/5 border border-[#00e5ff]/10 text-[#00e5ff]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">{post.title}</h1>

          {/* Author / date */}
          <div className="flex items-center gap-4 text-xs text-[#7a6b5a] mb-12 pb-8 border-b border-[#2a2420]">
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
            <span className="flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              {post.author}
            </span>
          </div>

          {/* Content */}
          <div>{renderMarkdownContent(post.content)}</div>

          {/* Share / CTA */}
          <div className="mt-16 pt-8 border-t border-[#2a2420]">
            <p className="text-sm text-[#b8a078] mb-4">
              Found this helpful? Post a need and put it into practice.
            </p>
            <Link
              href="/needs/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-sm text-[#00e5ff] hover:bg-[#00e5ff]/20 transition-colors"
            >
              Post a Need
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
