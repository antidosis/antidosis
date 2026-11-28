# Antidosis mesh scenario — "When the coast goes quiet"

A standalone interactive 3D field story (Three.js + Vite): the internet uplink fails and
44 real Central Coast communities keep eight exchanges moving over a future community
LoRa mesh. Real OSM geography, bundled OSRM road routes, a relay-failure resilience lab.

## How it ships

The main Next.js app serves the **prebuilt** bundle from `public/scenario/` at
`/scenario` via a rewrite in `next.config.mjs`. The Next build does not compile this
project — edit here, rebuild, and commit the fresh `public/scenario/` output.

## Rebuild

```bash
cd scenario
npm install
npm run build
rm -rf ../public/scenario
cp -r dist ../public/scenario
cp CREDITS.md ../public/scenario/CREDITS.md
```

`src/test/scenario-bundle.test.ts` verifies the shipped bundle matches the contract
(entry document, hashed assets, `/scenario/` base, data + fonts, credits).

## Notes

- `vite.config.js` uses `base: '/scenario/'` — absolute, so assets resolve with or
  without a trailing slash on the page URL. Do not change this without updating the
  font URLs in `src/style.css` and the bundle test.
- Fonts are WOFF2 (converted from the Noto TTFs, OFL — licenses in `public/fonts/`).
- All exchanges are illustrative scenarios, not live listings — keep the honesty
  notice (`.scenario-note`) and the about dialog intact.
- Asset and data attribution lives in `CREDITS.md` (shipped alongside the bundle).

## Performance architecture

The scene runs a two-tier quality system (`src/scene.js`). **Low tier** is selected
for coarse pointers, small screens, or ≤4 GB / ≤4-core devices and gets: no shadow
maps, no post pipeline (direct render + ACES tone mapping instead of the bloom
chain), DPR ≤ 1.25 with a 1.4 M-pixel budget, antialiasing on the canvas itself,
reduced instance counts (town 520, trees 900, rain 600), major-place labels only,
and no backdrop-filter blurs (CSS `@media (pointer: coarse)`). **High tier** keeps
shadows + bloom at DPR ≤ 1.5 with a 3.2 M-pixel budget.

Hard rules learned from a mobile white-screen (lost WebGL context):

- Never enable `preserveDrawingBuffer` outside `?capture=1`.
- Never use MSAA (`samples > 0`) on the half-float scene target — mobile GPUs drop
  the context. The composite pass already dithers.
- Heavy DOM work in `updateUi` is throttled to ~8 Hz; only fades/progress bars run
  per frame. Paused scenes redraw on demand only.
- `webglcontextlost` and the boot watchdog in `index.html` must keep routing to the
  `#fallback` panel — never leave a white or stuck screen.
- `adaptQuality` sheds cost at runtime (pixel ratio → shadows → bloom) if frame
  time stays above ~30 ms.
