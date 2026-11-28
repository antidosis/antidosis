"use client";

import { ArrowRight, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Home-page teaser for /scenario — the interactive 3D field story where the
 * internet fails and the Central Coast keeps exchanging over a future LoRa
 * mesh. The visual is a stylised coast instrument, not a screenshot: cheap
 * to render, honest about being illustrative.
 */
export function ScenarioTeaser() {
  const { ref, isInView } = useInView();
  return (
    <section data-signal-scene="scenario" className="home-chapter home-scenario py-16 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-12 md:px-8">
        <div
          ref={ref}
          className={cn(
            "reveal transition-all duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          <p className="mb-3 font-mono text-xs text-mercury">
            » FIELD STORY — AN INTERACTIVE 3D SCENARIO
          </p>
          <h2 className="heading-display text-3xl text-gold md:text-4xl">
            When the coast goes <span className="text-sun">quiet.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-parchment">
            18:42. The internet uplink fails. Watch 44 Central Coast communities — Woy Woy to Wyee —
            keep eight real exchanges moving over a future community LoRa mesh.
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash">
            Real geography, real road routes, and a resilience lab where you can knock a relay
            offline and watch every exchange path recompute. Two minutes, in your browser.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-ash">
            <span>44 communities</span>
            <span>8 exchanges</span>
            <span>6 solar relays</span>
            <span>120 seconds</span>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              {/* Plain anchor: /scenario is a prebuilt static app, not a Next route */}
              <a href="/scenario">
                Watch the scenario <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <span className="font-mono text-xs text-ash">Free · no sign-up · WebGL</span>
          </div>
        </div>

        <div
          className={cn(
            "reveal transition-all delay-150 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          <div className="vessel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ash">
              <span className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-sun" /> Coast scenario
              </span>
              <span>Illustrative mesh</span>
            </div>
            <CoastInstrument />
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-ash">
              <span>Woy Woy → Wyee</span>
              <span className="text-sun">Uplink lost · mesh on air</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Stylised coast: ocean to the right, a shoreline, relay ridges and radio arcs. */
function CoastInstrument() {
  const relays = [
    { x: 96, y: 236, label: "WOY WOY" },
    { x: 128, y: 178, label: "GOSFORD" },
    { x: 118, y: 118, label: "WYONG" },
    { x: 150, y: 58, label: "WYEE" },
  ];
  const arcs: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 2],
  ];
  return (
    <svg
      viewBox="0 0 400 300"
      className="h-[240px] w-full md:h-[300px]"
      role="img"
      aria-label="Stylised Central Coast mesh: relay nodes along a coastline passing radio signals"
    >
      <style>{`
        @keyframes scenario-dash{to{stroke-dashoffset:-24}}
        .scenario-arc{stroke-dasharray:3 9;animation:scenario-dash 1.8s linear infinite}
        @media (prefers-reduced-motion:reduce){.scenario-arc{animation:none}}
      `}</style>
      {/* ocean */}
      <rect width="400" height="300" fill="rgb(var(--c-void))" />
      <path
        d="M170 0 C 200 60, 185 110, 210 160 C 235 210, 215 250, 235 300 L 400 300 L 400 0 Z"
        fill="rgb(var(--c-mercury) / 0.05)"
      />
      {/* shoreline */}
      <path
        d="M170 0 C 200 60, 185 110, 210 160 C 235 210, 215 250, 235 300"
        fill="none"
        stroke="rgb(var(--c-linehi))"
        strokeWidth="1.5"
      />
      {/* ridgeline */}
      <path
        d="M60 0 C 90 70, 70 140, 95 200 C 110 240, 100 270, 110 300"
        fill="none"
        stroke="rgb(var(--c-line))"
        strokeWidth="1"
        strokeDasharray="2 5"
      />
      {/* radio arcs between relays */}
      {arcs.map(([a, b]) => {
        const from = relays[a];
        const to = relays[b];
        const midX = (from.x + to.x) / 2 - 26;
        const midY = (from.y + to.y) / 2;
        return (
          <path
            key={`${a}-${b}`}
            className="scenario-arc"
            d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
            fill="none"
            stroke="rgb(var(--c-sun) / 0.55)"
            strokeWidth="1.2"
          />
        );
      })}
      {/* relay nodes with ping rings */}
      {relays.map((relay) => (
        <g key={relay.label}>
          <circle
            cx={relay.x}
            cy={relay.y}
            r="10"
            fill="none"
            stroke="rgb(var(--c-sun) / 0.35)"
            className="motion-safe:animate-ping"
            style={{ transformOrigin: `${relay.x}px ${relay.y}px` }}
          />
          <circle cx={relay.x} cy={relay.y} r="3.5" fill="rgb(var(--c-sun))" />
          <text
            x={relay.x + 12}
            y={relay.y + 3}
            fill="rgb(var(--c-ash))"
            fontSize="8"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {relay.label}
          </text>
        </g>
      ))}
      {/* a few community dots along the shore */}
      {[
        [190, 92],
        [206, 150],
        [222, 214],
        [180, 44],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="rgb(var(--c-mercury) / 0.7)" />
      ))}
    </svg>
  );
}
