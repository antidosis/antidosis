// Parameterized HTML template for Play Store listing graphics.
// Exports buildSlideHtml(params) -> full HTML document. The generator
// (scripts/generate-playstore-graphics.mjs) injects base64 data URIs for fonts,
// logos, and the app screenshot, then screenshots the page at the canvas size.

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")";

const deviceFrames = {
  phone: (shot, { screenW }) => `
    <div class="dev phone" style="--sw:${screenW}px">
      <div class="hw-btn hw-vol-a"></div><div class="hw-btn hw-vol-b"></div><div class="hw-btn hw-pwr"></div>
      <div class="screen"><img src="${shot}" alt=""><div class="notch"></div></div>
    </div>`,
  tablet7: (shot, { screenW }) => `
    <div class="dev tablet7" style="--sw:${screenW}px">
      <div class="cam"></div>
      <div class="screen"><img src="${shot}" alt=""></div>
    </div>`,
  tablet10: (shot, { screenW }) => `
    <div class="dev tablet10" style="--sw:${screenW}px">
      <div class="cam"></div>
      <div class="screen"><img src="${shot}" alt=""></div>
    </div>`,
  laptop: (shot, { screenW }) => `
    <div class="dev laptop" style="--sw:${screenW}px">
      <div class="lid">
        <div class="cam"></div>
        <div class="screen"><img src="${shot}" alt=""></div>
      </div>
      <div class="base"></div>
    </div>`,
};

