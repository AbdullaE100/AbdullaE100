import { useQueryClient } from "@tanstack/react-query";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "./session";

type Ctx = { unread: number; refresh: () => void };
const InboxContext = createContext<Ctx>({ unread: 0, refresh: () => {} });
export const useInbox = () => use(InboxContext);

/** Unread chat count for the tab badge, kept live over Supabase Realtime. */
export function InboxProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  const qc = useQueryClient();
  const [unread, setUnread] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (!userId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { data } = await supabase.rpc("unread_conversation_count");
      setUnread(typeof data === "number" ? data : 0);
    }, 250);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    refresh();
    const channel = supabase
      .channel(`inbox:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        refresh();
        qc.invalidateQueries({ queryKey: ["conversations", userId] });
      })
      .subscribe();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        refresh();
        qc.invalidateQueries({ queryKey: ["conversations", userId] });
      }
    });
    return () => {
      sub.remove();
      supabase.removeChannel(channel);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId, refresh, qc]);

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh]);
  return <InboxContext value={value}>{children}</InboxContext>;
}
