"use client";

export function MessageIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Chat bubble 1 (left) */}
      <rect
        x="20"
        y="40"
        width="100"
        height="55"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M35 95 L45 110 L55 95"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <line x1="40" y1="60" x2="100" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="40" y1="72" x2="90" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.2" />

      {/* Chat bubble 2 (right) */}
      <rect
        x="80"
        y="105"
        width="100"
        height="55"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M145 160 L155 175 L165 160"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <line
        x1="100"
        y1="125"
        x2="160"
        y2="125"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1="100"
        y1="137"
        x2="150"
        y2="137"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* Typing dots */}
      <circle cx="110" cy="148" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="122" cy="148" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="134" cy="148" r="3" fill="currentColor" opacity="0.6" />

      {/* Small decorative elements */}
      <circle
        cx="170"
        cy="35"
        r="4"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.2"
      />
      <circle cx="185" cy="50" r="2" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
