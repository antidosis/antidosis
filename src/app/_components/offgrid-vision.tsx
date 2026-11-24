"use client";

type PhaseStatus = "live" | "building" | "next" | "vision";

const PHASES: {
  node: string;
  title: string;
  body: string;
  status: PhaseStatus;
  statusLabel: string;
}[] = [
  {
    node: "app",
    title: "The platform",
    body: "Exchange, verified identities, signed written agreements, and the relay—the economy, online.",
    status: "live",
    statusLabel: "live",
  },
  {
    node: "relay",
    title: "The trust layer",
    body: "Mobile verification, credentials, and reputation that work as the real trust fabric.",
    status: "live",
    statusLabel: "live",
  },
  {
    node: "lora",
    title: "LoRa mesh pilot",
    body: "Planning and compatibility work for long-range radio nodes. The marketplace still requires internet access; no offline exchange service is available today.",
    status: "building",
    statusLabel: "design stage",
  },
  {
    node: "repeater",
    title: "Solar repeaters",
    body: "Self-powered mesh backbone: hilltop repeaters keeping the network up through any failure.",
    status: "next",
    statusLabel: "next",
  },
  {
    node: "autonomous",
    title: "The off-grid economy",
    body: "The long-term goal: needs, agreements, and reputation available through a local radio mesh during internet outages. Not available today.",
    status: "vision",
    statusLabel: "the vision",
  },
];

const STATUS_STYLES: Record<PhaseStatus, string> = {
  live: "border-ok/40 bg-ok/5 text-ok",
  building: "border-sun/40 bg-sun/5 text-sun",
  next: "border-mercury/40 bg-mercury/5 text-mercury",
  vision: "border-orchid/40 bg-orchid/5 text-orchid",
};

/** LoRa-style node icon: base dot, mast, and signal arcs. */
function NodeIcon({ status }: { status: PhaseStatus }) {
  const arc = (d: string, strong: boolean) => (
    <path
      d={d}
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      stroke={strong ? "rgb(var(--c-sun))" : "rgb(var(--c-linehi))"}
      strokeDasharray={status === "live" || status === "building" ? undefined : "3 5"}
    />
  );
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      {arc("M14 30a11 11 0 0 1 0-14", true)}
      {arc("M9 35a18 18 0 0 1 0-24", status !== "vision")}
      <line x1="24" y1="26" x2="24" y2="34" stroke="rgb(var(--c-linehi))" strokeWidth="2" />
      <circle
        cx="24"
        cy="22"
        r="4"
        fill={status === "live" ? "rgb(var(--c-ok))" : "rgb(var(--c-sun))"}
        opacity={status === "vision" ? 0.5 : 1}
      />
      <rect x="18" y="34" width="12" height="4" rx="1" fill="rgb(var(--c-linehi))" />
    </svg>
  );
}

/**
 * The off-grid vision — why antidosis exists. Nothing on the platform is
 * decoration: every layer is a step toward a local economy that keeps
 * working when the internet doesn't.
 */
export function OffgridVision() {
  return (
    <section className="border-t border-line py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div>
          <p className="text-xs text-ash mb-8 font-mono">
            » THE LONG GAME — FROM APP TO AUTONOMOUS MESH
          </p>
          <h2 className="heading-display text-3xl md:text-4xl text-gold mb-6 max-w-3xl">
            Designed for a future where the internet{" "}
            <span className="text-sun">isn&apos;t required.</span>
          </h2>
          <p className="text-sm md:text-base text-ash mb-8 max-w-2xl leading-relaxed">
            Every antidosis layer exists for one reason: the local economy shouldn&apos;t die when
            infrastructure does. The exchange, the contracts, the relay — and ultimately long-range
            radio nodes across the Central Coast. Here is where we are on the path, honestly.
          </p>
        </div>

        {/* The mesh line: nodes along a route, future links dashed */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, rgb(var(--c-ok)) 0%, rgb(var(--c-sun)) 45%, rgb(var(--c-linehi)) 70%, rgb(var(--c-linehi)) 100%)",
            }}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            {PHASES.map((phase) => (
              <div
                key={phase.node}
                className="h-full rounded-lg border border-line bg-surface/45 p-3 last:col-span-2 md:last:col-span-1 md:p-4"
              >
                <div className="relative">
                  <div className="mb-3 flex items-center gap-3 md:block">
                    <NodeIcon status={phase.status} />
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider md:mt-3 ${STATUS_STYLES[phase.status]}`}
                    >
                      {phase.statusLabel}
                    </span>
                  </div>
                  <h3 className="heading-display text-lg text-gold mb-1.5">{phase.title}</h3>
                  <p className="text-xs leading-relaxed text-ash">{phase.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mt-14 border-l-2 border-sun/40 pl-4 text-sm italic text-parchment/80 max-w-2xl">
            &ldquo;Antidosis&rdquo; is the ancient principle of reciprocal exchange — what is given
            returns. A mesh network is the same idea in radio form: every node strengthens every
            other. The vision is an economy that behaves like one.
          </p>
        </div>
      </div>
    </section>
  );
}
