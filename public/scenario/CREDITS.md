# Asset and data credits

## Design asset library

- **Compact celadon cab-over light truck** — asset ID `05-V2-0001`. Adapted as the Noraville mobile-mechanic vehicle. The original hierarchy and root transform are retained inside a placement parent. Static render geometry is material-batched for runtime performance; resources are served pre-decompressed for consistent browser hosting.
- **Cedar and zinc gable house** — asset ID `01-L2-0001`. Adapted as a detailed Kincumber home. Placement, rotation, scale, static material batching, and resource packaging were changed for the coastal scene; the original hierarchy and root transform are retained.
- **Faceted lighthouse** — asset ID `05-V6-0007`. Adapted as a stylised Norah Head landmark: red body materials were changed to warm white, placement and scale were fitted to the headland, and a separate fading rotating beam was added. The original hierarchy and root transform are retained.

Three.js license notices supplied with the assets are preserved in their asset directories.

## Geographic data and routes

- **OpenStreetMap contributors** — community coordinates, named major-road geometry, coastline, and inland-water geometry. OpenStreetMap data is available under the Open Database License; see `https://www.openstreetmap.org/copyright`.
- **AWS/Mapzen Terrain Tiles** — Terrarium elevation tiles, decoded and resampled into the bundled elevation grid. Terrain height is exaggerated tenfold in the scene for legibility.
- **OSRM** — eight illustrative driving routes, distances, and duration estimates generated with the public routing demo and bundled locally. They are route illustrations, not live navigation, road-closure, or travel-condition advice.

The generated `public/data/coast.json` contains 44 selected communities, six illustrative relay positions, 2,679 named major-road ways, elevation and water grids, and eight road routes. The running website makes no requests to these third-party services.

## Typography

Noto Sans Display and Noto Sans Mono, distributed under the SIL Open Font License. License notices are included in `public/fonts/`.

## Scene and scenario

Terrain rendering, water, vegetation, buildings, radio infrastructure, people, resources, packets, boats, weather, lighting, and post-processing are generated for this demonstration. External photographs used during design were reference-only and are not distributed with the project.

All exchanges and outcomes are detailed fictional scenarios inspired by reciprocal-exchange categories. They are not current Antidosis listings, live usage data, network telemetry, or a prediction of radio coverage. Today’s Antidosis marketplace requires internet access; offline LoRa coordination is presented as a design-stage future vision.
