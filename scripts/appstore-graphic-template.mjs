// App Store variant of the Play Store graphic template. Same design language,
// but every fixed px value scales via p.scale so one template serves the
// 1290x2796 / 1242x2688 iPhone canvases and the 2048x2732 / 1668x2388 iPad
// canvases. Device frames: phone (rounded + Dynamic Island) and ipad
// (uniform slim bezel + camera dot).
// Exports buildSlideHtml(params) -> full HTML document (assets as data URIs).

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")";

const deviceFrames = {
  phone: (shot, { screenW, u }) => `
    <div class="dev phone" style="--sw:${screenW}px">
      <div class="hw-btn hw-vol-a"></div><div class="hw-btn hw-vol-b"></div><div class="hw-btn hw-pwr"></div>
      <div class="screen"><img src="${shot}" alt=""><div class="notch"></div></div>
    </div>`,
  ipad: (shot, { screenW, u }) => `
    <div class="dev ipad" style="--sw:${screenW}px">
      <div class="cam"></div>
      <div class="screen"><img src="${shot}" alt=""></div>
    </div>`,
};

export function buildSlideHtml(p) {
  const u = (v) => Math.round(v * (p.scale ?? 1) * 10) / 10;
  const device = deviceFrames[p.device](p.shot, { ...p, u });
  const logo = p.logo === "full" ? `<img class="logo" src="${p.logoUri}" alt="Antidosis">` : "";
  const footer = p.footer
    ? `<div class="footer"><img src="${p.symbolUri}" alt=""><span>ANTIDOSIS&nbsp;&nbsp;·&nbsp;&nbsp;CENTRAL COAST NSW</span></div>`
    : "";
  const textblock = `
    <div class="textblock align-${p.align}">
      ${logo}
      <div class="kicker">${p.kicker}</div>
      <h1 style="font-size:${p.headlineSize}px">${p.headline}</h1>
      <p class="sub">${p.sub}</p>
    </div>`;
  const body = `
    <div class="col">
      ${textblock}
      <div class="devicezone" style="transform:rotate(${p.tilt}deg)">${device}</div>
    </div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${p.fontsCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${p.width}px;height:${p.height}px;overflow:hidden}
body{font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;width:100%;height:100%;background:linear-gradient(165deg,#0d100d 0%,#070807 55%,#0a0d0a 100%);color:#f3ecdc;overflow:hidden}
.bg{position:absolute;inset:0;pointer-events:none}
.bg::before{content:"";position:absolute;inset:0;background:
  radial-gradient(${u(900)}px ${u(620)}px at 12% 6%, rgba(74,222,128,.14), transparent 62%),
  radial-gradient(${u(820)}px ${u(600)}px at 90% 96%, rgba(223,177,95,.11), transparent 62%);}
.bg::after{content:"";position:absolute;inset:0;background-image:
  linear-gradient(rgba(74,222,128,.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(74,222,128,.05) 1px, transparent 1px);
  background-size:${u(72)}px ${u(72)}px;
  -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 42%, black 25%, transparent 80%);
          mask-image:radial-gradient(ellipse 90% 80% at 50% 42%, black 25%, transparent 80%);}
.noise{position:absolute;inset:0;background-image:${NOISE};opacity:.05;mix-blend-mode:overlay}
.vignette{position:absolute;inset:0;box-shadow:inset 0 0 ${u(260)}px rgba(0,0,0,.8)}
.col{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;align-items:stretch;padding:${u(80)}px ${u(84)}px 0}
.devicezone{flex:1;display:flex;justify-content:center;align-items:flex-start;position:relative;margin-top:${u(26)}px}
.textblock{text-wrap:balance}
.textblock.align-left{text-align:left;margin-right:auto}
.textblock.align-center{text-align:center}
.textblock.align-right{text-align:right;margin-left:auto}
.logo{display:block;height:${u(74)}px;width:auto;margin:0 auto ${u(30)}px;filter:drop-shadow(0 0 ${u(26)}px rgba(74,222,128,.35))}
.align-left .logo{margin:0 0 ${u(30)}px}
.align-right .logo{margin:0 0 ${u(30)}px auto}
.kicker{font-family:'JetBrains Mono',monospace;font-size:${u(24)}px;letter-spacing:.04em;color:#4ade80;margin-bottom:${u(26)}px}
.kicker .d{color:#6f7a6f}
.kicker .p{color:#3f8f5c}
h1{font-family:'Unbounded',sans-serif;font-weight:900;text-transform:uppercase;line-height:1.04;letter-spacing:-.015em;color:#f3ecdc;text-shadow:0 ${u(4)}px ${u(40)}px rgba(0,0,0,.6)}
h1 .g{color:#4ade80;text-shadow:0 0 ${u(38)}px rgba(74,222,128,.45)}
h1 .y{color:#e8b45a;text-shadow:0 0 ${u(38)}px rgba(232,180,90,.4)}
.sub{margin-top:${u(26)}px;font-size:${u(29)}px;line-height:1.42;color:#b4ad9e;max-width:29em;font-weight:400}
.align-center .sub{margin-left:auto;margin-right:auto}
.align-right .sub{margin-left:auto}
.dev{position:relative}
.screen{width:var(--sw);aspect-ratio:${p.shotAspect};overflow:hidden;background:#000;position:relative}
.screen img{width:100%;height:100%;object-fit:cover;display:block}
/* iphone */
.phone{padding:${u(24)}px;border-radius:${u(92)}px;background:linear-gradient(165deg,#343439,#0d0d0f 65%);
  box-shadow:0 0 0 2px #000, inset 0 1px 1px rgba(255,255,255,.16), inset 0 -2px 3px rgba(0,0,0,.85),
  0 ${u(80)}px ${u(120)}px -30px rgba(0,0,0,.9), 0 ${u(34)}px ${u(70)}px -24px rgba(74,222,128,.1)}
.phone .screen{border-radius:${u(68)}px}
.phone .notch{position:absolute;top:${u(13)}px;left:50%;transform:translateX(-50%);width:34%;height:${u(21)}px;background:#000;border-radius:${u(11)}px;box-shadow:inset 0 0 0 1px #161616;z-index:3}
.hw-btn{position:absolute;width:${Math.max(3, u(4))}px;background:linear-gradient(90deg,#2c2c30,#19191c);border-radius:2px}
.hw-vol-a{left:-3px;top:${u(190)}px;height:${u(56)}px}
.hw-vol-b{left:-3px;top:${u(262)}px;height:${u(56)}px}
.hw-pwr{right:-3px;top:${u(236)}px;height:${u(84)}px}
/* ipad */
.ipad{padding:${u(34)}px;border-radius:${u(64)}px;background:linear-gradient(165deg,#323237,#0c0c0e 65%);
  box-shadow:0 0 0 2px #000, inset 0 1px 1px rgba(255,255,255,.15), inset 0 -2px 3px rgba(0,0,0,.85),
  0 ${u(80)}px ${u(120)}px -30px rgba(0,0,0,.9), 0 ${u(34)}px ${u(70)}px -24px rgba(74,222,128,.09)}
.ipad .screen{border-radius:${u(38)}px}
.cam{position:absolute;top:${u(11)}px;left:50%;transform:translateX(-50%);width:${u(11)}px;height:${u(11)}px;border-radius:50%;
  background:radial-gradient(circle at 38% 34%, #3d5a70, #04060a 72%);box-shadow:0 0 0 1px #000;z-index:3}
.devicezone::after{content:"";position:absolute;bottom:${-u(46)}px;left:50%;transform:translateX(-50%);
  width:72%;height:${u(44)}px;background:radial-gradient(ellipse at center, rgba(0,0,0,.65), transparent 68%);pointer-events:none}
.footer{position:absolute;left:0;right:0;bottom:${u(44)}px;z-index:3;display:flex;align-items:center;justify-content:center;gap:${u(18)}px;
  font-family:'JetBrains Mono',monospace;font-size:${u(21)}px;letter-spacing:.34em;color:#6f6a5d}
.footer img{height:${u(32)}px;width:auto;opacity:.85}
</style></head>
<body><div class="stage">
  <div class="bg"></div><div class="noise"></div><div class="vignette"></div>
  ${body}
  ${footer}
</div></body></html>`;
}
