"use client";

import { CornerDownRight } from "lucide-react";

function renderMentions(text: string, keyPrefix: string): React.ReactNode[] {
  const mentionRegex = /@([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match;
  let count = 0;
  while ((match = mentionRegex.exec(text)) !== null) {
    parts.push(<span key={keyPrefix + "-m" + count++}>{text.slice(lastIdx, match.index)}</span>);
    parts.push(
      <span
        key={keyPrefix + "-m" + count++}
        style={{ color: "var(--term-accent)", fontWeight: 600 }}
      >
        @{match[1].slice(0, 8)}
      </span>
    );
    lastIdx = match.index + match[0].length;
  }
  parts.push(<span key={keyPrefix + "-m" + count++}>{text.slice(lastIdx)}</span>);
  return parts;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let safety = 0;

  const patterns = [
    {
      regex: /\*\*(.+?)\*\*/,
      el: (t: string, k: string) => (
        <strong key={k} style={{ color: "var(--term-accent)" }}>
          {t}
        </strong>
      ),
    },
    {
      regex: /__(.+?)__/,
      el: (t: string, k: string) => (
        <strong key={k} style={{ color: "var(--term-accent)" }}>
          {t}
        </strong>
      ),
    },
    {
      regex: /~~(.+?)~~/,
      el: (t: string, k: string) => (
        <del key={k} style={{ color: "var(--term-muted)" }}>
          {t}
        </del>
      ),
    },
    {
      regex: /`(.+?)`/,
      el: (t: string, k: string) => (
        <code
          key={k}
          style={{
            background: "var(--term-border)",
            padding: "0 4px",
            borderRadius: 2,
            fontSize: "12px",
          }}
        >
          {t}
        </code>
      ),
    },
    { regex: /\*(.+?)\*/, el: (t: string, k: string) => <em key={k}>{t}</em> },
  ];

  while (remaining && safety++ < 50) {
    let bestIdx = -1;
    let bestMatch: RegExpMatchArray | null = null;
    let bestPat = patterns[0];

    for (const pat of patterns) {
      const m = remaining.match(pat.regex);
      if (m && (bestIdx === -1 || (m.index !== undefined && m.index < bestIdx))) {
        bestIdx = m.index ?? -1;
        bestMatch = m;
        bestPat = pat;
      }
    }

    if (bestMatch && bestIdx !== -1 && bestIdx >= 0) {
      if (bestIdx > 0) {
        nodes.push(...renderMentions(remaining.slice(0, bestIdx), keyPrefix + "-pre" + safety));
      }
      nodes.push(bestPat.el(bestMatch[1], keyPrefix + "-fmt" + safety));
      remaining = remaining.slice(bestIdx + bestMatch[0].length);
    } else {
      nodes.push(...renderMentions(remaining, keyPrefix + "-txt" + safety));
      break;
    }
  }

  return nodes;
}

export function TerminalMessageRender({ content }: { content: string }) {
  const replyRegex = /^>reply:([^:]+):([^:]+):(.+)\n/;
  const replyMatch = content.match(replyRegex);
  const actualContent = replyMatch ? content.slice(replyMatch[0].length) : content;

  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const segments = actualContent.split(linkRegex);

  const isSafeUrl = (url: string): boolean => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const rendered = segments.map((seg, i) => {
    if (linkRegex.test(seg) && isSafeUrl(seg)) {
      return (
        <a
          key={"link-" + i}
          href={seg}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--term-accent)", textDecoration: "underline" }}
        >
          {seg.length > 50 ? seg.slice(0, 50) + "…" : seg}
        </a>
      );
    }
    return <span key={"txt-" + i}>{renderInline(seg, "seg-" + i)}</span>;
  });

  if (!replyMatch) return <>{rendered}</>;

  return (
    <>
      <div
        className="mb-1 border-l-2 pl-2 text-[11px] italic"
        style={{ borderColor: "var(--term-muted)", color: "var(--term-muted)" }}
      >
        <CornerDownRight className="mr-1 inline h-3 w-3" />
        {replyMatch[2]}:{" "}
        {replyMatch[3].length > 60 ? replyMatch[3].slice(0, 60) + "…" : replyMatch[3]}
      </div>
      {rendered}
    </>
  );
}
