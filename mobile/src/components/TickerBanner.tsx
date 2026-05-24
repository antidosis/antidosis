import {
  Wrench,
  Package,
  CircleDollarSign,
  Heart,
  Star,
  Zap,
  Briefcase,
  Globe,
} from "lucide-react";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   TICKER BANNER
   Infinite scrolling marquee with colored icons and text.
   Full-width, gold border-y, gradient fade edges.
   Pauses on touch.
   ═══════════════════════════════════════════════════════════════ */

interface TickerItem {
  icon: ReactNode;
  text: string;
  color: string;
}

const TICKER_ITEMS: TickerItem[] = [
  { icon: <Wrench size={14} />, text: "Skills", color: "text-[#33d4f5]" },
  { icon: <Package size={14} />, text: "Goods", color: "text-[#35e87a]" },
  { icon: <CircleDollarSign size={14} />, text: "Money", color: "text-[#f0cc33]" },
  { icon: <Heart size={14} />, text: "Social", color: "text-[#f57633]" },
  { icon: <Star size={14} />, text: "Lifestyle", color: "text-[#d76bf5]" },
  { icon: <Zap size={14} />, text: "Wildcard", color: "text-[#f54d99]" },
  { icon: <Briefcase size={14} />, text: "Services", color: "text-[#e8d5a3]" },
  { icon: <Globe size={14} />, text: "Global", color: "text-[#00e5ff]" },
];

export function TickerBanner() {
  // Duplicate items for seamless loop
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="relative w-full border-y border-[var(--sun)]/20 bg-[var(--void-input)] overflow-hidden py-2.5">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--void-input)] to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--void-input)] to-transparent z-10 pointer-events-none" />

      <div className="flex animate-ticker hover:[animation-play-state:paused]">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 px-4 shrink-0">
            <span className={item.color}>{item.icon}</span>
            <span className={`text-xs font-mono ${item.color}`}>{item.text}</span>
            <span className="text-[var(--bronze)] ml-2">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
