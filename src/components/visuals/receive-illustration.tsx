"use client";

export function ReceiveIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Inbox tray */}
      <path d="M30 70 L50 150 L150 150 L170 70" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      <line x1="30" y1="70" x2="170" y2="70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      
      {/* Envelope */}
      <rect x="70" y="40" width="60" height="40" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M70 45 L100 65 L130 45" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      
      {/* Star accents */}
      <polygon points="45,90 47,95 52,95 48,98 50,103 45,100 40,103 42,98 38,95 43,95" fill="currentColor" opacity="0.5" />
      <polygon points="155,90 157,95 162,95 158,98 160,103 155,100 150,103 152,98 148,95 153,95" fill="currentColor" opacity="0.5" />
      <polygon points="100,115 102,120 107,120 103,123 105,128 100,125 95,128 97,123 93,120 98,120" fill="currentColor" opacity="0.4" />
      
      {/* Bottom lines */}
      <line x1="70" y1="170" x2="130" y2="170" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <line x1="80" y1="180" x2="120" y2="180" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
    </svg>
  );
}
