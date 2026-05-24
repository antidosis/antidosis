"use client";

export function ContractIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Document */}
      <rect
        x="45"
        y="25"
        width="110"
        height="150"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Header lines */}
      <line
        x1="65"
        y1="50"
        x2="135"
        y2="50"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <line x1="65" y1="65" x2="115" y2="65" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Body lines */}
      <line
        x1="65"
        y1="85"
        x2="135"
        y2="85"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <line
        x1="65"
        y1="98"
        x2="135"
        y2="98"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <line
        x1="65"
        y1="111"
        x2="135"
        y2="111"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <line
        x1="65"
        y1="124"
        x2="100"
        y2="124"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.3"
      />
      {/* Signature line */}
      <line
        x1="65"
        y1="145"
        x2="100"
        y2="145"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M68 142 Q75 138 82 143 Q88 148 95 141"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
        strokeLinecap="round"
      />
      {/* Second signature */}
      <line
        x1="115"
        y1="145"
        x2="150"
        y2="145"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M118 142 Q125 148 132 140 Q138 136 145 143"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
        strokeLinecap="round"
      />
      {/* Checkmarks */}
      <circle
        cx="55"
        cy="155"
        r="8"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M52 155 L55 158 L59 152"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="145"
        cy="155"
        r="8"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M142 155 L145 158 L149 152"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
