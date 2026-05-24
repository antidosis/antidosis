/**
 * CRT Scanlines Overlay
 *
 * Apply this at the app root for the full Antidosis terminal aesthetic.
 * Uses repeating-linear-gradient to simulate CRT monitor scanlines.
 * pointer-events: none ensures it doesn't block interactions.
 */
export function ScanLines() {
  return <div className="scanlines" aria-hidden="true" />;
}

/**
 * Film Grain Overlay
 *
 * Optional subtle noise texture. Adds analog warmth.
 */
export function FilmGrain() {
  return <div className="film-grain" aria-hidden="true" />;
}

/**
 * Combined Effects Layer
 *
 * Convenience component that renders both scanlines and film grain.
 */
export function EffectsLayer({ grain = true }: { grain?: boolean }) {
  return (
    <>
      <ScanLines />
      {grain && <FilmGrain />}
    </>
  );
}
