"use client";

import { useEffect, useRef } from "react";

type MeshNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  depth: number;
};

type Pulse = {
  a: number;
  b: number;
  t: number;
  speed: number;
};

function tokenRGB(name: string, fallback: string): [number, number, number] {
  if (typeof window === "undefined") return [0, 0, 0];
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n)))
    return parts as [number, number, number];
  const m = fallback.match(/\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
}

/**
 * A living mesh: nodes drift on three depth planes, links form between
 * neighbours, and message pulses travel the links. Canvas 2D, DPR-aware,
 * paused offscreen and stilled under prefers-reduced-motion.
 */
export function MeshVisual({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const canvas: HTMLCanvasElement = cv;
    const c = canvas.getContext("2d");
    if (!c) return;
    const ctx: CanvasRenderingContext2D = c;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let nodes: MeshNode[] = [];
    let pulses: Pulse[] = [];
    let sun: [number, number, number] = [30, 210, 130];
    let mercury: [number, number, number] = [42, 212, 200];

    function seed() {
      const count = width < 640 ? 16 : 26;
      nodes = Array.from({ length: count }, (_, i) => {
        const depth = i % 3 === 0 ? 0.45 : i % 3 === 1 ? 0.72 : 1;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16 * depth,
          vy: (Math.random() - 0.5) * 0.12 * depth,
          r: (1.6 + Math.random() * 2.2) * depth,
          depth,
        };
      });
      pulses = [];
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw();
    }

    function linkAlpha(d: number, max: number) {
      return Math.max(0, 1 - d / max);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const maxLink = Math.min(width, height) * 0.38;

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > maxLink) continue;
          const alpha = linkAlpha(d, maxLink) * 0.28 * Math.min(a.depth, b.depth);
          ctx.strokeStyle = `rgba(${mercury[0]}, ${mercury[1]}, ${mercury[2]}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // nodes
      for (const n of nodes) {
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        glow.addColorStop(0, `rgba(${sun[0]}, ${sun[1]}, ${sun[2]}, ${0.22 * n.depth})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${sun[0]}, ${sun[1]}, ${sun[2]}, ${0.35 + 0.5 * n.depth})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // pulses
      for (const p of pulses) {
        const a = nodes[p.a];
        const b = nodes[p.b];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx.fillStyle = `rgba(${sun[0]}, ${sun[1]}, ${sun[2]}, 0.95)`;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${sun[0]}, ${sun[1]}, ${sun[2]}, 0.25)`;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      if (!running) return;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;
      }

      // spawn a pulse along a random in-range link every few frames
      if (Math.random() < 0.05 && pulses.length < 5) {
        const i = Math.floor(Math.random() * nodes.length);
        const candidates: number[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (j === i) continue;
          if (
            Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) <
            Math.min(width, height) * 0.38
          ) {
            candidates.push(j);
          }
        }
        if (candidates.length > 0) {
          pulses.push({
            a: i,
            b: candidates[Math.floor(Math.random() * candidates.length)],
            t: 0,
            speed: 0.012 + Math.random() * 0.012,
          });
        }
      }
      pulses = pulses.filter((p) => (p.t += p.speed) <= 1);

      draw();
      raf = requestAnimationFrame(step);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function refreshTokens() {
      sun = tokenRGB("--c-sun", "30 210 130");
      mercury = tokenRGB("--c-mercury", "42 212 200");
    }

    refreshTokens();
    resize();

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // theme changes (toggle or system) repaint the palette
    const themeWatcher = window.setInterval(refreshTokens, 2000);

    return () => {
      stop();
      observer.disconnect();
      ro.disconnect();
      window.clearInterval(themeWatcher);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
