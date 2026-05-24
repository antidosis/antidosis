"use client";

import {
  Mail,
  User,
  Smartphone,
  ShieldCheck,
  Award,
  Crown,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ─── 6-segment circular tracker ───
 * Each step is a 60° slice of a donut.
 * Clicking an incomplete slice navigates to the relevant section.
 * Centre shows progress → verified shield when all done.
 */

const STEPS = [
  {
    id: "email",
    label: "Email",
    description: "Verify your email address",
    color: "#35c2f0",
    bg: "rgba(53,194,240,0.12)",
    icon: Mail,
    href: "/verify-email",
    anchor: null,
  },
  {
    id: "profile",
    label: "Profile",
    description: "Add name, bio, avatar, location",
    color: "#f5a623",
    bg: "rgba(245,166,35,0.12)",
    icon: User,
    href: null,
    anchor: "profile-section",
  },
  {
    id: "mobile",
    label: "Mobile",
    description: "Add and verify your mobile",
    color: "#00e676",
    bg: "rgba(0,230,118,0.12)",
    icon: Smartphone,
    href: "/verify-mobile",
    anchor: null,
  },
  {
    id: "credentials",
    label: "ID Upload",
    description: "Upload a government-issued ID",
    color: "#d76bf5",
    bg: "rgba(215,107,245,0.12)",
    icon: Award,
    href: null,
    anchor: "credentials-section",
  },
  {
    id: "verified",
    label: "Approved",
    description: "Admin reviews your ID (24h)",
    color: "#00e676",
    bg: "rgba(0,230,118,0.12)",
    icon: ShieldCheck,
    href: null,
    anchor: null,
  },
  {
    id: "pro",
    label: "Pro",
    description: "Claim your free Pro status",
    color: "#f0cc33",
    bg: "rgba(240,204,51,0.12)",
    icon: Crown,
    href: "/pro",
    anchor: null,
  },
] as const;

/* SVG geometry */
const CX = 100;
const CY = 100;
const R_OUT = 90;
const R_IN = 58;
const GAP = 4; // degrees between slices
const SLICE = 360 / STEPS.length - GAP; // ~56°

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number) {
  const p1 = polar(CX, CY, R_OUT, startDeg);
  const p2 = polar(CX, CY, R_OUT, endDeg);
  const p3 = polar(CX, CY, R_IN, endDeg);
  const p4 = polar(CX, CY, R_IN, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${R_OUT} ${R_OUT} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${R_IN} ${R_IN} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

interface ProfileChecklistProps {
  profile: {
    fullName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    locationName: string | null;
    mobile: string | null;
    mobileVerified: boolean;
    isVerified: boolean;
    isPro: boolean;
    credentials?: { isVerified: boolean; type?: string }[];
  };
  emailVerified: boolean;
  onNavigateToCredentials?: () => void;
}

export function ProfileChecklist({
  profile,
  emailVerified,
  onNavigateToCredentials,
}: ProfileChecklistProps) {
  const hasIdentification = profile.credentials?.some((c) => c.type === "identification") ?? false;
  const profileComplete = !!(
    profile.fullName &&
    profile.bio &&
    profile.avatarUrl &&
    profile.locationName
  );

  const doneMap: Record<string, boolean> = {
    email: emailVerified,
    profile: profileComplete,
    mobile: profile.mobileVerified,
    credentials: hasIdentification,
    verified: profile.isVerified,
    pro: profile.isPro,
  };

  const completed = STEPS.filter((s) => doneMap[s.id]).length;
  const allDone = completed === STEPS.length;

  function handleSliceClick(step: (typeof STEPS)[number]) {
    if (doneMap[step.id]) return;
    if (step.href) {
      window.location.href = step.href;
    } else if (step.id === "credentials" && onNavigateToCredentials) {
      onNavigateToCredentials();
    } else if (step.anchor) {
      const el = document.getElementById(step.anchor);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div
      className={`flex items-center gap-6 sm:gap-8 mb-6 ${allDone ? "justify-center" : "flex-col sm:flex-row"}`}
    >
      {/* ─── Circular Tracker ─── */}
      <div
        className="relative shrink-0"
        style={{ width: allDone ? 120 : 220, height: allDone ? 120 : 220 }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ transform: "rotate(-30deg)" }}
        >
          {/* Background track */}
          {STEPS.map((_, i) => {
            const start = i * (360 / STEPS.length);
            const end = start + SLICE;
            return (
              <path
                key={`track-${i}`}
                d={arcPath(start, end)}
                fill="#1a1714"
                stroke="#2a2420"
                strokeWidth="1"
              />
            );
          })}

          {/* Coloured slices */}
          {STEPS.map((step, i) => {
            const start = i * (360 / STEPS.length);
            const end = start + SLICE;
            const isDone = doneMap[step.id];
            return (
              <path
                key={step.id}
                d={arcPath(start, end)}
                fill={isDone ? step.bg : "transparent"}
                stroke={isDone ? step.color : "transparent"}
                strokeWidth="2"
                className={isDone ? "" : "cursor-pointer hover:opacity-80 transition-opacity"}
                onClick={() => handleSliceClick(step)}
              />
            );
          })}
        </svg>

        {/* ─── Centre badge ─── */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: "rotate(0deg)" }}
        >
          <div className="flex flex-col items-center justify-center">
            {allDone ? (
              <>
                <div className="h-12 w-12 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center mb-1">
                  <CheckCircle2 className="h-6 w-6 text-[#00e676]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#00e676] font-medium">
                  verified
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-[#e8d5a3]">{completed}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#7a6b5a]">
                  of {STEPS.length}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ─── Icon markers on each slice (hidden when complete) ─── */}
        {!allDone &&
          STEPS.map((step, i) => {
            const angle = i * (360 / STEPS.length) + SLICE / 2 - 30; // undo SVG rotation
            const pos = polar(CX, CY, 74, angle);
            const isDone = doneMap[step.id];
            const Icon = step.icon;
            return (
              <div
                key={`icon-${step.id}`}
                className={`absolute flex items-center justify-center h-7 w-7 rounded-full border transition-colors ${
                  isDone
                    ? "border-transparent"
                    : "border-[#2a2420] bg-[#12100e] cursor-pointer hover:border-[#3d3530]"
                }`}
                style={{
                  left: `${(pos.x / 200) * 100}%`,
                  top: `${(pos.y / 200) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: isDone ? step.bg : undefined,
                  color: isDone ? step.color : "#7a6b5a",
                }}
                onClick={() => handleSliceClick(step)}
                title={step.label}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            );
          })}
      </div>

      {/* ─── Step list (hidden when complete) ─── */}
      {!allDone && (
        <div className="flex-1 min-w-0 w-full">
          <p className="text-xs text-[#7a6b5a] uppercase tracking-wider mb-3">profile setup</p>
          <div className="space-y-2">
            {STEPS.map((step) => {
              const isDone = doneMap[step.id];
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded border transition-colors ${
                    isDone
                      ? "border-transparent opacity-50"
                      : "border-[#2a2420] hover:border-[#3d3530] cursor-pointer"
                  }`}
                  style={isDone ? { backgroundColor: step.bg } : undefined}
                  onClick={() => handleSliceClick(step)}
                >
                  <div
                    className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
                    style={{
                      backgroundColor: isDone ? `${step.color}15` : "#1a1714",
                      color: isDone ? step.color : "#7a6b5a",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${isDone ? "text-[#7a6b5a] line-through" : "text-[#e8d5a3]"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-[#7a6b5a]">{step.description}</p>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-[#00e676] shrink-0" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-[#7a6b5a] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
