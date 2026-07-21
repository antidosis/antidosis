"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { DEMO_SARAH, DEMO_MARCUS, STEPS } from "./mock-data";

interface GuideBarProps {
  stepIdx: number;
  canGoBack: boolean;
  canGoForward: boolean;
  actionTaken: boolean;
  onBack: () => void;
  onForward: () => void;
  onReset: () => void;
}

export function GuideBar({
  stepIdx,
  canGoBack,
  canGoForward,
  actionTaken,
  onBack,
  onForward,
  onReset,
}: GuideBarProps) {
  const step = STEPS[stepIdx];
  const persona = step.persona;
  const user = persona === "sarah" ? DEMO_SARAH : DEMO_MARCUS;

  return (
    <div className="sticky top-[53px] z-40 bg-[#0a0806]/95 backdrop-blur border-b border-[#2a2420]">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
        {/* Top row: persona + instruction */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          {/* Persona badge */}
          <div
            className="flex items-center gap-2.5 shrink-0 px-3 py-2 rounded border"
            style={{
              borderColor: `${user.color}40`,
              backgroundColor: `${user.color}10`,
            }}
          >
            <Avatar name={user.name} size="sm" />
            <div>
              <p className="text-xs font-medium" style={{ color: user.color }}>
                You are {user.name}
              </p>
              <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider">
                {persona === "sarah" ? "Poster" : "Fulfiller"}
              </p>
            </div>
          </div>

          {/* Instruction */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e8d5a3]">
              Step {stepIdx + 1} of {STEPS.length}: {step.label}
            </p>
            <p className="text-xs text-[#b8a078] mt-0.5">{step.instruction}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={onBack}
              disabled={!canGoBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIdx
                      ? "w-4 bg-[#f5a623]"
                      : i < stepIdx
                        ? "w-1.5 bg-[#00e676]"
                        : "w-1.5 bg-[#2a2420]"
                  }`}
                />
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onForward}
              disabled={!canGoForward || !actionTaken}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="h-8 w-8 p-0 text-[#7a6b5a]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
