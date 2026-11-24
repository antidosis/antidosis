"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Every exchange begins as a signal.",
  "A need. A skill. Something to offer.",
  "One local connection changes the pattern.",
  "Antidosis — the exchange network.",
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const completeRef = useRef(onComplete);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const leavingRef = useRef(false);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const compact = window.matchMedia("(pointer: coarse)").matches;
    const timings = compact ? [0, 230, 460, 690] : [0, 360, 760, 1160];
    const leaveAt = compact ? 940 : 1620;
    const completeAt = compact ? 1240 : 2020;

    function finish() {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);
      timersRef.current.push(setTimeout(() => completeRef.current(), compact ? 260 : 400));
    }

    timersRef.current = MESSAGES.map((_, index) =>
      setTimeout(() => setStep(index), timings[index])
    );
    timersRef.current.push(setTimeout(finish, leaveAt));
    if (!compact) timersRef.current.push(setTimeout(finish, completeAt));

    function onKeyDown(event: KeyboardEvent) {
      if (["Enter", "Escape", " "].includes(event.key)) finish();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      timersRef.current.forEach(clearTimeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-40 flex min-h-dvh cursor-pointer flex-col bg-void/15 p-6 text-center transition-opacity duration-400 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="button"
      tabIndex={0}
      aria-label="Enter the Antidosis network"
      onClick={() => {
        if (!leavingRef.current) {
          leavingRef.current = true;
          setLeaving(true);
          timersRef.current.push(setTimeout(() => completeRef.current(), 300));
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
        <span>Central Coast / Node 01</span>
        <span>First contact</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="h-[28vh] min-h-32" aria-hidden />
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ok">
          Local exchange protocol
        </p>
        <div className="mt-5 flex min-h-16 max-w-lg items-center justify-center">
          {MESSAGES.map((message, index) => (
            <p
              key={message}
              className={`absolute text-balance text-lg leading-relaxed transition-all duration-500 md:text-xl ${
                step === index
                  ? "translate-y-0 text-parchment opacity-100"
                  : "translate-y-2 text-parchment opacity-0"
              } ${index === MESSAGES.length - 1 ? "heading-display text-2xl text-gold md:text-3xl" : ""}`}
              aria-hidden={step !== index}
            >
              {message}
            </p>
          ))}
        </div>
        <div className="mt-8 flex gap-2" aria-hidden>
          {MESSAGES.map((_, index) => (
            <span
              key={index}
              className={`h-px w-8 transition-colors duration-500 ${index <= step ? "bg-ok" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
        <span className="text-parchment">Click or press Enter to step inside</span>
        <span>A network is only waiting for its next node.</span>
      </div>
    </div>
  );
}
