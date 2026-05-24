import { useCallback, useEffect, useRef } from "react";
import {
  hapticImpact,
  hapticNotification,
  takePhoto,
  pickPhotos,
  nativeShare,
  initPushNotifications,
  onPushToken,
  onPushNotification,
  onPushAction,
  setStatusBarStyle,
  type CameraImage,
} from "@mobile/lib/native";

// ── Haptics ──────────────────────────────────────────────────────────

export function useHaptics() {
  const tap = useCallback((style?: "light" | "medium" | "heavy") => {
    hapticImpact(style ?? "light");
  }, []);

  const success = useCallback(() => hapticNotification("success"), []);
  const warning = useCallback(() => hapticNotification("warning"), []);
  const error = useCallback(() => hapticNotification("error"), []);

  return { tap, success, warning, error };
}

// ── Camera ───────────────────────────────────────────────────────────

export function useCamera() {
  return {
    takePhoto: useCallback(() => takePhoto(), []),
    pickPhotos: useCallback(() => pickPhotos(), []),
  };
}

export type { CameraImage };

// ── Share ────────────────────────────────────────────────────────────

export function useShare() {
  return useCallback(
    (options: { title?: string; text?: string; url?: string }) => nativeShare(options),
    []
  );
}

// ── Push Notifications ───────────────────────────────────────────────

export function usePushNotifications(
  onToken?: (token: string) => void,
  onNotification?: (title: string, body: string, data?: Record<string, unknown>) => void,
  onAction?: (actionId: string, notification?: Record<string, unknown>) => void
) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initPushNotifications();

    const unsubToken = onPushToken((token) => {
      onToken?.(token.value);
    });

    const unsubNotification = onPushNotification((notification) => {
      const data = notification.data
        ? (notification.data as unknown as Record<string, unknown>)
        : undefined;
      onNotification?.(notification.title ?? "Notification", notification.body ?? "", data);
    });

    const unsubAction = onPushAction((action) => {
      const notif = action.notification
        ? (action.notification as unknown as Record<string, unknown>)
        : undefined;
      onAction?.(action.actionId, notif);
    });

    return () => {
      unsubToken();
      unsubNotification();
      unsubAction();
    };
  }, [onToken, onNotification, onAction]);
}

// ── Status Bar ───────────────────────────────────────────────────────

export function useStatusBar(style: "dark" | "light" = "dark") {
  useEffect(() => {
    setStatusBarStyle(style);
  }, [style]);
}
