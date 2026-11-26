/**
 * Stylised product renders for the store shelf — pure SVG, theme-token
 * coloured, so the cards feel like a real storefront without shipping
 * image assets. Variants: handheld node, home base, field kit.
 */
export type ProductArtVariant = "node" | "base" | "kit";

const stroke = { stroke: "rgb(var(--c-mercury))" } as const;
const sunFill = { fill: "rgb(var(--c-sun))" } as const;
const sunStroke = { stroke: "rgb(var(--c-sun))" } as const;

function Backdrop() {
  return (
    <>
      <ellipse cx="120" cy="150" rx="72" ry="10" style={{ fill: "rgb(var(--c-mercury) / 0.08)" }} />
      {/* faint mesh dots */}
      {[
        [30, 30],
        [210, 26],
        [24, 96],
        [216, 104],
        [60, 140],
        [186, 146],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="1.6"
          style={{ fill: "rgb(var(--c-mercury) / 0.25)" }}
        />
      ))}
    </>
  );
}

function SignalArcs({ x, y }: { x: number; y: number }) {
  return (
    <>
      {[10, 18, 26].map((r, i) => (
        <path
          key={r}
          d={`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ ...sunStroke, opacity: 0.7 - i * 0.2 }}
        />
      ))}
    </>
  );
}

function NodeArt() {
  return (
    <>
      <Backdrop />
      {/* antenna */}
      <line x1="120" y1="34" x2="120" y2="62" strokeWidth="3" strokeLinecap="round" {...stroke} />
      <circle cx="120" cy="30" r="4" {...sunFill} />
      <SignalArcs x={120} y={22} />
      {/* body */}
      <rect
        x="92"
        y="62"
        width="56"
        height="84"
        rx="12"
        style={{ fill: "rgb(var(--c-inset))", ...stroke }}
        strokeWidth="2.5"
      />
      {/* screen */}
      <rect
        x="102"
        y="74"
        width="36"
        height="26"
        rx="4"
        style={{ fill: "rgb(var(--c-sun) / 0.16)", ...sunStroke }}
        strokeWidth="1.5"
      />
      <line
        x1="108"
        y1="82"
        x2="132"
        y2="82"
        strokeWidth="2"
        strokeLinecap="round"
        {...sunStroke}
        opacity="0.7"
      />
      <line
        x1="108"
        y1="90"
        x2="124"
        y2="90"
        strokeWidth="2"
        strokeLinecap="round"
        {...sunStroke}
        opacity="0.45"
      />
      {/* buttons */}
      <circle cx="112" cy="122" r="5" {...sunFill} opacity="0.9" />
      <circle cx="132" cy="122" r="5" style={{ fill: "rgb(var(--c-mercury) / 0.5)" }} />
    </>
  );
}

function BaseArt() {
  return (
    <>
      <Backdrop />
      {/* antenna */}
      <line x1="150" y1="40" x2="150" y2="86" strokeWidth="3" strokeLinecap="round" {...stroke} />
      <circle cx="150" cy="36" r="4" {...sunFill} />
      <SignalArcs x={150} y={28} />
      {/* base unit */}
      <rect
        x="66"
        y="86"
        width="108"
        height="56"
        rx="10"
        style={{ fill: "rgb(var(--c-inset))", ...stroke }}
        strokeWidth="2.5"
      />
      {/* status lights */}
      <circle cx="86" cy="106" r="4" {...sunFill} />
      <circle cx="100" cy="106" r="4" style={{ fill: "rgb(var(--c-mercury) / 0.5)" }} />
      <circle cx="114" cy="106" r="4" style={{ fill: "rgb(var(--c-mercury) / 0.3)" }} />
      {/* vents */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={132 + i * 10}
          y1="100"
          x2={132 + i * 10}
          y2="126"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ stroke: "rgb(var(--c-mercury) / 0.4)" }}
        />
      ))}
      <line
        x1="80"
        y1="126"
        x2="120"
        y2="126"
        strokeWidth="2"
        strokeLinecap="round"
        {...sunStroke}
        opacity="0.5"
      />
      {/* power lead */}
      <path
        d="M 174 128 C 196 128 200 142 214 142"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ stroke: "rgb(var(--c-mercury) / 0.5)" }}
      />
    </>
  );
}

function KitArt() {
  return (
    <>
      <Backdrop />
      {/* sun */}
      <circle cx="196" cy="34" r="10" style={{ fill: "rgb(var(--c-sun) / 0.25)" }} />
      <circle cx="196" cy="34" r="5" {...sunFill} />
      {/* solar panel */}
      <g transform="rotate(-12 150 108)">
        <rect
          x="118"
          y="84"
          width="72"
          height="48"
          rx="6"
          style={{ fill: "rgb(var(--c-inset))", ...stroke }}
          strokeWidth="2.5"
        />
        {[0, 1, 2].map((i) => (
          <line
            key={`v${i}`}
            x1={136 + i * 18}
            y1="88"
            x2={136 + i * 18}
            y2="128"
            strokeWidth="1.5"
            style={{ stroke: "rgb(var(--c-mercury) / 0.4)" }}
          />
        ))}
        <line
          x1="122"
          y1="108"
          x2="186"
          y2="108"
          strokeWidth="1.5"
          style={{ stroke: "rgb(var(--c-mercury) / 0.4)" }}
        />
      </g>
      {/* node */}
      <line x1="66" y1="52" x2="66" y2="76" strokeWidth="3" strokeLinecap="round" {...stroke} />
      <circle cx="66" cy="48" r="4" {...sunFill} />
      <rect
        x="46"
        y="76"
        width="42"
        height="64"
        rx="9"
        style={{ fill: "rgb(var(--c-inset))", ...stroke }}
        strokeWidth="2.5"
      />
      <rect
        x="54"
        y="86"
        width="26"
        height="18"
        rx="3"
        style={{ fill: "rgb(var(--c-sun) / 0.16)", ...sunStroke }}
        strokeWidth="1.5"
      />
      <circle cx="67" cy="122" r="4.5" {...sunFill} opacity="0.9" />
      {/* cable node → panel */}
      <path
        d="M 88 116 C 102 128 108 126 118 120"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ stroke: "rgb(var(--c-mercury) / 0.5)" }}
      />
    </>
  );
}

export function ProductArt({
  variant,
  className,
}: {
  variant: ProductArtVariant;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 240 170" className={className} aria-hidden="true">
      {variant === "node" && <NodeArt />}
      {variant === "base" && <BaseArt />}
      {variant === "kit" && <KitArt />}
    </svg>
  );
}