export function buildSlideHtml(p) {
  const device = deviceFrames[p.device](p.shot, p);
  const logo = p.logo === "full" ? `<img class="logo" src="${p.logoUri}" alt="Antidosis">` : "";
  const footer = p.footer
    ? `<div class="footer"><img src="${p.symbolUri}" alt=""><span>ANTIDOSIS&nbsp;&nbsp;·&nbsp;&nbsp;CENTRAL COAST NSW</span></div>`
    : "";
  const textblock = `
    <div class="textblock align-${p.landscape ? p.landAlign : p.align}">
      ${logo}
      <div class="kicker">${p.kicker}</div>
      <h1 style="font-size:${p.headlineSize}px">${p.headline}</h1>
      <p class="sub">${p.sub}</p>
    </div>`;
  const body = p.landscape
    ? `<div class="row${p.deviceSide === "left" ? " flip" : ""}">
         <div class="textcol">${textblock}</div>
         <div class="devicecol" style="transform:rotate(${p.tilt}deg)">${device}</div>
       </div>`
    : `<div class="col">
         ${textblock}
         <div class="devicezone" style="transform:rotate(${p.tilt}deg)">${device}</div>
       </div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${p.fontsCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${p.width}px;height:${p.height}px;overflow:hidden}
body{font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:100%;height:100%;background:linear-gradient(165deg,#0d100d 0%,#070807 55%,#0a0d0a 100%);color:#f3ecdc;overflow:hidden}
/* backdrop */
.bg{position:absolute;inset:0;pointer-events:none}
.bg::before{content:"";position:absolute;inset:0;background:
  radial-gradient(900px 620px at 12% 6%, rgba(74,222,128,.14), transparent 62%),
  radial-gradient(820px 600px at 90% 96%, rgba(223,177,95,.11), transparent 62%);}
.bg::after{content:"";position:absolute;inset:0;background-image:
  linear-gradient(rgba(74,222,128,.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(74,222,128,.05) 1px, transparent 1px);
  background-size:72px 72px;
  -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 42%, black 25%, transparent 80%);
          mask-image:radial-gradient(ellipse 90% 80% at 50% 42%, black 25%, transparent 80%);}
.grid-fade{position:absolute;inset:0}
.noise{position:absolute;inset:0;background-image:${NOISE};opacity:.05;mix-blend-mode:overlay}
.vignette{position:absolute;inset:0;box-shadow:inset 0 0 260px rgba(0,0,0,.8)}
/* layout */
.col{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;padding:80px 84px 0}
.row{position:relative;z-index:2;height:100%;display:flex;align-items:center;gap:70px;padding:0 96px}
.row.flip{flex-direction:row-reverse}
.textcol{width:44%;flex-shrink:0}
.devicecol{flex:1;display:flex;justify-content:center;align-items:center;position:relative}
.devicezone{flex:1;display:flex;justify-content:center;align-items:flex-start;position:relative;margin-top:26px}
/* text */
.textblock{text-wrap:balance}
.textblock.align-left{text-align:left;margin-right:auto}
.textblock.align-center{text-align:center}
.textblock.align-right{text-align:right;margin-left:auto}
.logo{display:block;height:74px;width:auto;margin:0 auto 30px;filter:drop-shadow(0 0 26px rgba(74,222,128,.35))}
.align-left .logo{margin:0 0 30px}
.align-right .logo{margin:0 0 30px auto}
.kicker{font-family:'JetBrains Mono',monospace;font-size:24px;letter-spacing:.04em;color:#4ade80;margin-bottom:26px}
.kicker .d{color:#6f7a6f}
.kicker .p{color:#3f8f5c}
h1{font-family:'Unbounded',sans-serif;font-weight:900;text-transform:uppercase;line-height:1.04;letter-spacing:-.015em;color:#f3ecdc;text-shadow:0 4px 40px rgba(0,0,0,.6)}
h1 .g{color:#4ade80;text-shadow:0 0 38px rgba(74,222,128,.45)}
h1 .y{color:#e8b45a;text-shadow:0 0 38px rgba(232,180,90,.4)}
.sub{margin-top:26px;font-size:29px;line-height:1.42;color:#b4ad9e;max-width:29em;font-weight:400}
.align-center .sub{margin-left:auto;margin-right:auto}
.align-right .sub{margin-left:auto}
/* devices */
.dev{position:relative}
.screen{width:var(--sw);aspect-ratio:${p.shotAspect};overflow:hidden;background:#000;position:relative}
.screen img{width:100%;height:100%;object-fit:cover;display:block}
/* phone */
.phone{padding:24px;border-radius:92px;background:linear-gradient(165deg,#343439,#0d0d0f 65%);
  box-shadow:0 0 0 2px #000, inset 0 1px 1px rgba(255,255,255,.16), inset 0 -2px 3px rgba(0,0,0,.85),
  0 80px 120px -30px rgba(0,0,0,.9), 0 34px 70px -24px rgba(74,222,128,.1)}
.phone .screen{border-radius:68px}
.phone .notch{position:absolute;top:13px;left:50%;transform:translateX(-50%);width:34%;height:21px;background:#000;border-radius:11px;box-shadow:inset 0 0 0 1px #161616;z-index:3}
.hw-btn{position:absolute;width:4px;background:linear-gradient(90deg,#2c2c30,#19191c);border-radius:2px}
.hw-vol-a{left:-3px;top:190px;height:56px}
.hw-vol-b{left:-3px;top:262px;height:56px}
.hw-pwr{right:-3px;top:236px;height:84px}
/* tablets */
.tablet7{padding:30px;border-radius:62px;background:linear-gradient(165deg,#313136,#0c0c0e 65%);
  box-shadow:0 0 0 2px #000, inset 0 1px 1px rgba(255,255,255,.15), inset 0 -2px 3px rgba(0,0,0,.85),
  0 80px 120px -30px rgba(0,0,0,.9), 0 34px 70px -24px rgba(74,222,128,.09)}
.tablet7 .screen{border-radius:40px}
.tablet10{padding:32px;border-radius:50px;background:linear-gradient(165deg,#313136,#0c0c0e 65%);
  box-shadow:0 0 0 2px #000, inset 0 1px 1px rgba(255,255,255,.15), inset 0 -2px 3px rgba(0,0,0,.85),
  0 70px 110px -28px rgba(0,0,0,.9), 0 30px 60px -22px rgba(74,222,128,.09)}
.tablet10 .screen{border-radius:26px}
.cam{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:11px;height:11px;border-radius:50%;
  background:radial-gradient(circle at 38% 34%, #3d5a70, #04060a 72%);box-shadow:0 0 0 1px #000;z-index:3}
.tablet10 .cam{top:11px}
/* laptop */
.laptop{filter:drop-shadow(0 60px 60px rgba(0,0,0,.55))}
.lid{position:relative;padding:24px 22px 22px;border-radius:18px;background:linear-gradient(180deg,#333338,#121214);
  box-shadow:0 0 0 2px #000, inset 0 1px 1px rgba(255,255,255,.15), 0 50px 90px -25px rgba(0,0,0,.85)}
.laptop .cam{top:9px;width:8px;height:8px}
.laptop .screen{border-radius:9px}
.base{width:110%;margin-left:-5%;height:27px;border-radius:4px 4px 22px 22px;background:linear-gradient(180deg,#414146,#1a1a1d);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.22);position:relative}
.base::after{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:17%;height:10px;background:#0e0e10;border-radius:0 0 12px 12px}
/* floor shadow under devices */
.devicezone::after,.devicecol::after{content:"";position:absolute;bottom:-46px;left:50%;transform:translateX(-50%);
  width:72%;height:44px;background:radial-gradient(ellipse at center, rgba(0,0,0,.65), transparent 68%);pointer-events:none}
/* footer */
.footer{position:absolute;left:0;right:0;bottom:44px;z-index:3;display:flex;align-items:center;justify-content:center;gap:18px;
  font-family:'JetBrains Mono',monospace;font-size:21px;letter-spacing:.34em;color:#6f6a5d}
.footer img{height:32px;width:auto;opacity:.85}
</style></head>
<body><div class="stage">
  <div class="bg"></div><div class="noise"></div><div class="vignette"></div>
  ${body}
  ${footer}
</div></body></html>`;
}
