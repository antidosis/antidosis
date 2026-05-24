import { createClient } from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isNative = Capacitor.isNativePlatform();

/* ═══════════════════════════════════════════════════════════════
   NATIVE STORAGE ADAPTER
   Uses Capacitor Preferences on native (survives app updates)
   and localStorage on web.
   ═══════════════════════════════════════════════════════════════ */

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "", {
  auth: {
    persistSession: true,
    storage: isNative ? nativeStorage : localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
