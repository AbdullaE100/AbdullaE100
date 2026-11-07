import { router } from "expo-router";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { localSavedStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { useSession } from "./session";

type Ctx = {
  ids: number[];
  /** When each ad was saved (signed-in users only). */
  savedAt: Record<number, string>;
  has: (id: number) => boolean;
  toggle: (id: number, source?: string) => void;
  removeMany: (ids: number[]) => void;
  ready: boolean;
};

const FavContext = createContext<Ctx>({ ids: [], savedAt: {}, has: () => false, toggle: () => {}, removeMany: () => {}, ready: false });
export const useFavourites = () => use(FavContext);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { userId, ready: sessionReady } = useSession();
  const { toast } = useToast();
  const [ids, setIdsState] = useState<number[]>([]);
  const [savedAt, setSavedAt] = useState<Record<number, string>>({});
  const [ready, setReady] = useState(false);
  // Read and write through the ref so quick successive taps compose.
  const latest = useRef<number[]>([]);
  const setIds = useCallback((next: number[]) => {
    latest.current = next;
    setIdsState(next);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    (async () => {
      await localSavedStore.ready;
      const local = localSavedStore.get();
      if (!userId) {
        if (!cancelled) {
          setIds(local);
          setSavedAt({});
          setReady(true);
        }
        return;
      }
      // Carry over ads saved before signing in; keep only the ones that failed for a retryable reason.
      if (local.length) {
        const results = await Promise.all(
          local.map((listing_id) => supabase.from("favourites").upsert({ user_id: userId, listing_id }, { onConflict: "user_id,listing_id", ignoreDuplicates: true })),
        );
        localSavedStore.set(local.filter((_, i) => results[i].error && results[i].error!.code !== "23503"));
      }
      const { data } = await supabase.from("favourites").select("listing_id, created_at").order("created_at", { ascending: false }).limit(500);
      if (!cancelled) {
        setIds((data ?? []).map((r) => r.listing_id));
        setSavedAt(Object.fromEntries((data ?? []).map((r) => [r.listing_id, r.created_at])));
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, sessionReady, setIds]);

  const toggle = useCallback(
    (id: number, source = "unknown") => {
      const before = latest.current;
      const on = !before.includes(id);
      setIds(on ? [id, ...before] : before.filter((x) => x !== id));
      if (on) track("ad_saved", { listing_id: id, source, signed_in: !!userId });
      if (!userId) {
        localSavedStore.set(latest.current);
        if (on)
          toast({
            title: "Saved on this phone",
            body: "Sign in to keep saved ads on all your devices.",
            action: { label: "Sign in", onPress: () => router.push({ pathname: "/signin", params: { next: "/saved" } }) },
          });
        return;
      }
      if (on) setSavedAt((m) => ({ ...m, [id]: new Date().toISOString() }));
      const req = on
        ? supabase.from("favourites").upsert({ user_id: userId, listing_id: id }, { onConflict: "user_id,listing_id", ignoreDuplicates: true })
        : supabase.from("favourites").delete().eq("user_id", userId).eq("listing_id", id);
      req.then(({ error }) => {
        if (error && error.code !== "23505") {
          setIds(on ? latest.current.filter((x) => x !== id) : [id, ...latest.current.filter((x) => x !== id)]);
          toast({ tone: "error", title: "Couldn't update saved ads", body: "Check your connection and try again." });
        } else if (on) {
          toast({ tone: "success", title: "Saved", action: { label: "View", onPress: () => router.push("/saved") } });
        }
      });
    },
    [userId, toast, setIds],
  );

  const removeMany = useCallback(
    (remove: number[]) => {
      if (!remove.length) return;
      const drop = new Set(remove);
      setIds(latest.current.filter((x) => !drop.has(x)));
      if (!userId) return localSavedStore.set(latest.current);
      supabase
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .in("listing_id", remove)
        .then(({ error }) => {
          if (error) toast({ tone: "error", title: "Couldn't update saved ads" });
        });
    },
    [userId, toast, setIds],
  );

  const value = useMemo(() => ({ ids, savedAt, has: (id: number) => ids.includes(id), toggle, removeMany, ready }), [ids, savedAt, toggle, removeMany, ready]);
  return <FavContext value={value}>{children}</FavContext>;
}
