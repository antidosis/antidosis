"use client";

import { useState } from "react";

import Link from "next/link";

import { AtSign, Ban, Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { mutate } from "swr";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useApi } from "@/lib/swr-config";

interface FriendEntry {
  id: string;
  createdAt: string;
  user: { id: string; fullName: string | null; avatarUrl: string | null };
}

interface BlockEntry {
  id: string;
  createdAt: string;
  user: { id: string; fullName: string | null; avatarUrl: string | null };
}

export function FriendsManager() {
  const { toast } = useToast();
  const { data: friendsData } = useApi<{ friends: FriendEntry[] }>("/api/v1/terminal/friends");
  const { data: blocksData } = useApi<{ blocks: BlockEntry[] }>("/api/v1/terminal/blocks");
  const [handle, setHandle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);

  const friends = friendsData?.friends ?? [];
  const blocks = blocksData?.blocks ?? [];

  async function addByHandle(e: React.FormEvent) {
    e.preventDefault();
    const value = handle.trim().replace(/^@/, "");
    if (!value) return;
    setAdding(true);
    try {
      const res = await fetch("/api/v1/terminal/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || `Couldn't find @${value}`, "error");
        return;
      }
      setHandle("");
      toast(`Added @${value} as a friend`, "success");
      mutate("/api/v1/terminal/friends");
    } catch {
      toast("Couldn't add friend — try again", "error");
    } finally {
      setAdding(false);
    }
  }

  async function removeFriend(id: string, name: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/v1/terminal/friends/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast(`${name} removed from friends`, "success");
        mutate("/api/v1/terminal/friends");
      } else {
        toast("Couldn't remove friend", "error");
      }
    } catch {
      toast("Couldn't remove friend — try again", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function unblock(id: string, name: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/v1/terminal/blocks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast(`${name} unblocked`, "success");
        mutate("/api/v1/terminal/blocks");
      } else {
        toast("Couldn't unblock", "error");
      }
    } catch {
      toast("Couldn't unblock — try again", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="vessel p-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60">
        <Users className="mr-1.5 inline h-3.5 w-3.5" /> friends
      </p>

      {/* Add by handle */}
      <form onSubmit={addByHandle} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            placeholder="add by handle — e.g. marti"
            aria-label="Friend's handle"
            autoComplete="off"
            className="pl-9 font-mono text-sm lowercase"
          />
        </div>
        <Button type="submit" size="sm" disabled={adding || !handle.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add
        </Button>
      </form>

      {friends.length === 0 ? (
        <p className="text-sm text-ash">
          No friends yet — add someone by their handle above. Friends are a quick way to keep track
          of people you&rsquo;ve traded with.
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link
                href={`/profile/${friend.user.id}`}
                className="flex min-w-0 items-center gap-3 group"
              >
                <Avatar
                  src={friend.user.avatarUrl}
                  name={friend.user.fullName}
                  size="sm"
                  className="h-8 w-8"
                />
                <span className="truncate text-sm text-parchment group-hover:text-sun">
                  {friend.user.fullName || "anonymous"}
                </span>
              </Link>
              <button
                onClick={() => removeFriend(friend.id, friend.user.fullName || "Friend")}
                disabled={busyId === friend.id}
                className="flex items-center gap-1 rounded border border-line px-2 py-1 text-[11px] text-ash transition-colors hover:border-bad/40 hover:text-bad disabled:opacity-50"
              >
                {busyId === friend.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserMinus className="h-3 w-3" />
                )}
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Blocked members */}
      <div className="mt-4 border-t border-line/60 pt-3">
        <button
          onClick={() => setShowBlocked(!showBlocked)}
          className="flex items-center gap-1.5 text-xs text-ash transition-colors hover:text-gold"
        >
          <Ban className="h-3.5 w-3.5" />
          Blocked members {blocks.length > 0 ? `(${blocks.length})` : ""}
        </button>
        {showBlocked && (
          <div className="mt-2">
            {blocks.length === 0 ? (
              <p className="text-xs text-ash">
                Nobody blocked. Blocking stops direct messages and removes any friendship.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {blocks.map((block) => (
                  <li key={block.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={block.user.avatarUrl}
                        name={block.user.fullName}
                        size="sm"
                        className="h-8 w-8 opacity-60"
                      />
                      <span className="truncate text-sm text-ash">
                        {block.user.fullName || "anonymous"}
                      </span>
                    </div>
                    <button
                      onClick={() => unblock(block.id, block.user.fullName || "Member")}
                      disabled={busyId === block.id}
                      className="rounded border border-line px-2 py-1 text-[11px] text-ash transition-colors hover:border-ok/40 hover:text-ok disabled:opacity-50"
                    >
                      {busyId === block.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Unblock"
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
