import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so navigating between routes doesn't flash the
// logged-out UI while `supabase.auth.getUser()` re-resolves.
let cachedUser: User | null | undefined = undefined;

function readSessionSync(): User | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const user = parsed?.user ?? parsed?.currentSession?.user ?? null;
      if (user) return user as User;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(() => {
    if (cachedUser !== undefined) return cachedUser;
    const u = readSessionSync();
    cachedUser = u;
    return u;
  });
  const [loaded, setLoaded] = useState<boolean>(cachedUser !== undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      cachedUser = data.user ?? null;
      setUser(cachedUser);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      cachedUser = session?.user ?? null;
      setUser(cachedUser);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loaded };
}