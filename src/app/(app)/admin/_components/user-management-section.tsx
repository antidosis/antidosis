"use client";

import { useEffect, useState } from "react";

import { Ban, Loader2, Search, Shield, ShieldAlert, Smartphone } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminUser = {
  id: string;
  fullName: string | null;
  email: string;
  locationName: string | null;
  mobileVerified: boolean;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
};

/**
 * User management: search users, review trust signals, and ban/unban.
 * Banning suspends exchange participation and permanently blocks the user's
 * mobile number from re-verifying on any account.
 */
export function UserManagementSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load(query: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/users?limit=50${query ? `&q=${encodeURIComponent(query)}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  async function setBan(id: string, ban: boolean) {
    setActioning(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}/ban`, {
        method: ban ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: ban ? JSON.stringify({ reason: banReason.trim() || undefined }) : undefined,
      });
      if (res.ok) {
        setBanningId(null);
        setBanReason("");
        await load(q);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Action failed");
      }
    } finally {
      setActioning(null);
    }
  }

  return (
    <section>
      <div className="divider mb-8" />
      <p className="text-xs text-ash mb-2">$ ls ~/users/ ({users.length})</p>
      <h2 className="text-lg heading-display text-gold mb-4">user management</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q.trim());
        }}
        className="flex gap-2 mb-6"
      >
        <div className="flex items-center gap-2 flex-1 bg-raise border border-line rounded px-3">
          <Search className="h-3.5 w-3.5 text-ash shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search by name or email..."
            className="w-full bg-transparent py-2 text-sm text-gold outline-none placeholder:text-ash"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "search"}
        </Button>
      </form>

      {error && <p className="text-xs text-bad mb-4">{error}</p>}

      {loading && users.length === 0 ? (
        <div className="py-8 text-center text-sm text-ash">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
          loading users...
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-ash">no users found.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const banned = !!u.bannedAt;
            return (
              <div key={u.id} className={`vessel p-4 ${banned ? "border-bad/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar src={null} name={u.fullName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gold">{u.fullName || "anonymous"}</p>
                      {u.isVerified && <Shield className="h-3.5 w-3.5 text-ok" />}
                      {u.mobileVerified && (
                        <span title="mobile verified">
                          <Smartphone className="h-3.5 w-3.5 text-mercury" />
                        </span>
                      )}
                      {banned && (
                        <Badge variant="outline" className="border-bad/40 text-bad">
                          banned
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ash truncate">{u.email}</p>
                    <p className="text-[10px] text-ash mt-1">
                      {u.locationName || "—"} · {u.jobsCompleted} jobs ·{" "}
                      {u.ratingCount > 0
                        ? `${u.ratingAvg.toFixed(1)} (${u.ratingCount})`
                        : "no reviews"}{" "}
                      · joined {new Date(u.createdAt).toLocaleDateString("en-AU")}
                    </p>
                    {banned && u.bannedReason && (
                      <p className="text-[10px] text-bad/80 mt-1">reason: {u.bannedReason}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBan(u.id, false)}
                        disabled={actioning === u.id}
                        className="text-ok border-ok/30 hover:bg-ok/5"
                      >
                        {actioning === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : null}
                        unban
                      </Button>
                    ) : banningId === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="reason (optional)"
                          className="bg-inset border border-line text-gold text-xs px-2 py-1.5 rounded w-36 outline-none focus:border-bad"
                        />
                        <Button
                          size="sm"
                          onClick={() => setBan(u.id, true)}
                          disabled={actioning === u.id}
                          className="bg-bad text-white hover:bg-bad/90"
                        >
                          {actioning === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "confirm"
                          )}
                        </Button>
                        <button
                          onClick={() => {
                            setBanningId(null);
                            setBanReason("");
                          }}
                          className="text-xs text-ash hover:text-gold"
                        >
                          cancel
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBanningId(u.id)}
                        className="text-bad border-bad/30 hover:bg-bad/5"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        ban
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-ash mt-4 flex items-center gap-1.5">
        <ShieldAlert className="h-3 w-3" />
        banning blocks participation and permanently blacklists the user&apos;s mobile number.
      </p>
    </section>
  );
}
