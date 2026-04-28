"use client";

export function ReputationIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central profile */}
      <circle cx="100" cy="75" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M70 125c0-16.6 13.4-30 30-30s30 13.4 30 30" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      
      {/* Stars orbiting */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = 100 + 55 * Math.cos(rad);
        const y = 100 + 55 * Math.sin(rad);
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <polygon
              points="0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2"
              fill="currentColor"
              opacity={i < 4 ? "0.7" : "0.3"}
            />
          </g>
        );
      })}
      
      {/* Rating bars */}
      <rect x="55" y="165" width="90" height="4" rx="2" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2" />
      <rect x="55" y="165" width="72" height="4" rx="2" fill="currentColor" opacity="0.5" />
      
      <rect x="55" y="175" width="90" height="4" rx="2" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2" />
      <rect x="55" y="175" width="60" height="4" rx="2" fill="currentColor" opacity="0.4" />
      
      <rect x="55" y="185" width="90" height="4" rx="2" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2" />
      <rect x="55" y="185" width="45" height="4" rx="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
