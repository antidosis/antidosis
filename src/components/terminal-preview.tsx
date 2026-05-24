"use client";

import { useState, useEffect, useCallback } from "react";

const SCENES = [
  {
    command: "/help",
    response: [
      "Available commands:",
      "  /dm <name> <msg>  — send a direct message",
      "  /who               — list online users",
      "  /users <name>      — search members",
      "  /profile <name>    — view a profile",
      "  /clear             — clear the screen",
    ],
  },
  {
    command: "/who",
    response: [
      "14 users online now",
      "  @sarah     • gardening, baking",
      "  @mike      • carpentry, tutoring",
      "  @jessica   • web design, yoga",
      "  @david     • plumbing, driving",
    ],
  },
  {
    command: "/dm @sarah Need a hand with your garden this weekend?",
    response: ["Message sent to Sarah"],
  },
  {
    command: "/users carpenter",
    response: [
      "Found 3 users:",
      "  1. Mike — carpentry, tutoring",
      "  2. Tom  — carpentry, electrical",
      "  3. Lisa — carpentry, painting",
    ],
  },
];

const TYPING_SPEED = 35; // ms per char
const RESPONSE_DELAY = 400; // ms after command before response shows
const HOLD_DURATION = 2500; // ms to hold before clearing
const CLEAR_DURATION = 300; // ms for clear animation

export function TerminalPreview({ className = "" }: { className?: string }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [clearing, setClearing] = useState(false);

  const scene = SCENES[sceneIndex];
  const displayedCommand = scene.command.slice(0, typedChars);

  const nextScene = useCallback(() => {
    setClearing(true);
    setTimeout(() => {
      setSceneIndex((i) => (i + 1) % SCENES.length);
      setTypedChars(0);
      setShowResponse(false);
      setClearing(false);
    }, CLEAR_DURATION);
  }, []);

  useEffect(() => {
    if (clearing) return;

    if (typedChars < scene.command.length) {
      const timer = setTimeout(() => setTypedChars((c) => c + 1), TYPING_SPEED);
      return () => clearTimeout(timer);
    }

    if (!showResponse) {
      const timer = setTimeout(() => setShowResponse(true), RESPONSE_DELAY);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(nextScene, HOLD_DURATION);
    return () => clearTimeout(timer);
  }, [typedChars, showResponse, clearing, scene, nextScene]);

  return (
    <div
      className={`relative rounded-lg border border-[#2a2420] bg-[#0a0806] overflow-hidden shadow-[0_0_40px_rgba(245,166,35,0.08)] ${className}`}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2a2420] bg-[#12100e]">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5252]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5a623]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#00e676]/60" />
        </div>
        <span className="ml-2 text-[10px] text-[#7a6b5a] font-mono tracking-wide">
          antidosis-terminal — community
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-4 font-mono text-xs min-h-[200px] md:min-h-[220px]">
        <div className="transition-opacity duration-300" style={{ opacity: clearing ? 0 : 1 }}>
          {/* Command line */}
          <div className="flex items-start gap-2 mb-2">
            <span className="text-[#f5a623] shrink-0">$</span>
            <span className="text-[#e8d5a3]">
              {displayedCommand}
              {typedChars < scene.command.length && (
                <span className="inline-block w-2 h-4 bg-[#f5a623]/60 ml-0.5 animate-pulse align-text-bottom" />
              )}
            </span>
          </div>

          {/* Response lines */}
          {showResponse && (
            <div className="space-y-0.5 ml-4">
              {scene.response.map((line, i) => (
                <p
                  key={i}
                  className="text-[#b8a078] leading-relaxed"
                  style={{
                    animation: `terminal-fade-in 0.2s ease ${i * 60}ms both`,
                  }}
                >
                  {line.includes("@") ? (
                    <>
                      {line.split("@").map((part, idx) =>
                        idx === 0 ? (
                          <span key={idx}>{part}</span>
                        ) : (
                          <span key={idx}>
                            <span className="text-[#00e5ff]">@{part.split(" ")[0]}</span>
                            {" " + part.split(" ").slice(1).join(" ")}
                          </span>
                        )
                      )}
                    </>
                  ) : (
                    line
                  )}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtle scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }}
      />
    </div>
  );
}
