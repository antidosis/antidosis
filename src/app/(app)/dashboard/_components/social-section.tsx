"use client";

import Link from "next/link";

import { Loader2, UserX, UserPlus, MessageSquare, Shield } from "lucide-react";

import { useApi } from "@/lib/swr-config";

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SocialSection() {
  const { data: friendsData, isLoading: friendsLoading } = useApi<{
    friends: {
      id: string;
      user: { id: string; fullName: string | null; avatarUrl: string | null };
    }[];
  }>("/api/v1/terminal/friends");
  const { data: blocksData, isLoading: _blocksLoading } = useApi<{
    blocks: {
      id: string;
      user: { id: string; fullName: string | null; avatarUrl: string | null };
    }[];
  }>("/api/v1/terminal/blocks");

  const friends = friendsData?.friends || [];
  const blocks = blocksData?.blocks || [];

  return (
    <div className="space-y-6">
      {/* Friends */}
      <div className="vessel overflow-hidden">
        <div className="px-5 py-4 border-b border-line/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-ok" />
            <p className="text-sm font-medium text-gold">Friends</p>
            <span className="text-xs text-ash bg-raise px-2 py-0.5 rounded">{friends.length}</span>
          </div>
        </div>
        {friendsLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-parchment" />
            <p className="text-xs text-ash">loading friends...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-ash">
              No friends yet. Use <span className="text-sun">/friend</span> in the Relay to add
              people.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-raise/60 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-raise border border-line flex items-center justify-center text-[10px] font-bold text-parchment shrink-0">
                  {getInitials(f.user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gold truncate">
                    {f.user.fullName || "User"}
                  </p>
                </div>
                <Link
                  href={`/terminal?dm=${f.user.id}`}
                  className="p-1.5 text-ash hover:text-mercury transition-colors"
                  title="Message"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/profile/${f.user.id}`}
                  className="p-1.5 text-ash hover:text-sun transition-colors"
                  title="View profile"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked users */}
      {blocks.length > 0 && (
        <div className="vessel overflow-hidden">
          <div className="px-5 py-4 border-b border-line/60 flex items-center gap-2">
            <Shield className="h-4 w-4 text-bad" />
            <p className="text-sm font-medium text-gold">Blocked</p>
            <span className="text-xs text-ash bg-raise px-2 py-0.5 rounded">{blocks.length}</span>
          </div>
          <div className="divide-y divide-line/40">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-raise border border-line flex items-center justify-center text-[10px] font-bold text-ash shrink-0">
                  {getInitials(b.user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-parchment truncate">
                    {b.user.fullName || "User"}
                  </p>
                </div>
                <UserX className="h-3.5 w-3.5 text-bad/50" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
