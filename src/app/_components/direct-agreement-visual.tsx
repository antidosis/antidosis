"use client";

import { useEffect, useRef, useState } from "react";

import { Check, FileText, LockKeyhole, Mail, PenLine, ShieldCheck, Star } from "lucide-react";

import { cn } from "@/lib/utils";

const PHASES = [
  { id: "invite", label: "Invite", icon: Mail, duration: 3600 },
  { id: "agree", label: "Agree", icon: FileText, duration: 4200 },
  { id: "sign", label: "Sign", icon: PenLine, duration: 4200 },
  { id: "review", label: "Review", icon: Star, duration: 4200 },
] as const;

/**
 * The direct-agreement lifecycle, told on one parchment: the contract itself
 * morphs through invite → agree → sign → review while the rail below tracks
 * the phase. Mirrors the real flow — invitation, both parties accepting the
 * terms, signatures, completion and bilateral reviews.
 */
export function DirectAgreementVisual() {
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0); // restarts the progress bar per phase
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current) return;
    const timer = setTimeout(() => {
      setPhase((current) => (current + 1) % PHASES.length);
      setCycle((c) => c + 1);
    }, PHASES[phase].duration);
    return () => clearTimeout(timer);
  }, [phase, cycle]);

  function jumpTo(index: number) {
    setPhase(index);
    setCycle((c) => c + 1);
  }

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface/50 p-5 shadow-[0_32px_100px_-58px_rgb(var(--c-sun)/0.35)] sm:p-6">
      <style>{`
        @keyframes da-phase-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes da-progress { from { width: 0%; } to { width: 100%; } }
        @keyframes da-tick-in { 0%, 55% { opacity: 0; transform: scale(0.6); } 70%, 100% { opacity: 1; transform: scale(1); } }
        @keyframes da-sign-in { 0%, 45% { opacity: 0; } 65%, 100% { opacity: 1; } }
        @keyframes da-star-in { 0%, 40% { opacity: 0.25; } 55%, 100% { opacity: 1; } }
      `}</style>

      <div className="flex items-center justify-between border-b border-line/70 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
          Direct agreement
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-ok/25 bg-ok/5 px-2.5 py-1 text-[11px] text-ok">
          <LockKeyhole className="h-3 w-3" /> Private
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <PartyNode letter="A" label="You" active={phase >= 0} />
        <svg className="h-10 w-10 text-linehi sm:w-14" viewBox="0 0 56 40" fill="none" aria-hidden>
          <path
            d="M2 20H54"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 4"
            className={phase >= 1 ? "text-ok/70" : undefined}
          />
          <circle
            cx="28"
            cy="20"
            r="4"
            fill={phase >= 1 ? "rgb(var(--c-ok))" : "rgb(var(--c-sun))"}
          />
        </svg>
        <PartyNode letter="B" label="Invitee" active={phase >= 1} />
      </div>

      {/* The parchment — contract stays light in every theme, and morphs per phase */}
      <div className="relative mx-auto -mt-1 min-h-[15.5rem] max-w-sm rounded-lg border border-paperline bg-paper p-5 text-paperink shadow-xl sm:min-h-[16.5rem]">
        <div className="flex items-start justify-between gap-4 border-b border-paperline pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-paperlabel">
              Agreement reference
            </p>
            <p className="mt-1 font-serif text-lg font-semibold text-paperhead">
              Website for local café
            </p>
          </div>
          <FileText className="h-5 w-5 shrink-0 text-paperlabel" />
        </div>

        <div key={phase} className="animate-[da-phase-in_0.45s_ease-out]" aria-live="polite">
          {phase === 0 && <InvitePhase />}
          {phase === 1 && <AgreePhase />}
          {phase === 2 && <SignPhase />}
          {phase === 3 && <ReviewPhase />}
        </div>
      </div>

      {/* Phase rail — click to jump; the bar tracks the auto-advance */}
      <div className="mt-6 border-t border-line/70 pt-4">
        <div className="grid grid-cols-4 gap-1 text-center">
          {PHASES.map((step, index) => {
            const Icon = step.icon;
            const done = index < phase;
            const active = index === phase;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => jumpTo(index)}
                aria-pressed={active}
                aria-label={`Show phase ${index + 1}: ${step.label}`}
                className="group relative rounded-md pb-1 pt-0.5"
              >
                <span
                  className={cn(
                    "mx-auto flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] transition-colors",
                    done && "border-ok/40 bg-ok/10 text-ok",
                    active && "border-sun/50 bg-sun/10 text-sun",
                    !done && !active && "border-line bg-inset text-ash group-hover:text-parchment"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </span>
                <p
                  className={cn(
                    "mt-1.5 text-[11px] transition-colors sm:text-xs",
                    active ? "font-medium text-gold" : "text-ash"
                  )}
                >
                  {step.label}
                </p>
                <span className="mx-auto mt-1 block h-0.5 w-10 overflow-hidden rounded bg-line/60">
                  {active && (
                    <span
                      key={cycle}
                      className="block h-full bg-sun"
                      style={{ animation: `da-progress ${step.duration}ms linear forwards` }}
                    />
                  )}
                  {done && <span className="block h-full w-full bg-ok/60" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvitePhase() {
  return (
    <div className="mt-4">
      <div className="rounded-md border border-dashed border-paperline bg-paperhead/[0.03] p-3.5">
        <p className="flex items-center gap-2 text-[13px] font-medium text-paperhead">
          <Mail className="h-3.5 w-3.5" /> Invitation sent — one secure link
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-paperlabel">
          Party B opens the link to read the full agreement. Nothing is binding until both sides
          accept.
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-paperlabel">
        <span className="font-mono">ref DA-7F3K-9Q2X</span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-sundim opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-sundim" />
          </span>
          awaiting Party B
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Signature name="Party A" state="Drafted" />
        <Signature name="Party B" state="Not opened" />
      </div>
    </div>
  );
}

function AgreePhase() {
  return (
    <div className="mt-4">
      <p className="text-[10px] uppercase tracking-wide text-paperlabel">
        Terms — both parties contribute
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <TermColumn
          party="Party A offers"
          lines={["$600 on completion", "Hosting for 12 months"]}
          delay="0.4s"
        />
        <TermColumn
          party="Party B delivers"
          lines={["5-page site, mobile-ready", "Two revision rounds"]}
          delay="1.6s"
        />
      </div>
      <p className="mt-3.5 text-center text-[11px] text-paperlabel">
        Both sides accept the same terms before anyone signs.
      </p>
    </div>
  );
}

function TermColumn({ party, lines, delay }: { party: string; lines: string[]; delay: string }) {
  return (
    <div className="rounded-md border border-paperline p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-paperlabel">{party}</p>
      <ul className="mt-1.5 space-y-1 text-[11px] leading-snug text-paperink">
        {lines.map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
      <p
        className="mt-2 flex items-center gap-1 text-[10px] font-medium text-ok"
        style={{ opacity: 0, animation: `da-tick-in 2.6s ease-out ${delay} forwards` }}
      >
        <Check className="h-3 w-3" /> Terms accepted
      </p>
    </div>
  );
}

function SignPhase() {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-paperlabel">Party A</p>
          <div className="mt-2 border-b border-paperline pb-1.5">
            <span className="font-serif text-base italic text-paperhead">M. Khoury</span>
          </div>
          <p className="mt-1 text-[10px] text-paperlabel">signed 14 Jun, 9:41 am</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-paperlabel">Party B</p>
          <div className="mt-2 border-b border-paperline pb-1.5">
            <span
              className="font-serif text-base italic text-paperhead"
              style={{ opacity: 0, animation: "da-sign-in 2.8s ease-out forwards" }}
            >
              J. Alvarez
            </span>
          </div>
          <p
            className="mt-1 text-[10px] text-paperlabel"
            style={{ opacity: 0, animation: "da-sign-in 2.8s ease-out 0.3s forwards" }}
          >
            signed 14 Jun, 2:07 pm
          </p>
        </div>
      </div>
      <p
        className="mt-4 flex items-center justify-center gap-1.5 rounded-md border border-ok/30 bg-ok/[0.06] px-3 py-2 text-[11px] font-medium text-ok"
        style={{ opacity: 0, animation: "da-sign-in 2.8s ease-out 1s forwards" }}
      >
        <ShieldCheck className="h-3.5 w-3.5" /> Signed by both parties — locked & timestamped
      </p>
    </div>
  );
}

function ReviewPhase() {
  return (
    <div className="mt-4">
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-ok">
        <Check className="h-3.5 w-3.5" /> Completed — both sides delivered
      </p>
      <div className="mt-3 space-y-2.5">
        <ReviewRow
          from="Party A on Party B"
          quote="Delivered on time, exactly as agreed"
          delay="0.2s"
        />
        <ReviewRow from="Party B on Party A" quote="Clear brief, paid promptly" delay="1s" />
      </div>
      <p className="mt-3 text-center text-[10px] text-paperlabel">
        Reviews publish both ways — reputation updates for each party.
      </p>
    </div>
  );
}

function ReviewRow({ from, quote, delay }: { from: string; quote: string; delay: string }) {
  return (
    <div className="rounded-md border border-paperline p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-paperlabel">{from}</p>
        <span className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((star) => (
            <Star
              key={star}
              className="h-3 w-3 fill-sundim text-sundim"
              style={{ opacity: 0.25, animation: `da-star-in 2.2s ease-out ${delay} forwards` }}
            />
          ))}
        </span>
      </div>
      <p className="mt-1 text-[11px] italic leading-snug text-paperink">“{quote}”</p>
    </div>
  );
}

function PartyNode({ letter, label, active }: { letter: string; label: string; active: boolean }) {
  return (
    <div className="relative z-10 text-center">
      <div
        className={cn(
          "relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border font-mono text-lg transition-colors duration-500",
          active
            ? "border-mercury/30 bg-inset text-mercury shadow-[0_0_30px_rgb(var(--c-mercury)/0.08)]"
            : "border-line bg-inset/60 text-ash"
        )}
      >
        {letter}
        <ShieldCheck
          className={cn(
            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-surface p-0.5 transition-colors duration-500",
            active ? "text-ok" : "text-linehi"
          )}
        />
      </div>
      <p className="mt-2 text-xs text-parchment">{label}</p>
    </div>
  );
}

function Signature({ name, state }: { name: string; state: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-paperlabel">{name}</p>
      <div className="mt-2 border-b border-paperline pb-1.5">
        <span className="text-[10px] text-paperlabel">{state}</span>
      </div>
    </div>
  );
}
