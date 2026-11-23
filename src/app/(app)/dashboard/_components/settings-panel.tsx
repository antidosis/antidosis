"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertTriangle, Building2, FolderTree, Loader2, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { DashboardTabId } from "./dashboard-nav";

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
  onNavigate: (tab: DashboardTabId) => void;
}

export function SettingsPanel({ profile, onNavigate }: SettingsPanelProps) {
  const router = useRouter();
  const supabase = createClient();
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
            : "missing — required for business accounts"
          : "not set",
    },
    { label: "Email", value: profile.email },
    { label: "Mobile", value: profile.mobileVerified ? "verified" : "unverified" },
    { label: "Identity", value: profile.isVerified ? "verified" : "unverified" },
    {
      label: "Directory",
      value: profile.showInDirectory ? "listed" : "hidden",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="vessel p-5">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
          account summary
        </p>
        <dl className="divide-y divide-line/60">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-ash">{row.label}</dt>
              <dd className="truncate text-parchment">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate("profile")}>
            <User className="mr-1.5 h-3.5 w-3.5" /> Edit profile
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate("profile")}>
            {profile.accountType === "business" ? (
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <FolderTree className="mr-1.5 h-3.5 w-3.5" />
            )}
            {profile.showInDirectory ? "Directory & preferences" : "Appear in the directory"}
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-ash">
          Account type, ABN, and directory visibility are edited from your profile preferences.
        </p>
      </section>

      <section className="vessel border-bad/25 p-5">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bad/80">
          danger zone
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm text-bad transition-colors hover:text-bad/80"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-bad" />
              <div>
                <p className="text-sm font-medium text-gold">Delete your account?</p>
                <p className="mt-1 text-xs text-ash">
                  Your profile is anonymised and your login is destroyed. Contracts, reviews, and
                  messages you were part of are kept for the other party but scrubbed of your
                  identity. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className={cn("bg-bad text-white hover:bg-bad/80")}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch("/api/v1/profiles/me", { method: "DELETE" });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {deleting ? "Deleting..." : "Permanently delete"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
