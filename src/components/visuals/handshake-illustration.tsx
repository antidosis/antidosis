"use client";

export function HandshakeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left hand */}
      <path
        d="M20 100 Q20 80 40 80 L80 85 Q90 87 95 95 L100 105"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <path d="M35 95 L45 110 L55 105" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
      
      {/* Right hand */}
      <path
        d="M180 100 Q180 80 160 80 L120 85 Q110 87 105 95 L100 105"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
      <path d="M165 95 L155 110 L145 105" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
      
      {/* Connection glow */}
      <circle cx="100" cy="105" r="12" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
      <circle cx="100" cy="105" r="6" fill="currentColor" opacity="0.2" />
      
      {/* Decorative arcs */}
      <path d="M60 130 Q100 160 140 130" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" strokeDasharray="3 3" />
      
      {/* Small dots */}
      <circle cx="50" cy="140" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="150" cy="140" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="100" cy="155" r="2" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
