import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@mobile/lib/supabase";

type AuthState = {
  user: User | null;
  loading: boolean;
};

let globalState: AuthState = { user: null, loading: true };
const listeners = new Set<(state: AuthState) => void>();

function setGlobalState(state: AuthState) {
  globalState = state;
  listeners.forEach((cb) => cb(state));
}

// Initialise once on module load
supabase.auth
  .getSession()
  .then(({ data: { session } }) => {
    setGlobalState({ user: session?.user ?? null, loading: false });
  })
  .catch(() => {
    setGlobalState({ user: null, loading: false });
  });

supabase.auth.onAuthStateChange((_event, session) => {
  setGlobalState({ user: session?.user ?? null, loading: false });
});

export { supabase };

export function useAuth() {
  const [state, setState] = useState<AuthState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    setState(globalState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  // Listen for global 401 events from api.ts
  useEffect(() => {
    const handler = () => {
      setGlobalState({ user: null, loading: false });
    };
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    signIn,
    signUp,
    signOut,
    supabase,
  };
}
