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

const GOLD = "245, 166, 35";
const CYAN = "0, 229, 255";
const TAU = Math.PI * 2;

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
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes: Node[] = [];
    let links: Array<[number, number]> = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let lastPulseAt = 0;
    let running = true;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      nodes = buildNodes(rect.width, rect.height);
      links = nearestLinks(nodes);
    }

    function drawFrame(now: number) {
      if (!ctx || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Links
      ctx.lineWidth = 1;
      for (const [a, b] of links) {
        ctx.strokeStyle = `rgba(${GOLD}, 0.08)`;
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }

      // Spawn pulses
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

      // Pulses (signals traveling node → node)
      pulses = pulses.filter((p) => p.t <= 1);
      for (const p of pulses) {
        p.t += p.speed;
        const x = nodes[p.from].x + (nodes[p.to].x - nodes[p.from].x) * p.t;
        const y = nodes[p.from].y + (nodes[p.to].y - nodes[p.from].y) * p.t;
        const fade = Math.sin(Math.min(p.t, 1) * Math.PI);
        ctx.fillStyle = `rgba(${CYAN}, ${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, TAU);
        ctx.fill();
        // Glow trail
        ctx.fillStyle = `rgba(${CYAN}, ${0.18 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, TAU);
        ctx.fill();
      }

      // Nodes — alternate gold/cyan like a signal map
      nodes.forEach((n, i) => {
        const colour = i % 3 === 0 ? CYAN : GOLD;
        ctx.fillStyle = `rgba(${colour}, 0.9)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `rgba(${colour}, 0.25)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, TAU);
        ctx.stroke();
        if (n.label) {
          ctx.fillStyle = "rgba(143, 127, 110, 0.55)";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + 16);
        }
      });
    }

    function loop(now: number) {
      if (!running) return;
      drawFrame(now);
      raf = requestAnimationFrame(loop);
    }

    resize();
    if (reduced) {
      drawFrame(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) drawFrame(0);
    });
    observer.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
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
