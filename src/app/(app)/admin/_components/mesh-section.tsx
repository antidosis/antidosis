"use client";

import { useCallback, useEffect, useState } from "react";

import { CheckCircle2, Loader2, Mail, Package, RadioTower, Wrench, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { MeshOrdersQueue } from "./mesh-orders-section";

type AdminMeshBuilder = {
  id: string;
  businessName: string;
  suburb: string | null;
  website: string | null;
  description: string;
  status: string;
  reviewNote: string | null;
  extraSlots: number;
  createdAt: string;
  profile: {
    id: string;
    fullName: string | null;
    handle: string | null;
    email: string;
    mobileVerified: boolean;
    isVerified: boolean;
  };
  products: { id: string; name: string; category: string; stockStatus: string }[];
};

type AdminMeshInterest = {
  id: string;
  kind: string;
  email: string;
  name: string | null;
  suburb: string | null;
  deviceModel: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  profile: { id: string; fullName: string | null; handle: string | null } | null;
};

const KIND_LABEL: Record<string, string> = {
  node: "wants a node",
  byo_device: "has a device",
  updates: "updates only",
};

const INTEREST_TONE: Record<string, string> = {
  new: "border-sun/40 bg-sun/[0.05]",
  contacted: "border-mercury/40 bg-mercury/[0.05]",
  closed: "border-ok/30 bg-ok/[0.04]",
};

const BUILDER_TONE: Record<string, string> = {
  pending: "border-sun/40 bg-sun/[0.05]",
  approved: "border-ok/30 bg-ok/[0.04]",
  rejected: "border-bad/30 bg-bad/[0.04]",
  suspended: "border-bad/30 bg-bad/[0.04]",
};

/** Mesh store operations: builder review queue + buyer interest list. */
export function MeshSection() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"builders" | "interest" | "orders">("builders");
  const [builders, setBuilders] = useState<AdminMeshBuilder[]>([]);
  const [interests, setInterests] = useState<AdminMeshInterest[]>([]);
  const [builderFilter, setBuilderFilter] = useState("pending");
  const [interestFilter, setInterestFilter] = useState("new");
  const [loading, setLoading] = useState(true);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [slotsFor, setSlotsFor] = useState<string | null>(null);
  const [slotsValue, setSlotsValue] = useState("0");

  const loadBuilders = useCallback(
    async (status: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/admin/store/builders?status=${status}`);
        if (!res.ok) throw new Error("Builders could not be loaded");
        const data = await res.json();
        setBuilders(data.builders ?? []);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Builders could not be loaded", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const loadInterests = useCallback(
    async (status: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/admin/store/interest?status=${status}`);
        if (!res.ok) throw new Error("Interest list could not be loaded");
        const data = await res.json();
        setInterests(data.interests ?? []);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Interest list could not be loaded", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch triggered by tab/filter/mount; setState lives inside the async loaders
    if (tab === "builders") void loadBuilders(builderFilter);
    else void loadInterests(interestFilter);
  }, [tab, builderFilter, interestFilter, loadBuilders, loadInterests]);

  async function review(builder: AdminMeshBuilder, status: string, reviewNote?: string) {
    setActing(true);
    try {
      const res = await fetch(`/api/v1/admin/store/builders/${builder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Review failed");
      toast(`${builder.businessName} ${status}`, "success");
      setNoteFor(null);
      setNote("");
      await loadBuilders(builderFilter);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Review failed", "error");
    } finally {
      setActing(false);
    }
  }

  async function setInterestStatus(interest: AdminMeshInterest, status: string) {
    try {
      const res = await fetch(`/api/v1/admin/store/interest/${interest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      await loadInterests(interestFilter);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Status update failed", "error");
    }
  }

  async function grantSlots(builder: AdminMeshBuilder, value: number) {
    setActing(true);
    try {
      const res = await fetch(`/api/v1/admin/store/builders/${builder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraSlots: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Slot update failed");
      toast(`${builder.businessName}: ${value} extra slot${value === 1 ? "" : "s"}`, "success");
      setSlotsFor(null);
      await loadBuilders(builderFilter);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Slot update failed", "error");
    } finally {
      setActing(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Mesh store queue">
          {(
            [
              { id: "builders", label: "Builder queue", icon: Wrench },
              { id: "interest", label: "Buyer interest", icon: Mail },
              { id: "orders", label: "Orders", icon: Package },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={tab === option.id}
              onClick={() => setTab(option.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs",
                tab === option.id
                  ? "bg-sun/10 text-sun"
                  : "text-ash hover:bg-surface hover:text-parchment"
              )}
            >
              <option.icon className="h-3.5 w-3.5" /> {option.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab !== "orders" &&
            (tab === "builders"
              ? ["pending", "approved", "rejected", "suspended", "all"]
              : ["new", "contacted", "closed", "all"]
            ).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  tab === "builders" ? setBuilderFilter(option) : setInterestFilter(option)
                }
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs",
                  (tab === "builders" ? builderFilter : interestFilter) === option
                    ? "bg-sun/10 text-sun"
                    : "text-ash hover:bg-surface hover:text-parchment"
                )}
              >
                {option}
              </button>
            ))}
        </div>
      </div>

      {tab === "orders" ? (
        <MeshOrdersQueue />
      ) : loading ? (
        <div className="py-8 text-center text-sm text-ash">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          loading…
        </div>
      ) : tab === "builders" ? (
        builders.length === 0 ? (
          <p className="py-8 text-center text-sm text-ash">No builders in this view.</p>
        ) : (
          <ul className="space-y-4">
            {builders.map((builder) => (
              <li
                key={builder.id}
                className={cn(
                  "rounded-lg border p-4 sm:p-5",
                  BUILDER_TONE[builder.status] ?? "border-line"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <RadioTower className="h-4 w-4 text-mercury" />
                    <span className="font-medium text-gold">{builder.businessName}</span>
                    <Badge
                      variant={
                        builder.status === "approved"
                          ? "success"
                          : builder.status === "pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {builder.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-ash/70">
                    {new Date(builder.createdAt).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-ash">
                  {builder.profile.fullName ?? builder.profile.handle ?? "member"} ·{" "}
                  {builder.profile.email} ·{" "}
                  {builder.profile.mobileVerified ? "mobile verified" : "mobile NOT verified"}
                  {builder.suburb ? ` · ${builder.suburb}` : ""}
                  {builder.website ? ` · ${builder.website}` : ""}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-parchment">
                  {builder.description}
                </p>
                {builder.products.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-ash">
                    shelf: {builder.products.map((p) => p.name).join(" · ")}
                  </p>
                )}
                {builder.reviewNote && (
                  <p className="mt-2 text-xs italic text-ash">note: {builder.reviewNote}</p>
                )}

                {/* Product slots — 3 free + granted extras (pilot: manual; later: rentals) */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ash">
                  <span className="font-mono">
                    slots: {builder.products.length}/{3 + builder.extraSlots} used
                    {builder.extraSlots > 0 ? ` (${builder.extraSlots} extra granted)` : ""}
                  </span>
                  {slotsFor === builder.id ? (
                    <span className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={slotsValue}
                        onChange={(event) => setSlotsValue(event.target.value)}
                        className="w-16 rounded border border-line bg-inset px-2 py-1 text-xs text-gold outline-none focus:border-sun"
                        aria-label="Extra slots"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={acting}
                        onClick={() =>
                          grantSlots(builder, Math.max(0, Math.min(60, Number(slotsValue) || 0)))
                        }
                      >
                        Set
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSlotsFor(null)}>
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSlotsFor(builder.id);
                        setSlotsValue(String(builder.extraSlots));
                      }}
                      className="text-mercury underline-offset-2 hover:underline"
                    >
                      adjust extra slots
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {noteFor === builder.id ? (
                    <div className="w-full space-y-2">
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={2}
                        placeholder="Optional note the builder sees (reason, what to fix…)"
                        className="w-full rounded border border-line bg-inset px-3 py-2 text-sm text-gold outline-none focus:border-sun"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={acting}
                          onClick={() => review(builder, "rejected", note)}
                        >
                          Confirm reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNoteFor(null);
                            setNote("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {builder.status !== "approved" && (
                        <Button
                          size="sm"
                          disabled={acting}
                          onClick={() => review(builder, "approved")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </Button>
                      )}
                      {builder.status === "pending" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={acting}
                          onClick={() => setNoteFor(builder.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Reject…
                        </Button>
                      )}
                      {builder.status === "approved" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={acting}
                          onClick={() => review(builder, "suspended")}
                        >
                          Suspend
                        </Button>
                      )}
                      {builder.status === "suspended" && (
                        <Button
                          size="sm"
                          disabled={acting}
                          onClick={() => review(builder, "approved")}
                        >
                          Reinstate
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : interests.length === 0 ? (
        <p className="py-8 text-center text-sm text-ash">No interest submissions in this view.</p>
      ) : (
        <ul className="space-y-3">
          {interests.map((interest) => (
            <li
              key={interest.id}
              className={cn(
                "rounded-lg border p-4",
                INTEREST_TONE[interest.status] ?? "border-line"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gold">{interest.email}</span>
                  <Badge variant="outline">{KIND_LABEL[interest.kind] ?? interest.kind}</Badge>
                  {interest.profile && (
                    <span className="text-xs text-mercury">
                      member: {interest.profile.fullName ?? interest.profile.handle ?? "yes"}
                    </span>
                  )}
                </div>
                <span className="text-xs text-ash/70">
                  {new Date(interest.createdAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs text-ash">
                {[interest.name, interest.suburb, interest.deviceModel]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              {interest.message && (
                <p className="mt-1.5 text-sm leading-relaxed text-parchment">{interest.message}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {interest.status === "new" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setInterestStatus(interest, "contacted")}
                  >
                    Mark contacted
                  </Button>
                )}
                {interest.status !== "closed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setInterestStatus(interest, "closed")}
                  >
                    Close
                  </Button>
                )}
                {interest.status !== "new" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setInterestStatus(interest, "new")}
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
