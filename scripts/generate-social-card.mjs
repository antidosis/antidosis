import sharp from "sharp";

const output = "public/images/social-card.png";
const background = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#06130f"/>
      <stop offset=".58" stop-color="#0b1d17"/>
      <stop offset="1" stop-color="#102b25"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop stop-color="#43e69a" stop-opacity=".18"/>
      <stop offset="1" stop-color="#43e69a" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#9bd9c3" stroke-opacity=".035"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="1040" cy="270" r="360" fill="url(#glow)"/>
  <g fill="none" stroke="#62d9c5" stroke-opacity=".16">
    <circle cx="1000" cy="310" r="82"/>
    <circle cx="1000" cy="310" r="148"/>
    <circle cx="1000" cy="310" r="218"/>
    <path d="M1000 310L1130 190M1000 310L1140 430M1000 310L862 185" stroke-opacity=".28"/>
  </g>
  <g fill="#68e5a6">
    <circle cx="1000" cy="310" r="9"/>
    <circle cx="1130" cy="190" r="6"/>
    <circle cx="1140" cy="430" r="6"/>
    <circle cx="862" cy="185" r="6"/>
  </g>
  <rect x="34" y="34" width="1132" height="562" rx="22" fill="none" stroke="#a7d9c7" stroke-opacity=".16"/>
  <text x="1128" y="80" text-anchor="end" fill="#91b9aa" font-family="monospace" font-size="17" letter-spacing="2">LOCAL • VERIFIED • HUMAN</text>
  <text x="72" y="348" fill="#f2f5ef" font-family="Arial, sans-serif" font-size="62" font-weight="700">One network.</text>
  <text x="72" y="420" fill="#f2f5ef" font-family="Arial, sans-serif" font-size="62" font-weight="700">Every local exchange.</text>
  <text x="74" y="482" fill="#b8ccc2" font-family="Arial, sans-serif" font-size="25">Needs · skills · goods · direct agreements</text>
  <rect x="72" y="526" width="348" height="42" rx="21" fill="#43e69a" fill-opacity=".09" stroke="#61d8ae" stroke-opacity=".28"/>
  <circle cx="96" cy="547" r="5" fill="#64e5a5"/>
  <text x="112" y="554" fill="#73dfba" font-family="monospace" font-size="18">CENTRAL COAST, NSW</text>
</svg>`);

const logo = await sharp("public/images/logo.png").resize({ width: 390 }).png().toBuffer();
await sharp(background)
  .composite([{ input: logo, left: 64, top: 88 }])
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`Generated ${output} (1200 × 630)`);
