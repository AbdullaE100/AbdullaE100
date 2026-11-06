"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, SendHorizontal, ShieldAlert, RotateCcw } from "lucide-react";
import { useInbox, useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/env";
import { formatDate, formatLKR, formatTime } from "@/lib/format";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Msg = { id: number; sender_id: string; body: string; created_at: string; failed?: boolean; pending?: boolean };
type Listing = { id: number; slug: string; title: string; price_lkr: number; cover_thumb: string | null; vehicle_type: string; status: string } | null;

const dayKey = (d: string) => new Date(d).toDateString();
function dayLabel(d: string) {
  const date = new Date(d);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return formatDate(d);
}

export function Thread({ id, other, role, listing, initial }: { id: string; other: string; role: "buyer" | "seller"; listing: Listing; initial: Msg[] }) {
  const session = useSession();
  const me = session?.userId;
  const { refresh } = useInbox();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [body, setBody] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const tempId = useRef(-1);

  const markRead = () => {
    supabaseBrowser()
      .rpc("mark_conversation_read", { p_conversation_id: id })
      .then(() => refresh());
  };

  useEffect(() => {
    setMsgs(initial);
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const db = supabaseBrowser();
    const ch = db
      .channel(`thread:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (payload) => {
        const m = payload.new as Msg;
        setMsgs((all) => {
          if (all.some((x) => x.id === m.id)) return all;
          // Replace our optimistic copy if this is our own message.
          const i = all.findIndex((x) => x.pending && x.sender_id === m.sender_id && x.body === m.body);
          if (i >= 0) {
            const next = [...all];
            next[i] = m;
            return next;
          }
          return [...all, m];
        });
        if (m.sender_id !== me) markRead();
      })
      .subscribe();
    return () => {
      db.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const send = async (text: string, retryId?: number) => {
    const clean = text.trim();
    if (!clean || !me) return;
    const tid = retryId ?? tempId.current--;
    const optimistic: Msg = { id: tid, sender_id: me, body: clean, created_at: new Date().toISOString(), pending: true };
    setMsgs((all) => (retryId ? all.map((m) => (m.id === retryId ? optimistic : m)) : [...all, optimistic]));
    if (!retryId) setBody("");
    input.current?.focus();
    const { data, error } = await supabaseBrowser().from("messages").insert({ conversation_id: id, sender_id: me, body: clean.slice(0, 2000) }).select("id, sender_id, body, created_at").single();
    setMsgs((all) => {
      if (error || !data) return all.map((m) => (m.id === tid ? { ...m, pending: false, failed: true } : m));
      if (all.some((m) => m.id === data.id)) return all.filter((m) => m.id !== tid);
      return all.map((m) => (m.id === tid ? data : m));
    });
  };

  const src = photoUrl(listing?.cover_thumb);
  const live = listing?.status === "active";

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col bg-surface lg:static lg:z-auto lg:h-full">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-2 py-2.5 lg:px-4">
        <Link href="/messages" className="grid size-10 place-items-center rounded-xl hover:bg-surface-2 lg:hidden" aria-label="Back to messages">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{other}</p>
          <p className="text-xs text-fg-muted">{role === "buyer" ? "Seller" : "Interested buyer"}</p>
        </div>
      </header>

      {listing && (
        <Link href={`/ad/${listing.id}/${listing.slug}`} className="flex shrink-0 items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-2.5 hover:bg-surface-2">
          <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <VehiclePlaceholder type={listing.vehicle_type} seed={listing.id} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{listing.title}</span>
            <span className="tabular text-sm text-fg-muted">{formatLKR(listing.price_lkr)}</span>
          </span>
          {!live && <Badge tone={listing.status === "sold" ? "brand" : "neutral"}>{listing.status === "sold" ? "Sold" : "Not live"}</Badge>}
        </Link>
      )}

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg px-3 py-4 sm:px-5" aria-live="polite">
        <div className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-2xl bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent-fg">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>Never send money before you&apos;ve seen the vehicle and checked its papers. We&apos;ll never ask you for a payment in chat.</p>
        </div>
        {msgs.map((m, i) => {
          const mine = m.sender_id === me;
          const prev = msgs[i - 1];
          const nextMsg = msgs[i + 1];
          const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
          const lastOfRun = !nextMsg || nextMsg.sender_id !== m.sender_id || dayKey(nextMsg.created_at) !== dayKey(m.created_at);
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-4 text-center">
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-fg-muted">{dayLabel(m.created_at)}</span>
                </div>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start", lastOfRun ? "mb-3" : "mb-1")}>
                <div className={cn("max-w-[80%] sm:max-w-[70%]")}>
                  <div
                    className={cn(
                      "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                      mine ? "bg-brand text-brand-fg" : "border border-border bg-surface text-fg",
                      mine && lastOfRun && "rounded-br-md",
                      !mine && lastOfRun && "rounded-bl-md",
                      m.pending && "opacity-70",
                      m.failed && "bg-danger-soft text-danger",
                    )}
                  >
                    {m.body}
                  </div>
                  {lastOfRun && (
                    <p className={cn("mt-1 px-1 text-[11px] text-fg-subtle", mine && "text-right")}>
                      {m.failed ? (
                        <button onClick={() => send(m.body, m.id)} className="inline-flex items-center gap-1 font-semibold text-danger">
                          <RotateCcw className="size-3" /> Not sent. Tap to retry
                        </button>
                      ) : m.pending ? (
                        "Sending…"
                      ) : (
                        formatTime(m.created_at)
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="safe-bottom shrink-0 border-t border-border bg-surface px-3 pt-3 lg:pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(body);
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <textarea
            id="composer"
            ref={input}
            rows={1}
            value={body}
            maxLength={2000}
            onChange={(e) => {
              setBody(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                e.preventDefault();
                send(body);
              }
            }}
            placeholder="Write a message"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-[15px] placeholder:text-fg-subtle focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
          />
          <button type="submit" disabled={!body.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-brand-fg shadow-sm transition hover:bg-brand-hover disabled:opacity-40" aria-label="Send">
            <SendHorizontal className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
