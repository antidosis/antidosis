"use client";

import { useEffect, useRef, useState } from "react";
import {
  Zap,
  ShieldCheck,
  Globe,
  Repeat,
  Lock,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";

const TICKER_ITEMS = [
  {
    icon: Sparkles,
    text: "The Central Coast is where it begins — verify your identity & claim free Pro for life",
    accent: "#f5a623",
  },
  {
    icon: Repeat,
    text: "A marketplace for reciprocal exchange — service for service, item for item, cash for time",
    accent: "#00e5ff",
  },
  {
    icon: ShieldCheck,
    text: "Verified identities. Binding contracts. Reputation you can trust.",
    accent: "#00e676",
  },
  {
    icon: Globe,
    text: "Regional today. Global tomorrow. Join the first trial region.",
    accent: "#b24bf5",
  },
  {
    icon: Lock,
    text: "No middlemen. No hidden fees. Just people exchanging what they have for what they need.",
    accent: "#f5a623",
  },
  {
    icon: Star,
    text: "Post what you need. Say what you'll give back. Connect with real people.",
    accent: "#00e5ff",
  },
  {
    icon: MapPin,
    text: "The Central Coast trial run — your feedback shapes the future of Antidosis",
    accent: "#00e676",
  },
  {
    icon: Zap,
    text: "Verify once. Get Pro for life. No credit card. No expiry.",
    accent: "#f5a623",
  },
];

export function TickerBanner() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate items for seamless loop
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="relative w-full overflow-hidden border-y border-[#f5a623]/20 bg-[#0f0c0a]"
      style={{
        boxShadow: "inset 0 0 40px rgba(245,166,35,0.04), 0 0 20px rgba(245,166,35,0.06)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-nosnippet
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f5a623]/40 to-transparent" />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex items-center py-3 md:py-3.5"
        style={{
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        <div
          className="flex items-center gap-0 animate-ticker"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {items.map((item, i) => (
            <TickerItem key={i} {...item} />
          ))}
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f5a623]/40 to-transparent" />

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#0f0c0a] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#0f0c0a] to-transparent pointer-events-none z-10" />
    </div>
  );
}

function TickerItem({
  icon: Icon,
  text,
  accent,
}: {
  icon: React.ElementType;
  text: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 md:px-8 shrink-0 whitespace-nowrap">
      <Icon
        className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0"
        style={{ color: accent }}
      />
      <span
        className="text-xs md:text-sm font-medium tracking-wide"
        style={{ color: accent }}
      >
        {text}
      </span>
      <span className="text-[#2a2420] text-lg leading-none select-none">|</span>
    </div>
  );
}
