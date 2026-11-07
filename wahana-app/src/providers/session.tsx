import type { Session as AuthSession } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { identify } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  account_type: string;
  dealer_name: string | null;
  dealer_slug: string | null;
  district_id: number | null;
  city_id: number | null;
};

type Ctx = {
  /** False until the stored session has been read. */
  ready: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  isStaff: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Ctx>({
  ready: false,
  userId: null,
  email: null,
  profile: null,
  isStaff: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});
export const useSession = () => use(SessionContext);

export function displayName(p: Profile | null, email: string | null) {
  return (p?.account_type === "dealer" && p.dealer_name) || p?.display_name || email?.split("@")[0] || "You";
}

async function loadProfile(userId: string) {
  const [{ data: p }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, account_type, dealer_name, dealer_slug, district_id, city_id").eq("id", userId).maybeSingle(),
    supabase.rpc("is_staff"),
  ]);
  return { profile: (p as Profile | null) ?? null, staff: staff === true };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const userId = auth?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuth(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setAuth((prev) => (prev?.access_token === s?.access_token ? prev : s));
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const r = await loadProfile(userId);
    setProfile(r.profile);
    setIsStaff(r.staff);
  }, [userId]);

  useEffect(() => {
    identify(userId);
    // Anything cached for the previous user (inbox, my ads) is now wrong.
    qc.removeQueries({ predicate: (q) => ["conversations", "conversation", "my-ads", "saved-searches"].includes(String(q.queryKey[0])) });
    if (!userId) return;
    let alive = true;
    loadProfile(userId).then((r) => {
      if (!alive) return;
      setProfile(r.profile);
      setIsStaff(r.staff);
    });
    return () => {
      alive = false;
    };
  }, [userId, qc]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<Ctx>(
    () => ({ ready, userId, email: auth?.user.email ?? null, profile: userId && profile?.id === userId ? profile : null, isStaff: !!userId && isStaff, refreshProfile, signOut }),
    [ready, userId, auth?.user.email, profile, isStaff, refreshProfile, signOut],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}
