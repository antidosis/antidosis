import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Share } from "@capacitor/share";
import { Preferences } from "@capacitor/preferences";
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
  type RegistrationError,
  type Token,
} from "@capacitor/push-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";

const isNative = Capacitor.isNativePlatform();

// ── Haptics ──────────────────────────────────────────────────────────

export async function hapticImpact(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative) return;
  try {
    const map: Record<string, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] ?? ImpactStyle.Light });
  } catch {
    /* ignore */
  }
}

export async function hapticNotification(type: "success" | "warning" | "error" = "success") {
  if (!isNative) return;
  try {
    const map: Record<string, NotificationType> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: map[type] ?? NotificationType.Success });
  } catch {
    /* ignore */
  }
}

export async function hapticSelection() {
  if (!isNative) return;
  try {
    await Haptics.selectionStart();
  } catch {
    /* ignore */
  }
}

// ── Camera ───────────────────────────────────────────────────────────

export interface CameraImage {
  base64String?: string;
  path?: string;
  webPath?: string;
  format: string;
}

export async function takePhoto(): Promise<CameraImage | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 85,
      allowEditing: false,
    });
    return {
      base64String: photo.base64String,
      path: photo.path,
      webPath: photo.webPath ?? undefined,
      format: photo.format,
    };
  } catch {
    return null;
  }
}

export async function pickPhotos(): Promise<CameraImage | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      quality: 85,
      allowEditing: false,
    });
    return {
      base64String: photo.base64String,
      path: photo.path,
      webPath: photo.webPath ?? undefined,
      format: photo.format,
    };
  } catch {
    return null;
  }
}

// ── Share ────────────────────────────────────────────────────────────

export async function nativeShare(options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<void> {
  if (!isNative) {
    // Web fallback: copy to clipboard
    if (options.url) {
      await navigator.clipboard.writeText(options.url);
    }
    return;
  }
  try {
    await Share.share({
      title: options.title,
      text: options.text,
      url: options.url,
      dialogTitle: options.title,
    });
  } catch {
    /* ignore */
  }
}

// ── Preferences (local storage) ──────────────────────────────────────

export async function getPref(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

export async function setPref(key: string, value: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

export async function removePref(key: string): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

// ── Push Notifications ───────────────────────────────────────────────

export type PushTokenListener = (token: Token) => void;
export type PushNotificationListener = (notification: PushNotificationSchema) => void;
export type PushActionListener = (action: ActionPerformed) => void;

let tokenListeners: PushTokenListener[] = [];
let notificationListeners: PushNotificationListener[] = [];
let actionListeners: PushActionListener[] = [];

export function onPushToken(listener: PushTokenListener) {
  tokenListeners.push(listener);
  return () => {
    tokenListeners = tokenListeners.filter((l) => l !== listener);
  };
}

export function onPushNotification(listener: PushNotificationListener) {
  notificationListeners.push(listener);
  return () => {
    notificationListeners = notificationListeners.filter((l) => l !== listener);
  };
}

export function onPushAction(listener: PushActionListener) {
  actionListeners.push(listener);
  return () => {
    actionListeners = actionListeners.filter((l) => l !== listener);
  };
}

export async function initPushNotifications(): Promise<boolean> {
  if (!isNative) return false;

  try {
    const { receive } = await PushNotifications.checkPermissions();
    if (receive !== "granted") {
      const { receive: granted } = await PushNotifications.requestPermissions();
      if (granted !== "granted") return false;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      tokenListeners.forEach((l) => l(token));
    });

    PushNotifications.addListener("registrationError", (_error: RegistrationError) => {
      /* silently ignore */
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      notificationListeners.forEach((l) => l(notification));
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      actionListeners.forEach((l) => l(action));
    });

    return true;
  } catch {
    return false;
  }
}

export async function getDeliveredNotifications() {
  if (!isNative) return [];
  try {
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    return notifications;
  } catch {
    return [];
  }
}

export async function removeAllDeliveredNotifications() {
  if (!isNative) return;
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch {
    /* ignore */
  }
}

// ── Status Bar ───────────────────────────────────────────────────────

export async function setStatusBarStyle(style: "dark" | "light") {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({
      style: style === "dark" ? Style.Dark : Style.Light,
    });
  } catch {
    /* ignore */
  }
}
