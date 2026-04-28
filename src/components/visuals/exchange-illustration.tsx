"use client";

export function ExchangeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left person silhouette */}
      <circle cx="100" cy="70" r="30" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M50 180c0-27.6 22.4-50 50-50s50 22.4 50 50" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      
      {/* Right person silhouette */}
      <circle cx="300" cy="70" r="30" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M250 180c0-27.6 22.4-50 50-50s50 22.4 50 50" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
      
      {/* Top arrow left to right */}
      <path d="M140 55 Q200 25 260 55" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" strokeDasharray="4 3" />
      <polygon points="255,50 265,57 255,60" fill="currentColor" opacity="0.8" />
      
      {/* Bottom arrow right to left */}
      <path d="M260 85 Q200 115 140 85" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" strokeDasharray="4 3" />
      <polygon points="145,90 135,83 145,80" fill="currentColor" opacity="0.8" />
      
      {/* Decorative dots */}
      <circle cx="200" cy="140" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="180" cy="160" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="220" cy="160" r="2" fill="currentColor" opacity="0.2" />
      
      {/* Loop ring */}
      <ellipse cx="200" cy="70" rx="90" ry="50" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.15" />
    </svg>
  );
}
