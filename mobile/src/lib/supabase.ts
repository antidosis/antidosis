import { createClient } from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isNative = Capacitor.isNativePlatform();

/* ═══════════════════════════════════════════════════════════════
   NATIVE STORAGE ADAPTER
   Uses capacitor-secure-storage-plugin on native (Android Keystore /
   iOS Keychain — session tokens never touch unencrypted
   SharedPreferences/UserDefaults) and localStorage on web.

   One-time migration: sessions persisted by earlier builds via
   @capacitor/preferences are moved into secure storage lazily, on
   first access per key, and the plaintext copy is removed.
   ═══════════════════════════════════════════════════════════════ */

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      if (value) return value;
    } catch {
      // Key absent (or unreadable) in secure storage — check for a
      // pre-upgrade plaintext copy below.
    }
    const { value: legacy } = await Preferences.get({ key });
    if (legacy == null) return null;
    // Migrate into secure storage and drop the plaintext copy. A
    // concurrent double-set is harmless — same value, idempotent.
    await SecureStoragePlugin.set({ key, value: legacy });
    await Preferences.remove({ key });
    return legacy;
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStoragePlugin.set({ key, value });
    // Ensure no plaintext copy lingers from a pre-upgrade session.
    await Preferences.remove({ key }).catch(() => {});
  },
  async removeItem(key: string): Promise<void> {
    await SecureStoragePlugin.remove({ key }).catch(() => {});
    await Preferences.remove({ key }).catch(() => {});
  },
};

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "", {
  auth: {
    persistSession: true,
    storage: isNative ? secureStorage : localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
