"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, SendHorizontal, ShieldAlert, RotateCcw, HandCoins, X } from "lucide-react";
import { useInbox, useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/env";
import { dayKey, formatDate, formatLKR, formatLakhs, formatTime } from "@/lib/format";
import { formatOffer, parseOffer } from "@/lib/offer";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Msg = { id: number; sender_id: string; body: string; created_at: string; failed?: boolean; pending?: boolean };
type Listing = { id: number; slug: string; title: string; price_lkr: number; cover_thumb: string | null; vehicle_type: string; status: string } | null;

function dayLabel(d: string) {
  const k = dayKey(d);
  if (k === dayKey(Date.now())) return "Today";
  if (k === dayKey(Date.now() - 86_400_000)) return "Yesterday";
  return formatDate(d);
}

export function Thread({ id, other, role, listing, initial }: { id: string; other: string; role: "buyer" | "seller"; listing: Listing; initial: Msg[] }) {
  const session = useSession();
  const me = session?.userId;
  const { refresh } = useInbox();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [body, setBody] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState("");
  const offerAmount = Number(offer.replace(/\D/g, "")) || 0;
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

  // Merge messages from the server into local state, swapping out our own
  // optimistic copies and ignoring ones we already have.
  const merge = (incoming: Msg[]) => {
    if (!incoming.length) return;
    setMsgs((all) => {
      let next = all;
      for (const m of incoming) {
        if (next.some((x) => x.id === m.id)) continue;
        const i = next.findIndex((x) => x.pending && x.sender_id === m.sender_id && x.body === m.body);
        next = i >= 0 ? next.map((x, j) => (j === i ? m : x)) : [...next, m];
      }
      return next;
    });
    if (incoming.some((m) => m.sender_id !== me)) markRead();
  };

  const latest = useRef(msgs);
  useEffect(() => {
    latest.current = msgs;
  }, [msgs]);

  // Catch up on anything sent while the socket was connecting or the phone slept.
  const catchUp = async () => {
    const lastId = latest.current.reduce((max, m) => (m.id > max ? m.id : max), 0);
    const { data } = await supabaseBrowser()
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", id)
      .gt("id", lastId)
      .order("id")
      .limit(200);
    merge((data ?? []) as Msg[]);
  };

  useEffect(() => {
    const db = supabaseBrowser();
    const ch = db
      .channel(`thread:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (payload) => merge([payload.new as Msg]))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") catchUp();
      });
    const onVisible = () => document.visibilityState === "visible" && catchUp();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
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

      <div ref={scroller} tabIndex={0} aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg px-3 py-4 focus-visible:outline-offset-[-2px] sm:px-5" aria-live="polite">
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
                    {(() => {
                      const o = parseOffer(m.body);
                      if (!o) return m.body;
                      const pct = listing?.price_lkr ? Math.round(((listing.price_lkr - o.amount) / listing.price_lkr) * 100) : null;
                      return (
                        <span className="block min-w-44">
                          <span className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide", mine ? "text-white/90" : "text-accent-fg")}>
                            <HandCoins className="size-4" /> {mine ? "Your offer" : "Offer"}
                          </span>
                          <span className="tabular mt-0.5 block text-xl font-extrabold">{formatLKR(o.amount)}</span>
                          {pct != null && pct !== 0 && (
                            <span className={cn("block text-xs", mine ? "text-white/90" : "text-fg-muted")}>
                              {Math.abs(pct)}% {pct > 0 ? "below" : "above"} the {formatLKR(listing!.price_lkr)} asking price
                            </span>
                          )}
                          {o.note && <span className="mt-1.5 block">{o.note}</span>}
                        </span>
                      );
                    })()}
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
        {offerOpen && (
          <div className="mb-2.5 flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent-soft/60 p-2">
            <HandCoins className="ml-1 size-5 shrink-0 text-accent-fg" aria-hidden />
            <label htmlFor="offer-amount" className="sr-only">
              Offer amount in rupees
            </label>
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-fg-muted">Rs</span>
              <input
                id="offer-amount"
                inputMode="numeric"
                autoFocus
                value={offerAmount ? offerAmount.toLocaleString("en-LK") : ""}
                onChange={(e) => setOffer(e.target.value)}
                placeholder={listing ? Math.round(listing.price_lkr * 0.95).toLocaleString("en-LK") : "Amount"}
                className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[15px] focus:border-brand focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="button"
              disabled={offerAmount < 10_000}
              onClick={() => {
                send(formatOffer(offerAmount, body));
                setOffer("");
                setBody("");
                setOfferOpen(false);
              }}
              className="h-10 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-hover disabled:opacity-40"
            >
              Send offer
            </button>
            <button type="button" onClick={() => setOfferOpen(false)} className="grid size-10 shrink-0 place-items-center rounded-xl text-fg-muted hover:bg-surface" aria-label="Cancel offer">
              <X className="size-4" />
            </button>
          </div>
        )}
        {offerOpen && offerAmount > 0 && <p className="-mt-1 mb-2 px-2 text-xs text-fg-muted">{formatLakhs(offerAmount)}. Anything you type below is sent with the offer.</p>}
        <div className="flex items-end gap-2">
          {role === "buyer" && !offerOpen && listing?.status === "active" && (
            <button
              type="button"
              onClick={() => setOfferOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border text-fg-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Make an offer"
              title="Make an offer"
            >
              <HandCoins className="size-5" />
            </button>
          )}
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <textarea
            id="composer"
            ref={input}
            rows={1}
            value={body}
            maxLength={1900}
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
