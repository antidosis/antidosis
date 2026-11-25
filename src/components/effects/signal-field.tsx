"use client";

import { useEffect, useRef } from "react";

type RGB = [number, number, number];
type SceneName =
  | "hero"
  | "exchange"
  | "path"
  | "direct"
  | "trust"
  | "relay"
  | "communities"
  | "expansion"
  | "offgrid"
  | "join";

interface SceneSpec {
  tone: string;
  energy: number;
  links: number;
  logo: number;
  direct?: boolean;
  trust?: boolean;
  broadcast?: boolean;
  blackout?: boolean;
}

interface MeshNode {
  x: number;
  y: number;
  z: number;
  size: number;
  phase: number;
}

interface ProjectedNode {
  x: number;
  y: number;
  depth: number;
  size: number;
  visible: boolean;
}

const SCENES: Record<SceneName, SceneSpec> = {
  hero: { tone: "--c-ok", energy: 0.48, links: 0.46, logo: 0.58 },
  exchange: { tone: "--c-sun", energy: 0.55, links: 0.62, logo: 0 },
  path: { tone: "--c-aqua", energy: 0.64, links: 0.72, logo: 0 },
  direct: { tone: "--c-mercury", energy: 0.24, links: 0.16, logo: 0, direct: true },
  trust: { tone: "--c-ok", energy: 0.22, links: 0.36, logo: 0, trust: true },
  relay: { tone: "--c-mercury", energy: 0.7, links: 0.82, logo: 0 },
  communities: { tone: "--c-orchid", energy: 0.54, links: 0.64, logo: 0, broadcast: true },
  expansion: { tone: "--c-sun", energy: 0.36, links: 0.48, logo: 0 },
  offgrid: { tone: "--c-aqua", energy: 0.58, links: 0.74, logo: 0, blackout: true },
  join: { tone: "--c-ok", energy: 0.62, links: 0.78, logo: 0.84 },
};

const FALLBACKS: Record<string, RGB> = {
  "--c-ok": [0, 230, 118],
  "--c-aqua": [30, 196, 184],
  "--c-mercury": [0, 229, 255],
  "--c-sun": [245, 166, 35],
  "--c-orchid": [215, 107, 245],
};

const LOGO_SEGMENTS: [number, number, number, number][] = [
  [-1, -0.72, -1, 0.72],
  [-1, -0.72, -0.72, -0.72],
  [-1, 0.72, -0.72, 0.72],
  [1, -0.72, 1, 0.72],
  [1, -0.72, 0.72, -0.72],
  [1, 0.72, 0.72, 0.72],
  [-0.48, 0.55, 0, -0.58],
  [0, -0.58, 0.48, 0.55],
  [-0.31, 0.15, 0.31, 0.15],
  [-0.24, 0.55, -0.24, -0.12],
  [-0.24, -0.12, 0.24, 0.55],
  [0.24, 0.55, 0.24, -0.12],
];

const LOGO_POINTS = LOGO_SEGMENTS.flatMap(([x1, y1, x2, y2]) =>
  Array.from({ length: 5 }, (_, index) => ({
    x: x1 + ((x2 - x1) * index) / 4,
    y: y1 + ((y2 - y1) * index) / 4,
  }))
);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function ease(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function readRgb(token: string): RGB {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const parts = value.split(/\s+/).map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? [parts[0], parts[1], parts[2]]
    : (FALLBACKS[token] ?? FALLBACKS["--c-ok"]);
}

function createNodes(count: number): MeshNode[] {
  let seed = 41731;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963 + random() * 0.35;
    const radius = 0.7 + Math.sqrt((index + 0.5) / count) * 3.2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.9 + (random() - 0.5) * 0.7,
      z: 0.25 + random() * 4.2,
      size: 1.1 + random() * 1.8,
      phase: random() * Math.PI * 2,
    };
  });
}

