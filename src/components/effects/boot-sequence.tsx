"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";

import { ArrowRight, Check } from "lucide-react";

const STAGES = [
  { label: "Local interface", detail: "Establishing your space", progress: 12 },
  { label: "Exchange protocol", detail: "Needs meet offers", progress: 32 },
  { label: "Trust fabric", detail: "Identity and reputation", progress: 54 },
  { label: "Community relay", detail: "Opening local channels", progress: 76 },
  { label: "Network handshake", detail: "Every node strengthens the next", progress: 92 },
  { label: "You are on the air", detail: "Welcome to Antidosis", progress: 100 },
];

const STAGE_TIMINGS = [0, 720, 1500, 2350, 3250, 4150];
const NODE_POSITIONS = [
  [50, 4],
  [82, 17],
  [96, 50],
  [82, 83],
  [50, 96],
  [18, 83],
  [4, 50],
  [18, 17],
];

export function BootSequence({
  onExitStart,
  onComplete,
}: {
  onExitStart: () => void;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const completeRef = useRef(onComplete);
  const exitStartRef = useRef(onExitStart);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const leavingRef = useRef(false);

  useEffect(() => {
    completeRef.current = onComplete;
    exitStartRef.current = onExitStart;
  }, [onComplete, onExitStart]);

  const finish = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    exitStartRef.current();
    setLeaving(true);
    timersRef.current.push(setTimeout(() => completeRef.current(), 620));
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    timersRef.current = STAGE_TIMINGS.map((timing, index) =>
      setTimeout(() => setStage(index), timing)
    );
    timersRef.current.push(setTimeout(finish, 4950));

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      timersRef.current.forEach(clearTimeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finish]);

  return (
    <div
      className={`boot-sequence ${leaving ? "boot-sequence-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Antidosis network startup"
      data-boot-stage={stage}
    >
      <div className="boot-atmosphere" aria-hidden />
      <div className="boot-scan" aria-hidden />

      <header className="boot-header">
        <div className="flex items-center gap-3">
          <span className="boot-status-dot" aria-hidden />
          <span>Antidosis</span>
          <span className="hidden text-ash sm:inline">/ reciprocal exchange network</span>
        </div>
        <span className="text-ash">First contact · 001</span>
      </header>

      <div className="boot-layout">
        <div className="boot-intro">
          <p className="boot-kicker">A network built on reciprocity</p>
          <h1 className="heading-display text-balance text-3xl leading-[1.08] text-gold sm:text-4xl lg:text-5xl">
            Not just connected.
            <br />
            <span className="text-ok">Looking out for each other.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ash sm:text-base">
            A need sends a signal. A skill answers it. Every exchange makes the local network
            stronger.
          </p>
          <div className="boot-coordinate" aria-hidden>
            <span>33.4268° S</span>
            <span>151.3417° E</span>
            <span>Central Coast</span>
          </div>
        </div>

        <div className="boot-core" aria-hidden>
          <div className="boot-orbit boot-orbit-outer" />
          <div className="boot-orbit boot-orbit-middle" />
          <div className="boot-orbit boot-orbit-inner" />
          <svg className="boot-connections" viewBox="0 0 400 400" fill="none">
            <path d="M200 16 328 68 384 200 328 332 200 384 72 332 16 200 72 68Z" />
            <path d="M200 16 328 332 16 200 328 68 200 384 72 68 384 200 72 332Z" />
            <circle cx="200" cy="200" r="126" />
          </svg>
          {NODE_POSITIONS.map(([left, top], index) => (
            <span
              key={`${left}-${top}`}
              className="boot-node"
              style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 110}ms` }}
            />
          ))}
          <div className="boot-emblem">
            <div className="boot-emblem-scan" />
            <Image src="/images/logo-symbol.png" alt="" width={156} height={68} priority />
          </div>
          <span className="boot-core-label">Exchange / respond / return</span>
        </div>
      </div>

      <div className="boot-console">
        <div className="boot-console-heading">
          <div>
            <span className="boot-status-dot" aria-hidden />
            <span aria-live="polite">{STAGES[stage].detail}</span>
          </div>
          <span className="boot-progress-number">
            {String(STAGES[stage].progress).padStart(3, "0")}%
          </span>
        </div>
        <div className="boot-progress-track" aria-hidden>
          <span style={{ transform: `scaleX(${STAGES[stage].progress / 100})` }} />
        </div>
        <ol className="boot-stages">
          {STAGES.slice(0, -1).map((item, index) => (
            <li
              key={item.label}
              className={
                index < stage ? "boot-stage-complete" : index === stage ? "boot-stage-active" : ""
              }
            >
              <span className="boot-stage-icon">
                {index < stage || stage === STAGES.length - 1 ? (
                  <Check />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <footer className="boot-footer">
        <p>Online today. Building towards an off-grid tomorrow.</p>
        <button type="button" onClick={finish}>
          {stage === STAGES.length - 1 ? "Enter the network" : "Skip intro"}
          <ArrowRight aria-hidden />
        </button>
      </footer>
    </div>
  );
}
