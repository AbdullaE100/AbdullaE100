"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { CompareProvider } from "@/components/compare";

export type Session = { userId: string; name: string | null; email: string | null; isStaff: boolean } | null;

const SessionContext = createContext<Session>(null);
export const useSession = () => useContext(SessionContext);

type FavCtx = {
  ids: number[];
  /** When each ad was saved (signed-in users only). */
  savedAt: Record<number, string>;
  has: (id: number) => boolean;
  toggle: (id: number) => void;
  removeMany: (ids: number[]) => void;
  ready: boolean;
};
const FavContext = createContext<FavCtx>({ ids: [], savedAt: {}, has: () => false, toggle: () => {}, removeMany: () => {}, ready: false });
export const useFavourites = () => useContext(FavContext);

type InboxCtx = { unread: number; refresh: () => void };
const InboxContext = createContext<InboxCtx>({ unread: 0, refresh: () => {} });
export const useInbox = () => useContext(InboxContext);

const LOCAL_KEY = "wahana:saved";

function readLocal(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => Number.isInteger(x)) : [];
  } catch {
    return [];
  }
}
function writeLocal(ids: number[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids.slice(0, 200)));
  } catch {}
}

function AuthListener() {
  const router = useRouter();
  const session = useSession();
  useEffect(() => {
    const { data } = supabaseBrowser().auth.onAuthStateChange((event, s) => {
      const changed =
        (event === "SIGNED_IN" && s?.user.id !== session?.userId) || (event === "SIGNED_OUT" && session) || event === "USER_UPDATED";
      if (changed) router.refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [router, session]);
  return null;
}

function FavouritesProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const { toast } = useToast();
  const [ids, setIdsState] = useState<number[]>([]);
  const [savedAt, setSavedAt] = useState<Record<number, string>>({});
  const [ready, setReady] = useState(false);
  const userId = session?.userId;
  // Always read and write through the ref so quick successive changes compose.
  const latest = useRef<number[]>([]);
  const setIds = useCallback((next: number[]) => {
    latest.current = next;
    setIdsState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      if (!userId) {
        if (!cancelled) {
          setIds(local);
          setReady(true);
        }
        return;
      }
      const db = supabaseBrowser();
      // Carry over anything saved before signing in, one by one so a single
      // bad id (e.g. a deleted ad) can't drop the rest. Keep whatever fails.
      if (local.length) {
        const results = await Promise.all(local.map((listing_id) => db.from("favourites").insert({ user_id: userId, listing_id })));
        writeLocal(local.filter((_, i) => results[i].error && results[i].error!.code !== "23505" && results[i].error!.code !== "23503"));
      }
      const { data } = await db.from("favourites").select("listing_id, created_at").order("created_at", { ascending: false }).limit(500);
      if (!cancelled) {
        setIds((data ?? []).map((r) => r.listing_id));
        setSavedAt(Object.fromEntries((data ?? []).map((r) => [r.listing_id, r.created_at])));
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, setIds]);

  const toggle = useCallback(
    (id: number) => {
      const before = latest.current;
      const on = !before.includes(id);
      setIds(on ? [id, ...before] : before.filter((x) => x !== id));
      if (!userId) {
        writeLocal(latest.current);
        if (on)
          toast({
            title: "Saved on this device",
            body: "Sign in to keep your saved ads on every device.",
            action: { label: "Sign in", href: "/signin?next=/account/saved" },
          });
        return;
      }
      if (on) setSavedAt((m) => ({ ...m, [id]: new Date().toISOString() }));
      const db = supabaseBrowser();
      const req = on
        ? db.from("favourites").insert({ user_id: userId, listing_id: id })
        : db.from("favourites").delete().eq("user_id", userId).eq("listing_id", id);
      req.then(({ error }) => {
        if (error && error.code !== "23505") {
          // Undo just this change, keeping any made since.
          setIds(on ? latest.current.filter((x) => x !== id) : [id, ...latest.current.filter((x) => x !== id)]);
          toast({ tone: "error", title: "Couldn't update saved ads", body: "Check your connection and try again." });
        } else if (on) {
          toast({ tone: "success", title: "Saved", action: { label: "View saved", href: "/account/saved" } });
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
      if (!userId) return writeLocal(latest.current);
      supabaseBrowser()
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .in("listing_id", remove)
        .then(({ error }) => error && toast({ tone: "error", title: "Couldn't update saved ads" }));
    },
    [userId, toast, setIds],
  );

  const value = useMemo(() => ({ ids, savedAt, has: (id: number) => ids.includes(id), toggle, removeMany, ready }), [ids, savedAt, toggle, removeMany, ready]);
  return <FavContext.Provider value={value}>{children}</FavContext.Provider>;
}

function InboxProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [unread, setUnread] = useState(0);
  const userId = session?.userId;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (!userId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { data } = await supabaseBrowser().rpc("unread_conversation_count");
      setUnread(typeof data === "number" ? data : 0);
    }, 250);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    refresh();
    const db = supabaseBrowser();
    const channel = db
      .channel(`inbox:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => refresh())
      .subscribe();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      db.removeChannel(channel);
    };
  }, [userId, refresh]);

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh]);
  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function Providers({ session, children }: { session: Session; children: ReactNode }) {
  return (
    <SessionContext.Provider value={session}>
      <ToastProvider>
        <AuthListener />
        <FavouritesProvider>
          <CompareProvider>
            <InboxProvider>{children}</InboxProvider>
          </CompareProvider>
        </FavouritesProvider>
      </ToastProvider>
    </SessionContext.Provider>
  );
}
