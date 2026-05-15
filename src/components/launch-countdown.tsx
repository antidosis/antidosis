"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Clock } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
//  CONFIGURE YOUR REGIONAL LAUNCH DATE HERE
//  Format: YYYY-MM-DDTHH:mm:ss
//  The countdown automatically adjusts to the user's timezone.
// ═══════════════════════════════════════════════════════════════
const REGIONAL_LAUNCH_DATE = new Date("2026-10-31T23:59:59+10:00");

export function getLaunchDate() {
  return REGIONAL_LAUNCH_DATE;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const difference = +target - +new Date();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// ═══════════════════════════════════════════════════════════════
//  FULL HOMEPAGE COUNTDOWN SECTION
// ═══════════════════════════════════════════════════════════════
export function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(REGIONAL_LAUNCH_DATE)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(REGIONAL_LAUNCH_DATE));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasLaunched = timeLeft.total <= 0;

  return (
    <section
      className="relative w-full overflow-hidden border-y border-[#f5a623]/15"
      style={{
        background:
          "linear-gradient(180deg, #0f0c0a 0%, #0a0806 50%, #0f0c0a 100%)",
        boxShadow:
          "inset 0 0 60px rgba(245,166,35,0.03), 0 0 30px rgba(245,166,35,0.04)",
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f5a623]/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20">
        {/* Terminal prompt */}
        <p className="text-xs text-[#7a6b5a] mb-8 font-mono">
          $ ./regional_launch --countdown
        </p>

        {/* Header */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5a623] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f5a623]" />
            </span>
            <span className="text-xs font-medium tracking-widest text-[#f5a623] uppercase">
              Trial in progress
            </span>
          </div>

          <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-4">
            The Trial Ends.
            <br />
            <span className="text-[#f5a623] glow-gold-subtle">Regional Begins.</span>
          </h2>

          <p className="text-sm md:text-base text-[#7a6b5a] max-w-lg leading-relaxed">
            The Central Coast is just the beginning. On{" "}
            <span className="text-[#e8d5a3]">
              {REGIONAL_LAUNCH_DATE.toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            , Antidosis unlocks for Wollongong, Newcastle, and the Gold Coast.
            Verify now and keep Pro for life — no matter how far we expand.
          </p>
        </div>

        {/* Countdown grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-14 max-w-2xl">
          <CountdownBox
            value={mounted ? pad(timeLeft.days) : "--"}
            label="Days"
            accent="#f5a623"
          />
          <CountdownBox
            value={mounted ? pad(timeLeft.hours) : "--"}
            label="Hours"
            accent="#00e5ff"
          />
          <CountdownBox
            value={mounted ? pad(timeLeft.minutes) : "--"}
            label="Minutes"
            accent="#b24bf5"
          />
          <CountdownBox
            value={mounted ? pad(timeLeft.seconds) : "--"}
            label="Seconds"
            accent="#00e676"
          />
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-3">
          {hasLaunched ? (
            <Button asChild size="lg">
              <Link href="/register">
                <MapPin className="mr-2 h-4 w-4" />
                Join Your Region
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/pro">
                <Clock className="mr-2 h-4 w-4" />
                Lock In Free Pro
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary" size="lg">
            <Link href="/blog/regional-expansion-plan">
              Read the Plan <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-[#7a6b5a]/60">
          Central Coast members verified before launch receive Pro at no cost,
          permanently. No credit card required.
        </p>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f5a623]/20 to-transparent" />
    </section>
  );
}

function CountdownBox({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div
      className="relative vessel-lit p-4 md:p-5 text-center group"
      style={{ borderTop: `1px solid ${accent}25` }}
    >
      <div
        className="text-3xl md:text-5xl font-mono font-bold tracking-tight mb-1"
        style={{ color: accent, textShadow: `0 0 20px ${accent}30` }}
      >
        {value}
      </div>
      <div className="text-[10px] md:text-xs text-[#7a6b5a] uppercase tracking-widest">
        {label}
      </div>
      {/* Subtle accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${accent}08`,
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  THIN GLOBAL BANNER (appears below navbar on all pages)
// ═══════════════════════════════════════════════════════════════
export function LaunchBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(REGIONAL_LAUNCH_DATE)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(REGIONAL_LAUNCH_DATE));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasLaunched = timeLeft.total <= 0;

  if (hasLaunched) {
    return (
      <div className="w-full bg-[#00e676]/10 border-b border-[#00e676]/20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
            </span>
            <span className="text-xs text-[#00e676] font-medium">
              Antidosis is now regional — Wollongong, Newcastle & Gold Coast are live.
            </span>
          </div>
          <Link
            href="/register"
            className="text-xs text-[#00e676] hover:text-[#e8d5a3] transition-colors font-medium underline underline-offset-2 shrink-0"
          >
            Join your region →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full border-b border-[#f5a623]/15 relative overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #0f0c0a 0%, #12100e 50%, #0f0c0a 100%)",
      }}
    >
      {/* Subtle animated shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f5a623]/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5a623] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5a623]" />
          </span>

          {/* Message */}
          <span className="text-xs text-[#7a6b5a] truncate hidden sm:inline">
            Central Coast trial active.
          </span>

          {/* Countdown */}
          <span className="text-xs font-mono text-[#f5a623] shrink-0">
            {mounted ? (
              <>
                {pad(timeLeft.days)}d:{pad(timeLeft.hours)}h:
                {pad(timeLeft.minutes)}m:{pad(timeLeft.seconds)}s
              </>
            ) : (
              "--d:--h:--m:--s"
            )}
          </span>

          <span className="text-xs text-[#7a6b5a] truncate hidden md:inline">
            until regional launch.
          </span>
        </div>

        {/* CTA */}
        <Link
          href="/pro"
          className="text-xs text-[#f5a623] hover:text-[#e8d5a3] transition-colors font-medium underline underline-offset-2 shrink-0"
        >
          Lock in free Pro →
        </Link>
      </div>
    </div>
  );
}