function createLinks(nodes: MeshNode[]): [number, number][] {
  const links: [number, number][] = [];
  nodes.forEach((node, index) => {
    const nearest = nodes
      .map((other, otherIndex) => ({
        otherIndex,
        distance: Math.hypot(node.x - other.x, node.y - other.y, node.z - other.z),
      }))
      .filter(({ otherIndex }) => otherIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    nearest.forEach(({ otherIndex }) => {
      if (!links.some(([a, b]) => a === otherIndex && b === index)) links.push([index, otherIndex]);
    });
  });
  return links;
}

export function SignalField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    const journey = document.querySelector<HTMLElement>("[data-signal-journey='home']");
    if (!root || !canvas || !ctx || !journey) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const startedAt = performance.now();
    const nodes = createNodes(coarse ? 26 : 48);
    const links = createLinks(nodes);
    const projected: ProjectedNode[] = nodes.map(() => ({
      x: 0,
      y: 0,
      depth: 1,
      size: 1,
      visible: true,
    }));
    let sections: { name: SceneName; center: number }[] = [];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let lastFrame = 0;
    let lastAmbient = 0;
    // Full-screen fixed canvas: repaint at full rate only briefly after the
    // user interacts (scroll/pointer/theme), then settle to an ambient rate.
    // The scene is rotation-on-scroll + slow pulses, so 15fps idle looks
    // identical in character while roughly halving sustained canvas work.
    let hiResUntil = 0;
    let ambientRgb = "";
    let maxScroll = 1;
    let scroll = window.scrollY;
    let pointerX = 0;
    let pointerY = 0;
    let palette = Object.fromEntries(
      Object.keys(FALLBACKS).map((token) => [token, readRgb(token)])
    ) as Record<string, RGB>;

    function measureSections() {
      const pageScroll = window.scrollY;
      sections = Array.from(journey!.querySelectorAll<HTMLElement>("[data-signal-scene]"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            name: (element.dataset.signalScene || "hero") as SceneName,
            center: rect.top + pageScroll + rect.height / 2,
          };
        })
        .filter((section) => SCENES[section.name]);
      maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    }

    function currentScene() {
      const focus = scroll + height * 0.52;
      if (sections.length === 0) return { spec: SCENES.hero, colour: palette["--c-ok"], local: 0 };
      let left = sections[0];
      let right = sections[sections.length - 1];
      for (let index = 0; index < sections.length - 1; index += 1) {
        if (focus >= sections[index].center && focus <= sections[index + 1].center) {
          left = sections[index];
          right = sections[index + 1];
          break;
        }
        if (focus < sections[0].center) {
          right = sections[0];
          break;
        }
        if (focus > sections[sections.length - 1].center) left = right;
      }
      const amount =
        left === right ? 0 : ease((focus - left.center) / (right.center - left.center));
      const a = SCENES[left.name];
      const b = SCENES[right.name];
      const colourA = palette[a.tone];
      const colourB = palette[b.tone];
      return {
        spec: {
          ...a,
          energy: mix(a.energy, b.energy, amount),
          links: mix(a.links, b.links, amount),
          logo: mix(a.logo, b.logo, amount),
          direct: amount < 0.5 ? a.direct : b.direct,
          trust: amount < 0.5 ? a.trust : b.trust,
          broadcast: amount < 0.5 ? a.broadcast : b.broadcast,
          blackout: amount < 0.5 ? a.blackout : b.blackout,
        },
        colour: colourA.map((value, index) => mix(value, colourB[index], amount)) as RGB,
        local: left === right ? 0.5 : amount,
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // Ambient backdrop: soft particles at 72% opacity — DPR 1 is
      // imperceptible here and ~36% fewer pixels per repaint than 1.25.
      dpr = 1;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureSections();
      if (reducedMotion) drawFrame(performance.now());
    }

    function drawLogo(strength: number) {
      if (strength <= 0.01) return;
      const centerX = coarse ? width * 0.5 : width * 0.74;
      const centerY = height * 0.46;
      const scale = Math.min(width, height) * 0.22;
      ctx!.save();
      ctx!.strokeStyle = `rgba(${palette["--c-ok"].join(",")},${strength * 0.48})`;
      ctx!.lineWidth = 1.2;
      LOGO_SEGMENTS.forEach(([x1, y1, x2, y2]) => {
        ctx!.beginPath();
        ctx!.moveTo(centerX + x1 * scale, centerY + y1 * scale);
        ctx!.lineTo(centerX + x2 * scale, centerY + y2 * scale);
        ctx!.stroke();
      });
      ctx!.restore();
    }

    function drawFrame(now: number) {
      const scene = currentScene();
      const logoStrength = scene.spec.logo * (1 - scene.local * 0.72);
      const documentProgress = clamp(scroll / maxScroll);
      const rotation = documentProgress * 0.62 + pointerX * 0.055;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rgb = scene.colour.map(Math.round).join(",");
      const centreX = width * (coarse ? 0.54 : 0.58);
      const centreY = height * 0.5;
      const logoCentreX = coarse ? width * 0.5 : width * 0.74;
      const logoCentreY = height * 0.46;
      const logoScale = Math.min(width, height) * 0.22;
      const linkCount = Math.floor(links.length * scene.spec.links);

      ctx!.clearRect(0, 0, width, height);
      nodes.forEach((node, index) => {
        const rotatedX = node.x * cos - (node.z - 2.3) * sin;
        const rotatedZ = node.x * sin + (node.z - 2.3) * cos + 2.3;
        const depth = 2.9 / (rotatedZ + 3.1);
        const travel = (documentProgress - 0.5) * 2.8;
        const point = projected[index];
        point.x = centreX + rotatedX * depth * width * 0.16 + pointerX * depth * 5;
        point.y = centreY + (node.y - travel) * depth * height * 0.2 + pointerY * depth * 4;
        point.depth = depth;
        point.size = node.size * depth;
        point.visible =
          point.x > -40 && point.x < width + 40 && point.y > -40 && point.y < height + 40;
        if (logoStrength > 0.01 && index < LOGO_POINTS.length) {
          const target = LOGO_POINTS[index];
          const strength = ease(logoStrength);
          point.x = mix(point.x, logoCentreX + target.x * logoScale, strength);
          point.y = mix(point.y, logoCentreY + target.y * logoScale, strength);
          point.visible = true;
        }
      });

      for (let index = 0; index < linkCount; index += 1) {
        const [fromIndex, toIndex] = links[index];
        const from = projected[fromIndex];
        const to = projected[toIndex];
        if (!from.visible || !to.visible) continue;
        if (scene.spec.blackout && (fromIndex % 5 === 0 || toIndex % 5 === 0)) continue;
        if (
          logoStrength > 0.5 &&
          (fromIndex >= LOGO_POINTS.length || toIndex >= LOGO_POINTS.length)
        )
          continue;
        const distance = Math.hypot(from.x - to.x, from.y - to.y);
        if (distance > Math.min(width, height) * 0.42) continue;
        const alpha =
          (0.065 + scene.spec.energy * 0.13) * (1 - distance / (Math.min(width, height) * 0.55));
        ctx!.strokeStyle = `rgba(${rgb},${Math.max(0.012, alpha)})`;
        ctx!.lineWidth = 0.55 + scene.spec.energy * 0.25;
        ctx!.beginPath();
        ctx!.moveTo(from.x, from.y);
        ctx!.lineTo(to.x, to.y);
        ctx!.stroke();
      }

      if (scene.spec.direct && projected[0].visible && projected[1].visible) {
        ctx!.strokeStyle = `rgba(${rgb},0.42)`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.moveTo(projected[0].x, projected[0].y);
        ctx!.lineTo(projected[1].x, projected[1].y);
        ctx!.stroke();
      }

      if (!reducedMotion && scene.spec.energy > 0.3 && logoStrength < 0.65) {
        for (let pulse = 0; pulse < 3; pulse += 1) {
          const link = links[(Math.floor(now / 2400) * 3 + pulse * 7) % Math.max(1, linkCount)];
          if (!link) continue;
          const from = projected[link[0]];
          const to = projected[link[1]];
          if (!from.visible || !to.visible) continue;
          const progress = (now * 0.00022 + pulse / 3) % 1;
          const x = mix(from.x, to.x, progress);
          const y = mix(from.y, to.y, progress);
          ctx!.fillStyle = `rgba(${rgb},${Math.sin(progress * Math.PI) * 0.72})`;
          ctx!.beginPath();
          ctx!.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      nodes.forEach((node, index) => {
        const point = projected[index];
        if (!point.visible) return;
        if (scene.spec.blackout && index % 5 === 0) return;
        const pulse = reducedMotion ? 1 : 0.88 + Math.sin(now * 0.0014 + node.phase) * 0.12;
        const alpha = (0.24 + scene.spec.energy * 0.48 + logoStrength * 0.3) * pulse;
        ctx!.fillStyle = `rgba(${rgb},${alpha * 0.07})`;
        ctx!.beginPath();
        ctx!.arc(point.x, point.y, Math.max(3, point.size * 4), 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${rgb},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(point.x, point.y, Math.max(0.9, point.size), 0, Math.PI * 2);
        ctx!.fill();
        if (scene.spec.trust && index % 4 === 0) {
          ctx!.strokeStyle = `rgba(${rgb},0.24)`;
          ctx!.lineWidth = 0.7;
          ctx!.beginPath();
          ctx!.arc(point.x, point.y, 5 + point.depth * 3, 0, Math.PI * 2);
          ctx!.stroke();
        }
      });

      if (scene.spec.broadcast && projected[0].visible) {
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = 18 + ((now * 0.018 + ring * 32) % 96);
          ctx!.strokeStyle = `rgba(${rgb},${(1 - radius / 120) * 0.13})`;
          ctx!.lineWidth = 0.8;
          ctx!.beginPath();
          ctx!.arc(projected[0].x, projected[0].y, radius, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      drawLogo(logoStrength);
      if (rgb !== ambientRgb && now - lastAmbient > 250) {
        root!.style.setProperty("--signal-rgb", rgb.replaceAll(",", " "));
        ambientRgb = rgb;
        lastAmbient = now;
      }
    }

    function loop(now: number) {
      frame = 0;
      if (document.hidden) return;
      const interval = now < hiResUntil ? 1000 / 24 : 1000 / 15;
      if (now - lastFrame >= interval) {
        drawFrame(now);
        lastFrame = now;
      }
      frame = requestAnimationFrame(loop);
    }

    let lastMeasuredAt = 0;
    function onScroll() {
      scroll = window.scrollY;
      hiResUntil = performance.now() + 1200;
      // content-visibility:auto estimates off-screen chapter sizes, so
      // re-measure positions periodically while scrolling.
      const now = performance.now();
      if (now - lastMeasuredAt > 600) {
        lastMeasuredAt = now;
        measureSections();
      }
      if (reducedMotion) drawFrame(performance.now());
    }

    function onPointerMove(event: PointerEvent) {
      pointerX = (event.clientX / width - 0.5) * 2;
      pointerY = (event.clientY / height - 0.5) * 2;
      hiResUntil = performance.now() + 400;
    }

    function onVisibility() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden && !reducedMotion) frame = requestAnimationFrame(loop);
    }

    function onTheme() {
      palette = Object.fromEntries(
        Object.keys(FALLBACKS).map((token) => [token, readRgb(token)])
      ) as Record<string, RGB>;
      drawFrame(performance.now());
    }

    const resizeObserver = new ResizeObserver(resize);
    const journeyObserver = new ResizeObserver(measureSections);
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("home-scene-active", entry.isIntersecting);
        });
      },
      { rootMargin: "120px 0px" }
    );
    resizeObserver.observe(canvas);
    journeyObserver.observe(journey);
    journey
      .querySelectorAll(".home-relay, .home-offgrid")
      .forEach((section) => sceneObserver.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("antidosis-theme", onTheme);
    document.addEventListener("visibilitychange", onVisibility);
    if (!coarse && !reducedMotion)
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    measureSections();
    resize();
    if (reducedMotion) drawFrame(startedAt);
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      journeyObserver.disconnect();
      sceneObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("antidosis-theme", onTheme);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={rootRef} className="signal-field" aria-hidden>
      <div className="signal-field-ambient" />
      <canvas ref={canvasRef} className="signal-field-canvas" />
      <div className="signal-field-vignette" />
    </div>
  );
}
