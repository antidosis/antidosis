import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   NETWORK STATUS
   Tracks online/offline state with simple boolean.
   ═══════════════════════════════════════════════════════════════ */

export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}
