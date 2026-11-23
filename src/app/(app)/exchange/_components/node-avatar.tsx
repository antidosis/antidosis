"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NodeAvatarProps {
  name: string | null;
  avatarUrl: string | null;
  /** 0–10 reputation; drives the node ring fill. */
  ratingAvg: number;
  ratingCount: number;
  accountType?: string;
  size?: number;
}

/**
 * A directory member rendered as a mesh node: the avatar is framed by a
 * reputation ring that fills with proven exchanges, and businesses are
 * square base-stations (meshtastic node convention), individuals round.
 */
export function NodeAvatar({
  name,
  avatarUrl,
  ratingAvg,
  ratingCount,
  accountType,
  size = 48,
}: NodeAvatarProps) {
  const isBusiness = accountType === "business";
  const r = size / 2 - 2;
  const circumference = 2 * Math.PI * r;
  // Ring fills with reputation once rated; unrated nodes show an empty ring.
  const fill = ratingCount > 0 ? Math.max(0.08, ratingAvg / 10) : 0;
  const ringColor = isBusiness ? "var(--c-sun)" : "var(--c-mercury)";

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--c-line))"
          strokeWidth="2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fill)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-[3px] overflow-hidden",
          isBusiness ? "rounded-md" : "rounded-full"
        )}
      >
        <Avatar
          src={avatarUrl}
          name={name}
          size="sm"
          className={cn("h-full w-full", isBusiness && "rounded-md")}
        />
      </span>
    </span>
  );
}
