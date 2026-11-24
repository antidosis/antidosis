"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Building2,
  FolderTree,
  Loader2,
  Palette,
  Shield,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { DashboardTabId } from "./dashboard-nav";
import type { ProfileTab } from "./profile-editor/types";
import { ThemePicker } from "./theme-picker";

interface SettingsProfile {
  id: string;
  fullName: string | null;
  email: string;
  accountType: "individual" | "business";
  abn: string | null;
  abnVerified: boolean;
  showInDirectory: boolean;
  mobileVerified: boolean;
  isVerified: boolean;
}

interface SettingsPanelProps {
  profile: SettingsProfile;
  onNavigate: (tab: DashboardTabId, profileSection?: ProfileTab) => void;
}

export function SettingsPanel({ profile, onNavigate }: SettingsPanelProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [view, setView] = useState<"appearance" | "account">("appearance");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const rows = [
    { label: "Account type", value: profile.accountType },
    {
      label: "ABN",
      value:
        profile.accountType === "business"
          ? profile.abn
            ? `${profile.abn}${profile.abnVerified ? " (verified)" : " (unverified)"}`
            : "Missing — required for business accounts"
          : "Not set",
    },
    { label: "Email", value: profile.email },
    { label: "Mobile", value: profile.mobileVerified ? "Verified" : "Unverified" },
    { label: "Identity", value: profile.isVerified ? "Verified" : "Unverified" },
    { label: "Directory", value: profile.showInDirectory ? "Listed" : "Hidden" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div
        role="tablist"
        aria-label="Settings sections"
        className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface/35 p-2 sm:inline-flex"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "appearance"}
          onClick={() => setView("appearance")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm",
            view === "appearance"
              ? "border border-orchid/25 bg-orchid/[0.07] text-orchid"
              : "border border-transparent text-ash hover:text-gold"
          )}
        >
          <Palette className="h-4 w-4" /> Appearance
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "account"}
          onClick={() => setView("account")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm",
            view === "account"
              ? "border border-mercury/25 bg-mercury/[0.07] text-mercury"
              : "border border-transparent text-ash hover:text-gold"
          )}
        >
          <Shield className="h-4 w-4" /> Account & privacy
        </button>
      </div>

      {view === "appearance" ? (
        <section
          className="vessel rounded-xl border-orchid/20 bg-orchid/[0.02] p-4 sm:p-6"
          role="tabpanel"
        >
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orchid">
              Personal workspace
            </p>
            <h2 className="heading-display mt-1 text-xl text-gold">Theme & fonts</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash">
              Changes apply immediately across the website and installed app, then sync to your
              account for your other devices.
            </p>
          </div>
          <ThemePicker />
        </section>
      ) : (
        <div
          className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]"
          role="tabpanel"
        >
          <section className="vessel rounded-lg border-mercury/20 bg-mercury/[0.02] p-4 sm:p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mercury">
              Account summary
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="min-w-0 rounded-md border border-line/60 bg-surface/40 p-3"
                >
                  <dt className="text-xs text-ash">{row.label}</dt>
                  <dd className="mt-1 break-words text-sm capitalize text-parchment">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line/60 pt-4">
              <Button variant="secondary" size="sm" onClick={() => onNavigate("profile", "public")}>
                <User className="h-4 w-4" /> Edit public profile
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate("profile", "directory")}
              >
                {profile.accountType === "business" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <FolderTree className="h-4 w-4" />
                )}
                Directory preferences
              </Button>
            </div>
          </section>

          <section className="vessel rounded-lg border-bad/25 bg-bad/[0.02] p-4 sm:p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-bad">
              Data & account deletion
            </p>
            {!showDeleteConfirm ? (
              <>
                <p className="text-sm leading-relaxed text-ash">
                  Review and correct your information through Profile &amp; Presence. Permanent
                  deletion is available here when you need it.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete account
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-bad" />
                  <div>
                    <p className="text-sm font-medium text-gold">Delete your account?</p>
                    <p className="mt-2 text-sm leading-relaxed text-ash">
                      Your profile is anonymised and your login is destroyed. Contracts, reviews,
                      and messages remain for the other party but are scrubbed of your identity.
                      This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-bad text-white hover:bg-bad/80"
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        const response = await fetch("/api/v1/profiles/me", { method: "DELETE" });
                        if (!response.ok) {
                          const data = await response.json().catch(() => ({}));
                          alert(data.error || "Failed to delete account");
                          setDeleting(false);
                          return;
                        }
                        await supabase.auth.signOut();
                        router.push("/");
                      } catch {
                        alert("Failed to delete account");
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deleting ? "Deleting…" : "Permanently delete"}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
