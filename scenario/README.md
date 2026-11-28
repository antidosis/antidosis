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
