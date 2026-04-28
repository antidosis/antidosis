"use client";

export function PostIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Document */}
      <rect x="50" y="30" width="100" height="130" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Lines */}
      <line x1="70" y1="55" x2="130" y2="55" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="70" y1="70" x2="120" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="70" y1="82" x2="130" y2="82" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <line x1="70" y1="94" x2="110" y2="94" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <line x1="70" y1="106" x2="130" y2="106" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      
      {/* Plus sign overlay */}
      <circle cx="130" cy="130" r="25" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      <line x1="130" y1="118" x2="130" y2="142" stroke="currentColor" strokeWidth="2" opacity="0.9" strokeLinecap="round" />
      <line x1="118" y1="130" x2="142" y2="130" stroke="currentColor" strokeWidth="2" opacity="0.9" strokeLinecap="round" />
      
      {/* Small accent */}
      <circle cx="45" cy="150" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="40" cy="160" r="2" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
