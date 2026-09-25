import { useEffect, useRef } from "react";
import { supabase } from "@mobile/lib/supabase";
import { mutate } from "swr";

/* ═══════════════════════════════════════════════════════════════
   REALTIME MESSAGES
   Supabase realtime subscriptions for instant chat.
   Triggers SWR revalidation when new messages arrive.
   ═══════════════════════════════════════════════════════════════ */

export function useRealtimeChannelMessages(channelId: string | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`mobile-terminal-${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "terminal_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.channel_id === channelId) {
            mutate(["terminal-messages", channelId]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelId]);
}

export function useRealtimeDmMessages(threadId: string | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`mobile-dm-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.thread_id === threadId) {
            mutate(["dm-messages", threadId]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [threadId]);
}
