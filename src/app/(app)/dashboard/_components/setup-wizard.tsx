"use client";

import { useState } from "react";

import { CheckCircle2, ArrowRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { wizardKey, type DashboardTabId } from "./dashboard-nav";
import { ProfileChecklist } from "./profile-checklist";

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
  onNavigate: (tab: DashboardTabId) => void;
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
  const profileComplete = !!(
    profile.fullName &&
    profile.bio &&
    profile.avatarUrl &&
    profile.locationName
  );

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
      description: "Name, photo, bio, and suburb — people trade with people they can see.",
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
    <section className="relative border border-sun/25 bg-surface/40 p-5 md:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Donut tracker (compact anchor) */}
        <div className="mx-auto shrink-0 sm:mx-0">
          <ProfileChecklist
            profile={profile}
            emailVerified={emailVerified}
            compact
            onNavigateToCredentials={() => onNavigate("profile")}
          />
        </div>

        {/* Stepper */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sun">
                setup wizard
              </p>
              <h2 className="heading-display text-xl text-gold">Get network-ready</h2>
              <p className="mt-1 text-xs text-ash">
                {doneCount} of {total} core steps done
                {nextStep ? ` — next: ${nextStep.label.toLowerCase()}` : ""}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="rounded p-1.5 text-ash transition-colors hover:text-gold"
              aria-label="Dismiss setup wizard"
              title="I'll finish this later"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ol className="space-y-1.5">
            {steps.map((step) => (
              <li key={step.id}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded border px-3 py-2 transition-colors",
                    step.done
                      ? "border-transparent opacity-55"
                      : step.id === nextStep?.id
                        ? "border-sun/40 bg-sun/5"
                        : "border-line hover:border-linehi"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      step.done ? "border-ok/40 bg-ok/10 text-ok" : "border-line text-ash"
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="font-mono text-[10px]">{steps.indexOf(step) + 1}</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", step.done ? "text-ash line-through" : "text-gold")}>
                      {step.label}
                    </p>
                    <p className="truncate text-xs text-ash">{step.description}</p>
                  </div>
                  {!step.done && step.action && (
                    <button
                      onClick={() => {
                        if (step.href) window.location.href = step.href;
                        else if (step.tab) onNavigate(step.tab);
                      }}
                      className="flex shrink-0 items-center gap-1 rounded border border-line px-2 py-1 text-[11px] text-parchment transition-colors hover:border-sun/40 hover:text-sun"
                    >
                      {step.action}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-3 text-xs text-ash">
            Verified members get the badge — and the replies. You can reopen this wizard from the
            overview any time.
          </p>
        </div>
      </div>
    </section>
  );
}
