"use client";

import { useState, useEffect } from "react";
import { TerminalCursor } from "./terminal-cursor";
import { ShieldCheck, Lock, Users } from "lucide-react";

const BOOT_LINES = [
  { text: "initializing antidosis marketplace...", delay: 200 },
  { text: "", delay: 350 },
  { text: "[OK] verifying network integrity", delay: 500 },
  { text: "[OK] loading trust protocol v2.1", delay: 650 },
  { text: "[OK] establishing secure exchange channels", delay: 800 },
  { text: "[OK] connecting to trial region node", delay: 950 },
  { text: "", delay: 1100 },
  { text: "ready.", delay: 1300 },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: "verified identities" },
  { icon: Lock, label: "binding contracts" },
  { icon: Users, label: "peer-to-peer exchange" },
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [signalsVisible, setSignalsVisible] = useState(false);

  useEffect(() => {
    // Logo fade in immediately
    const logoTimer = setTimeout(() => setLogoVisible(true), 200);

    // Trust signals fade in after logo
    const signalsTimer = setTimeout(() => setSignalsVisible(true), 600);

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => {
            setShowCursor(false);
            setTimeout(() => {
              setDone(true);
              setTimeout(onComplete, 500);
            }, 400);
          }, 700);
        }
      }, line.delay);
      timeouts.push(t);
    });

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(signalsTimer);
      timeouts.forEach(clearTimeout);
    };
  }, [onComplete]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0806] flex flex-col items-center justify-center p-6">
      {/* Logo + Brand */}
      <div
        className={`flex flex-col items-center transition-all duration-700 ${
          logoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <img
          src="/images/logo.png"
          alt="Antidosis"
          width={120}
          height={48}
          className="h-12 w-auto opacity-80 mb-4"
        />
        <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3] tracking-tight">
          antidosis
        </h1>
        <p className="text-xs text-[#7a6b5a] mt-2 tracking-widest uppercase">
          exchange anything, build trust.
        </p>
      </div>

      {/* Trust Signals */}
      <div
        className={`flex items-center gap-6 mt-8 mb-10 transition-all duration-700 delay-200 ${
          signalsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {TRUST_SIGNALS.map((signal, i) => (
          <div key={i} className="flex items-center gap-2">
            <signal.icon className="h-3.5 w-3.5 text-[#f5a623]" />
            <span className="text-[10px] md:text-xs text-[#7a6b5a] uppercase tracking-wider">
              {signal.label}
            </span>
          </div>
        ))}
      </div>

      {/* Terminal Boot Lines */}
      <div
        className={`w-full max-w-md transition-opacity duration-500 ${
          visibleLines > 0 ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="border border-[#2a2420] bg-[#12100e] p-4 md:p-5">
          <div className="text-[11px] md:text-[13px] leading-relaxed font-mono">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                className={`${
                  line.text.startsWith("[OK]")
                    ? "text-[#00e676]"
                    : line.text === "ready."
                    ? "text-[#f5a623] font-semibold"
                    : "text-[#7a6b5a]"
                }`}
              >
                {line.text || "\u00A0"}
              </div>
            ))}
            {showCursor && visibleLines > 0 && (
              <div className="text-[#f5a623]">
                <TerminalCursor />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <p
        className={`text-[10px] text-[#7a6b5a]/50 mt-6 transition-opacity duration-1000 ${
          logoVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        initializing secure exchange environment
      </p>
    </div>
  );
}
