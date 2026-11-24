"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

function token(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? value.split(/\s+/).join(", ") : fallback;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const mobile = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -1000, y: -1000 };
    let particles: Particle[] = [];
    let width = 1;
    let height = 1;
    let raf = 0;
    let visible = true;
    let lastFrame = 0;
    let pointColour = token("--c-gold", "232, 213, 163");
    let linkColour = token("--c-mercury", "0, 229, 255");

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor((width * height) / 16000), mobile ? 18 : 64);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.3 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
      }));
      if (reducedMotion) drawFrame(0);
    }

    function drawFrame(now: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);
      const connectDistance = mobile ? 0 : 110;

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (!reducedMotion) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < 130) {
            const force = ((130 - distance) / 130) * 0.035;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.995;
          particle.vy *= 0.995;
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pointColour}, ${particle.opacity * 0.42})`;
        ctx.fill();

        for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
          const other = particles[otherIndex];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance >= connectDistance) continue;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(${linkColour}, ${(1 - distance / connectDistance) * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      if (!reducedMotion && visible && now - lastFrame >= 32) lastFrame = now;
    }

    function loop(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - lastFrame >= 32) {
        drawFrame(now);
        lastFrame = now;
      }
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (!reducedMotion && visible && !document.hidden && !raf) raf = requestAnimationFrame(loop);
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    const resizeObserver = new ResizeObserver(resize);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else start();
    };
    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    const onTheme = () => {
      pointColour = token("--c-gold", "232, 213, 163");
      linkColour = token("--c-mercury", "0, 229, 255");
      if (reducedMotion) drawFrame(0);
    };

    intersection.observe(canvas);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("antidosis-theme", onTheme);
    if (!mobile) {
      canvas.parentElement?.addEventListener("mousemove", onMouseMove);
      canvas.parentElement?.addEventListener("mouseleave", onMouseLeave);
    }
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("antidosis-theme", onTheme);
      canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
