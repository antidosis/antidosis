"use client";

import { useState } from "react";

import { CheckCircle2, ArrowRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { wizardKey, type DashboardTabId } from "./dashboard-nav";
import type { ProfileTab } from "./profile-editor/types";

interface WizardProfile {
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  locationName: string | null;
  mobile: string | null;
  mobileVerified: boolean;
  isVerified: boolean;
  showInDirectory: boolean;
  credentials?: { isVerified: boolean; type?: string }[];
}

interface SetupWizardProps {
  profileId: string;
  profile: WizardProfile;
  emailVerified: boolean;
  onNavigate: (tab: DashboardTabId, profileSection?: ProfileTab) => void;
}

interface WizardStep {
  id: string;
  label: string;
  description: string;
  action: string;
}

export function computeWizardSteps(
  profile: WizardProfile,
  emailVerified: boolean
): {
  steps: (WizardStep & { done: boolean; href: string | null; tab: DashboardTabId | null })[];
  doneCount: number;
  total: number;
} {
  const hasIdentification = profile.credentials?.some((c) => c.type === "identification") ?? false;
  const missingProfileFields = [
    !profile.fullName && "name",
    !profile.avatarUrl && "photo",
    !profile.bio && "bio",
    !profile.locationName && "suburb",
  ].filter(Boolean) as string[];
  const profileComplete = missingProfileFields.length === 0;

  const steps = [
    {
      id: "email",
      label: "Verify your email",
      description: "Required before posting or messaging.",
      done: emailVerified,
      href: "/verify-email",
      tab: null,
      action: "Verify email",
    },
    {
      id: "profile",
      label: "Complete your profile",
      description: profileComplete
        ? "Name, photo, bio, and suburb — people trade with people they can see."
        : `Still missing: ${missingProfileFields.join(", ")}.`,
      done: profileComplete,
      href: null,
      tab: "profile" as DashboardTabId,
      action: "Edit profile",
    },
    {
      id: "mobile",
      label: "Verify your mobile",
      description: "One SMS code. Unlocks posting, interest, and messaging.",
      done: profile.mobileVerified,
      href: "/verify-mobile",
      tab: null,
      action: "Verify mobile",
    },
    {
      id: "credentials",
      label: "Upload ID",
      description: "A government-issued document. Unlocks the verified badge.",
      done: hasIdentification,
      href: null,
      tab: "profile" as DashboardTabId,
      action: "Upload ID",
    },
    {
      id: "verified",
      label: "Get approved",
      description: "An admin reviews your ID — usually within 24 hours.",
      done: profile.isVerified,
      href: null,
      tab: null,
      action: "",
    },
    {
      id: "directory",
      label: "Appear in the directory",
      description: "Optional — let locals find you by name, skill, or suburb.",
      done: profile.showInDirectory,
      href: null,
      tab: "profile" as DashboardTabId,
      action: "Directory settings",
    },
  ];

  // Core onboarding = the five trust steps; directory is a bonus sixth.
  const core = steps.slice(0, 5);
  return {
    steps,
    doneCount: core.filter((s) => s.done).length,
    total: core.length,
  };
}

/**
 * First-run setup wizard. Shows while core trust steps are incomplete and the
 * member has not dismissed it; state persists per profile in localStorage.
 */
export function SetupWizard({ profileId, profile, emailVerified, onNavigate }: SetupWizardProps) {
  const { steps, doneCount, total } = computeWizardSteps(profile, emailVerified);
  const complete = doneCount === total;

  const [dismissed, setDismissed] = useState<boolean>(() =>
    typeof window === "undefined" ? false : localStorage.getItem(wizardKey(profileId)) === "1"
  );

  function dismiss() {
    localStorage.setItem(wizardKey(profileId), "1");
    setDismissed(true);
  }

  if (dismissed || complete) return null;

  const nextStep = steps.find((s) => !s.done);

  return (
    <section className="relative rounded-xl border border-sun/25 bg-sun/[0.025] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sun">Setup guide</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="heading-display text-xl text-gold">Get network-ready</h2>
            <p className="text-xs text-ash">
              {doneCount}/{total} core steps
              {nextStep ? ` · Next: ${nextStep.label.toLowerCase()}` : ""}
            </p>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-line/60" aria-hidden>
            <div
              className="h-full rounded-full bg-sun transition-[width]"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={dismiss}
          className="rounded p-2 text-ash transition-colors hover:text-gold"
          aria-label="Dismiss setup wizard"
          title="Finish this later"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.id}>
            <div
              className={cn(
                "flex h-full min-h-28 flex-col rounded-lg border p-3 transition-colors",
                step.done
                  ? "border-ok/15 bg-ok/[0.025] opacity-65"
                  : step.id === nextStep?.id
                    ? "border-sun/40 bg-sun/[0.055]"
                    : "border-line bg-surface/40 hover:border-linehi"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    step.done ? "border-ok/40 bg-ok/10 text-ok" : "border-line text-ash"
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="font-mono text-[10px]">{index + 1}</span>
                  )}
                </span>
                <p className={cn("text-sm leading-tight", step.done ? "text-ash" : "text-gold")}>
                  {step.label}
                </p>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-ash sm:text-xs">
                {step.description}
              </p>
              {!step.done && step.action && (
                <button
                  onClick={() => {
                    if (step.href) window.location.href = step.href;
                    else if (step.tab) {
                      onNavigate(
                        step.tab,
                        step.id === "profile"
                          ? "public"
                          : step.id === "credentials"
                            ? "trust"
                            : "directory"
                      );
                    }
                  }}
                  className="mt-auto inline-flex min-h-8 items-center gap-1 self-start pt-2 text-[11px] font-medium text-parchment transition-colors hover:text-sun"
                >
                  {step.action}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
