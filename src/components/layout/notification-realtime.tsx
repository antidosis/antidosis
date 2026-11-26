"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

interface NotificationPayload {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown> | null;
  isRead?: boolean;
  createdAt?: string;
}

function playNotificationSound() {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // AudioContext not available — silent fallback
  }
}

export function NotificationRealtime() {
  const { toast } = useToast();
  const profileIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const res = await fetch("/api/v1/profiles/me");
      if (!res.ok || cancelled) return;
      const profile = await res.json();
      if (!profile?.id || cancelled) return;

      profileIdRef.current = profile.id;

      channel = supabase
        // Unique name per effect run: re-runs (StrictMode double-mount, re-render
        // before cleanup) must not call `.on()` on an already-subscribed channel
        // with the same name, which throws.
        .channel(`notifications_realtime:${profile.id}:${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            const notif = payload.new as NotificationPayload;
            if (!notif) return;

            // Toast
            toast(notif.title || "New notification", "info");

            // Sound
            playNotificationSound();

            // Tell the bell to re-fetch
            window.dispatchEvent(new CustomEvent("antidosis:notification"));
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  return null;
}
