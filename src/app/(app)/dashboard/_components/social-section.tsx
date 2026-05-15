"use client";

import Link from "next/link";
import { useApi } from "@/lib/swr-config";
import { Loader2, UserX, UserPlus, MessageSquare, Shield } from "lucide-react";

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function SocialSection() {
  const { data: friendsData, isLoading: friendsLoading } = useApi<{ friends: { id: string; user: { id: string; fullName: string | null; avatarUrl: string | null } }[] }>("/api/v1/terminal/friends");
  const { data: blocksData, isLoading: blocksLoading } = useApi<{ blocks: { id: string; user: { id: string; fullName: string | null; avatarUrl: string | null } }[] }>("/api/v1/terminal/blocks");

  const friends = friendsData?.friends || [];
  const blocks = blocksData?.blocks || [];

  return (
    <div className="space-y-6">
      {/* Friends */}
      <div className="vessel overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2420]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#00e676]" />
            <p className="text-sm font-medium text-[#e8d5a3]">Friends</p>
            <span className="text-xs text-[#7a6b5a] bg-[#1a1714] px-2 py-0.5 rounded">{friends.length}</span>
          </div>
        </div>
        {friendsLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-[#b8a078]" />
            <p className="text-xs text-[#7a6b5a]">loading friends...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-[#7a6b5a]">No friends yet. Use <span className="text-[#f5a623]">/friend</span> in the Terminal to add people.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2420]/40">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#1a1714]/60 transition-colors">
                <div className="h-8 w-8 rounded-full bg-[#1a1714] border border-[#2a2420] flex items-center justify-center text-[10px] font-bold text-[#b8a078] shrink-0">
                  {getInitials(f.user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#e8d5a3] truncate">{f.user.fullName || "User"}</p>
                </div>
                <Link
                  href={`/terminal?dm=${f.user.id}`}
                  className="p-1.5 text-[#7a6b5a] hover:text-[#00e5ff] transition-colors"
                  title="Message"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/profile/${f.user.id}`}
                  className="p-1.5 text-[#7a6b5a] hover:text-[#f5a623] transition-colors"
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
          <div className="px-5 py-4 border-b border-[#2a2420]/60 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#ff5252]" />
            <p className="text-sm font-medium text-[#e8d5a3]">Blocked</p>
            <span className="text-xs text-[#7a6b5a] bg-[#1a1714] px-2 py-0.5 rounded">{blocks.length}</span>
          </div>
          <div className="divide-y divide-[#2a2420]/40">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-[#1a1714] border border-[#2a2420] flex items-center justify-center text-[10px] font-bold text-[#7a6b5a] shrink-0">
                  {getInitials(b.user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#b8a078] truncate">{b.user.fullName || "User"}</p>
                </div>
                <UserX className="h-3.5 w-3.5 text-[#ff5252]/50" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
