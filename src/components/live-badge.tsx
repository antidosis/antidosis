"use client";

import { useState, useEffect } from "react";

import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function LiveBadge({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPresence() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      fetch("/api/v1/terminal/presence")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.count === "number") {
            setCount(data.count);
          } else if (Array.isArray(data.users)) {
            setCount(data.users.length);
          }
        })
        .catch(() => {});
    }
    fetchPresence();
  }, [supabase]);

  if (count === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/20 px-2 py-1 rounded-full ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]" />
      </span>
      <Users className="h-3 w-3" />
      {count} online
    </span>
  );
}
