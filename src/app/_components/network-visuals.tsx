"use client";

import { useEffect, useRef, useState } from "react";

import { BadgeCheck, Instagram, Mail, Music2, Sparkles, Youtube } from "lucide-react";

import { BUSINESS_CARD_TEXTURES } from "@/lib/business-card";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Business side — the real listing card, cycling textures + trades   */
/* ------------------------------------------------------------------ */

const SHOWCASE_BUSINESSES = [
  {
    textureId: "circuit",
    name: "Heka Web",
    trades: ["Web developer", "App developer"],
    meta: "Noraville NSW · ★ 5.0 · 12 reviews",
    accepts: "Cash · Services · IOU",
  },
  {
    textureId: "carbon",
    name: "Coastline Plumbing",
    trades: ["Plumber", "Gas fitting"],
    meta: "Terrigal NSW · ★ 4.9 · 31 reviews",
    accepts: "Cash · Bank transfer",
  },
  {
    textureId: "titanium",
    name: "Bayside Electrical",
    trades: ["Electrician", "Solar installs"],
    meta: "Woy Woy NSW · ★ 5.0 · 18 reviews",
    accepts: "Cash · Bank transfer · Goods",
  },
  {
    textureId: "topo",
    name: "Terra Landscapes",
    trades: ["Gardener", "Lawn care"],
    meta: "Umina NSW · ★ 4.8 · 9 reviews",
    accepts: "Cash · Work exchange",
  },
  {
    textureId: "aurora",
    name: "Saltwater Studio",
    trades: ["Photographer", "Videographer"],
    meta: "Avoca NSW · ★ 5.0 · 22 reviews",
    accepts: "Cash · Promo / review",
  },
] as const;

