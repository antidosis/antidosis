"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; label?: string };
type Pulse = { from: number; to: number; t: number; speed: number };

const LABELS = [
  "GOSFORD",
  "WOY WOY",
  "TERRIGAL",
  "WYONG",
  "ERINA",
  "AVOCA",
  "UMINA",
  "KINCUMBER",
  "WAMBERAL",
  "COBACABANA",
  "THE ENTRANCE",
  "TOUKLEY",
];

const TAU = Math.PI * 2;

// Canvas colors follow the active site theme — the --c-* tokens are RGB
// triplets in globals.css, re-read whenever the theme flips.
function readToken(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? v.split(/\s+/).join(", ") : fallback;
}

function buildNodes(width: number, height: number): Node[] {
  // Deterministic scatter (golden-angle spiral) so SSR/first paint is stable
  const nodes: Node[] = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399963 + 0.6;
    const radius = 0.12 + 0.36 * Math.sqrt((i + 0.5) / count);
    const x = width / 2 + Math.cos(angle) * radius * width;
    const y = height / 2 + Math.sin(angle) * radius * height * 0.85;
    nodes.push({ x, y, label: LABELS[i % LABELS.length] });
  }
  return nodes;
}

function nearestLinks(nodes: Node[]): Array<[number, number]> {
  const links: Array<[number, number]> = [];
  nodes.forEach((_, i) => {
    const dists = nodes
      .map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d);
    for (const { j } of dists.slice(0, 2)) {
      const exists = links.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
      if (!exists) links.push([i, j]);
    }
  });
  return links;
}

export function NetworkMap({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const staticCanvas = document.createElement("canvas");
    const staticCtx = staticCanvas.getContext("2d");
    if (!ctx || !staticCtx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes: Node[] = [];
    let links: Array<[number, number]> = [];
    let pulses: Pulse[] = [];
    let width = 1;
    let height = 1;
    let raf = 0;
    let lastFrameAt = 0;
    let lastPulseAt = 0;
    let running = true;
    let inView = true;

    let GOLD = readToken("--c-sun", "245, 166, 35");
    let CYAN = readToken("--c-mercury", "0, 229, 255");
    let LABEL = readToken("--c-ash", "143, 127, 110");

    function refreshColors() {
      GOLD = readToken("--c-sun", "245, 166, 35");
      CYAN = readToken("--c-mercury", "0, 229, 255");
      LABEL = readToken("--c-ash", "143, 127, 110");
      renderStatic();
      if (reduced) drawFrame(0);
    }
    window.addEventListener("antidosis-theme", refreshColors);

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      staticCanvas.width = canvas.width;
      staticCanvas.height = canvas.height;
      nodes = buildNodes(width, height);
      links = nearestLinks(nodes);
      renderStatic();
      if (reduced) drawFrame(0);
    }

    function renderStatic() {
      if (!staticCtx) return;
      staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      staticCtx.clearRect(0, 0, width, height);
      staticCtx.lineWidth = 1;
      for (const [a, b] of links) {
        staticCtx.strokeStyle = `rgba(${GOLD}, 0.08)`;
        staticCtx.beginPath();
        staticCtx.moveTo(nodes[a].x, nodes[a].y);
        staticCtx.lineTo(nodes[b].x, nodes[b].y);
        staticCtx.stroke();
      }

      nodes.forEach((n, i) => {
        const colour = i % 3 === 0 ? CYAN : GOLD;
        staticCtx.fillStyle = `rgba(${colour}, 0.9)`;
        staticCtx.beginPath();
        staticCtx.arc(n.x, n.y, 2.6, 0, TAU);
        staticCtx.fill();
        staticCtx.strokeStyle = `rgba(${colour}, 0.25)`;
        staticCtx.beginPath();
        staticCtx.arc(n.x, n.y, 6, 0, TAU);
        staticCtx.stroke();
        if (n.label) {
          staticCtx.fillStyle = `rgba(${LABEL}, 0.55)`;
          staticCtx.font = "8px monospace";
          staticCtx.textAlign = "center";
          staticCtx.fillText(n.label, n.x, n.y + 16);
        }
      });
    }

    function drawFrame(now: number, frameScale = 1) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(
        staticCanvas,
        0,
        0,
        staticCanvas.width,
        staticCanvas.height,
        0,
        0,
        width,
        height
      );

      if (!reduced && now - lastPulseAt > 900 && links.length > 0) {
        lastPulseAt = now;
        const [a, b] = links[Math.floor(Math.random() * links.length)];
        pulses.push({
          from: a,
          to: b,
          t: 0,
          speed: 0.004 + Math.random() * 0.004,
        });
        if (pulses.length > 6) pulses = pulses.slice(-6);
      }

      pulses = pulses.filter((p) => p.t <= 1);
      for (const p of pulses) {
        p.t += p.speed * frameScale;
        const x = nodes[p.from].x + (nodes[p.to].x - nodes[p.from].x) * p.t;
        const y = nodes[p.from].y + (nodes[p.to].y - nodes[p.from].y) * p.t;
        const fade = Math.sin(Math.min(p.t, 1) * Math.PI);
        ctx.fillStyle = `rgba(${CYAN}, ${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(${CYAN}, ${0.18 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, TAU);
        ctx.fill();
      }
    }

    function loop(now: number) {
      raf = 0;
      if (!running || !inView || document.hidden) return;
      if (now - lastFrameAt >= 1000 / 30) {
        const frameScale = lastFrameAt ? Math.min(now - lastFrameAt, 100) / (1000 / 60) : 1;
        drawFrame(now, frameScale);
        lastFrameAt = now;
      }
      raf = requestAnimationFrame(loop);
    }

    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !reduced && !raf) raf = requestAnimationFrame(loop);
      if (!inView) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastFrameAt = 0;
      }
    });
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastFrameAt = 0;
      } else if (inView && !reduced && !raf) {
        raf = requestAnimationFrame(loop);
      }
    };
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    if (!reduced) raf = requestAnimationFrame(loop);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("antidosis-theme", refreshColors);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Map of the Antidosis exchange network — suburb nodes passing signals to each other"
    />
  );
}
