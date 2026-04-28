"use client";

export function IdentityIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield outline */}
      <path
        d="M100 20 L170 50 V100 C170 145 100 180 100 180 C100 180 30 145 30 100 V50 L100 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Checkmark */}
      <path
        d="M70 95 L90 115 L130 75"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Person silhouette behind */}
      <circle cx="100" cy="55" r="15" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <path d="M80 90c0-11 9-20 20-20s20 9 20 20" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      {/* Decorative ring */}
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.1" strokeDasharray="3 5" />
    </svg>
  );
}