export function BusinessCardShowcase() {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setTimeout(
      () => setIndex((current) => (current + 1) % SHOWCASE_BUSINESSES.length),
      3400
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index]);

  const business = SHOWCASE_BUSINESSES[index];
  const texture =
    BUSINESS_CARD_TEXTURES.find((t) => t.id === business.textureId) ?? BUSINESS_CARD_TEXTURES[0];

  return (
    <div>
      <div
        className="relative aspect-[8/5] w-full overflow-hidden rounded-xl border transition-colors duration-700"
        style={{
          backgroundColor: texture.base,
          backgroundImage: texture.cssBackground,
          borderColor: `${texture.accent}40`,
        }}
      >
        <div
          key={index}
          className="absolute inset-0 flex flex-col p-4 animate-[net-fade_0.6s_ease-out] sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 truncate text-lg font-semibold tracking-wide sm:text-xl"
                style={{ color: texture.ink }}
              >
                {business.name}
                <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: texture.accent }} />
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {business.trades.map((trade) => (
                  <span
                    key={trade}
                    className="rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px]"
                    style={{ borderColor: `${texture.accent}66`, color: texture.accentSoft }}
                  >
                    {trade}
                  </span>
                ))}
              </div>
            </div>
            <span
              className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em]"
              style={{ color: `${texture.accent}b3` }}
            >
              Antidosis
              <br />
              directory
            </span>
          </div>
          <div className="mt-auto">
            <p className="text-[11px] sm:text-xs" style={{ color: texture.sub }}>
              {business.meta}
            </p>
            <p
              className="mt-1 text-[11px] font-medium sm:text-xs"
              style={{ color: texture.accent }}
            >
              Accepts {business.accepts}
            </p>
          </div>
        </div>
      </div>

      {/* Texture selector — same materials members pick in the dashboard */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {SHOWCASE_BUSINESSES.map((option, optionIndex) => {
          const optionTexture = BUSINESS_CARD_TEXTURES.find((t) => t.id === option.textureId);
          return (
            <button
              key={option.textureId}
              type="button"
              onClick={() => setIndex(optionIndex)}
              aria-label={`Show ${option.name} on ${optionTexture?.label ?? option.textureId}`}
              aria-pressed={optionIndex === index}
              className={cn(
                "h-4 w-4 rounded-full border transition-transform",
                optionIndex === index ? "scale-125 border-gold" : "border-line hover:scale-110"
              )}
              style={{
                backgroundColor: optionTexture?.base,
                backgroundImage: optionTexture?.cssBackground,
              }}
            />
          );
        })}
        <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wider text-ash">
          {BUSINESS_CARD_TEXTURES.find((t) => t.id === business.textureId)?.label}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Creator side — profile assembles: socials link in, reach counts    */
/*  up, then a local business scouts them with an exchange offer.      */
/* ------------------------------------------------------------------ */

const SOCIALS = [
  { icon: Instagram, handle: "@saltandsurf", platform: "Instagram", delay: 0 },
  { icon: Music2, handle: "@saltandsurf", platform: "TikTok", delay: 900 },
  { icon: Youtube, handle: "Salt & Surf", platform: "YouTube", delay: 1800 },
] as const;

const REACH_TARGET = 18200;
const STAGE_MS = [2400, 2600, 3400] as const; // socials → reach → offer → hold

export function CreatorReachShowcase() {
  const [stage, setStage] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [reach, setReach] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static end-state for reduced motion — set once on mount via timeout to
      // avoid a synchronous setState cascade in the effect body.
      const settle = setTimeout(() => {
        setStage(2);
        setReach(REACH_TARGET);
      }, 0);
      return () => clearTimeout(settle);
    }
    const timer = setTimeout(
      () => {
        if (stage >= STAGE_MS.length) {
          setStage(0);
          setReach(0);
          setCycle((c) => c + 1);
        } else {
          setStage((current) => current + 1);
        }
      },
      stage < STAGE_MS.length ? STAGE_MS[stage] : 2200
    );
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 1) return;
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1800);
      const eased = 1 - Math.pow(1 - progress, 3);
      setReach(Math.round(REACH_TARGET * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-line/70 bg-void/50 p-4 sm:p-5">
      <style>{`@keyframes net-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes net-slide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      {/* Profile header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-orchid/40 bg-orchid/10 font-mono text-sm text-orchid">
          SS
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[15px] font-medium text-gold">
            Salt &amp; Surf
            <BadgeCheck className="h-4 w-4 text-mercury" />
          </p>
          <p className="text-[11px] text-ash">Food &amp; lifestyle creator · Central Coast</p>
        </div>
        <span className="ml-auto text-right">
          <span className="block font-mono text-lg font-semibold tabular-nums text-orchid">
            {reach >= 1000 ? `${(reach / 1000).toFixed(1)}k` : reach}
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-ash">
            combined reach
          </span>
        </span>
      </div>

      {/* Socials link themselves in, one by one — key replays the build each loop */}
      <div className="mt-4 space-y-1.5" key={cycle}>
        {SOCIALS.map((social) => (
          <div
            key={social.platform}
            className="flex items-center gap-2.5 rounded-md border border-line/60 bg-inset/50 px-3 py-2"
            style={{
              opacity: 0,
              animation:
                stage >= 0 ? `net-slide 0.5s ease-out ${social.delay}ms forwards` : undefined,
            }}
          >
            <social.icon className="h-3.5 w-3.5 text-orchid" />
            <span className="text-xs text-parchment">{social.handle}</span>
            <span className="text-[10px] text-ash">{social.platform}</span>
            <BadgeCheck className="ml-auto h-3.5 w-3.5 text-ok" />
          </div>
        ))}
      </div>

      {/* A local business scouts the creator */}
      <div
        className="mt-4 rounded-lg border border-sun/30 bg-sun/[0.05] p-3 transition-all duration-500"
        style={{
          opacity: stage >= 2 ? 1 : 0,
          transform: stage >= 2 ? "translateY(0)" : "translateY(12px)",
        }}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-sun">
          <Sparkles className="h-3.5 w-3.5" /> Scouted by Saltwater Café — matches your food niche
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] leading-snug">
          <p className="rounded border border-line/60 bg-inset/60 p-2 text-parchment">
            <span className="block text-[9px] uppercase tracking-wide text-ash">They want</span>
            Honest menu review, posted + tagged
          </p>
          <p className="rounded border border-line/60 bg-inset/60 p-2 text-parchment">
            <span className="block text-[9px] uppercase tracking-wide text-ash">They offer</span>
            $120 + dinner for two
          </p>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-ash">
          <Mail className="h-3 w-3" /> Terms agreed and disclosed through a direct agreement
        </p>
      </div>
    </div>
  );
}
