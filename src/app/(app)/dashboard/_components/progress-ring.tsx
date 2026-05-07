"use client";

export function ProgressRing({
  progress,
  total,
  size = 48,
  strokeWidth = 4,
}: {
  progress: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = total > 0 ? progress / total : 0;
  const offset = circumference - pct * circumference;

  const color = pct === 1 ? "#00e676" : pct >= 0.6 ? "#f5a623" : "#7a6b5a";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1714"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}
