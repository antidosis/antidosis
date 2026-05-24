import * as React from "react";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizePixels = {
  sm: 32,
  md: 40,
  lg: 56,
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-sm",
  };

  const px = sizePixels[size];

  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden border border-[#2a2420] bg-[#1a1714] rounded-md flex-shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name || "Avatar"}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          unoptimized={src.startsWith("data:")}
        />
      ) : null}
      <span className="text-[#b8a078] font-medium">{initials}</span>
    </div>
  );
}
