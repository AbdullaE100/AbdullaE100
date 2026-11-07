"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Share2, Flag, Check, Copy, ShieldAlert } from "lucide-react";
import { useSession } from "@/app/providers";
import { recordRecent } from "@/lib/recent";
import { formatOffer } from "@/lib/offer";
import { displayLkPhone, formatLakhs } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import { REPORT_REASONS } from "@/lib/constants";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { FavouriteButton } from "@/components/favourite-button";
import { cn } from "@/lib/cn";

type Contact = { phone: string; whatsapp: string | null; seller_name: string | null } | "none" | null;

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.25.69-1.44 1.33-2 1.38-.51.05-1.16.07-1.87-.12-.43-.13-.98-.31-1.69-.61-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.79-.37l.57.01c.18.01.43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.14 1.01 2.09 1.33 2.39 1.48.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.73.82 2.03.97.3.15.49.22.57.35.07.12.07.72-.18 1.41Z" />
    </svg>
  );
}

export function useReveal(listingId: number) {
  const [contact, setContact] = useState<Contact>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const reveal = async () => {
    if (busy || contact) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().rpc("reveal_contact", { p_listing_id: listingId });
    setBusy(false);
    if (error) {
      toast({ tone: "error", title: error.message || "Couldn't show the number" });
      return;
    }
    const row = data?.[0];
    setContact(row?.phone ? { phone: row.phone, whatsapp: row.whatsapp, seller_name: row.seller_name } : "none");
  };
  return { contact, busy, reveal };
}

function waLink(num: string, title: string) {
  const text = encodeURIComponent(`Hi, I saw your ${title} on Wahana. Is it still available?`);
  return `https://wa.me/${num.replace(/^\+/, "")}?text=${text}`;
}

/** Shows the seller's number (revealing it on open) with Call and WhatsApp. */
export function ContactDialog({
  open,
  onClose,
  listingId,
  title,
  sellerName,
  focus = "call",
  onChat,
}: {
  open: boolean;
  onClose: () => void;
  listingId: number;
  title: string;
  sellerName: string;
  focus?: "call" | "whatsapp";
  onChat?: () => void;
}) {
  const { contact, busy, reveal } = useReveal(listingId);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (open) reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  const c = contact && contact !== "none" ? contact : null;
  return (
    <Dialog open onClose={onClose} title={focus === "whatsapp" ? "WhatsApp the seller" : "Call the seller"} description={title} variant="sheet">
      {busy || contact === null ? (
        <div className="flex items-center justify-center gap-2 py-10 text-fg-muted">
          <Spinner className="size-5" /> Getting the number…
        </div>
      ) : c ? (
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-bold text-fg-muted">{c.seller_name || sellerName}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <a href={`tel:${c.phone}`} className="tabular text-2xl font-bold tracking-tight text-fg hover:underline">
                {displayLkPhone(c.phone)}
              </a>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(c.phone).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
                className="grid size-10 place-items-center rounded-lg text-fg-muted hover:bg-surface"
                aria-label="Copy number"
              >
                {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />}
              </button>
            </div>
            <p className="mt-2 text-[13px] text-fg-muted">Ad reference {listingId}. Mention Wahana when you call.</p>
          </div>
          <div className={cn("grid gap-2", c.whatsapp ? "grid-cols-2" : "grid-cols-1")}>
            <a href={`tel:${c.phone}`} className={buttonClass({ variant: focus === "call" || !c.whatsapp ? "primary" : "secondary", size: "lg", className: "w-full" })}>
              <Phone className="size-[18px]" /> Call now
            </a>
            {c.whatsapp && (
              <a
                href={waLink(c.whatsapp, title)}
                target="_blank"
                rel="noopener"
                className={buttonClass({ variant: focus === "whatsapp" ? "primary" : "secondary", size: "lg", className: cn("w-full", focus !== "whatsapp" && "text-brand-text") })}
              >
                <WhatsAppIcon className="size-[18px]" /> WhatsApp
              </a>
            )}
          </div>
          {!c.whatsapp && focus === "whatsapp" && <p className="text-sm text-fg-muted">This seller hasn&apos;t added a WhatsApp number.</p>}
          <p className="flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-[13px] text-accent-fg">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Never pay an advance before you&apos;ve seen the vehicle and its papers.
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <p className="text-[15px] text-fg-muted">This seller hasn&apos;t shared a phone number. Send them a message instead; they&apos;ll get it straight away.</p>
          {onChat && (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                onClose();
                onChat();
              }}
            >
              <MessageCircle className="size-[18px]" /> Message the seller
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
}

const QUICK_REPLIES = ["Is it still available?", "What's your best price?", "Can I see it this weekend?", "Is the CR book clear?", "Any accident repairs?"];

/** First message to a seller, with quick replies and an optional offer. */
export function ChatDialog({ open, onClose, listingId, title, price }: { open: boolean; onClose: () => void; listingId: number; title: string; price?: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState(`Hi, is your ${title} still available?`);
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const offerAmount = Number(offer.replace(/\D/g, "")) || 0;
  const offerPct = price && offerAmount ? Math.round(((price - offerAmount) / price) * 100) : null;
  if (!open) return null;

  const send = async () => {
    setBusy(true);
    const text = offerAmount >= 10_000 ? formatOffer(offerAmount, body) : body;
    const { data, error } = await supabaseBrowser().rpc("start_conversation", { p_listing_id: listingId, p_body: text });
    setBusy(false);
    if (error || !data) {
      toast({ tone: "error", title: error?.message || "Couldn't send your message" });
      return;
    }
    onClose();
    router.push(`/messages/${data}`);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Message the seller"
      description="Your phone number and email stay private. Keep the chat here until you're ready to meet."
      variant="sheet"
      footer={
        <Button size="lg" className="w-full" onClick={send} loading={busy} disabled={!body.trim()}>
          Send message
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2 pb-3 pt-1">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setBody((b) => (b.includes(q) ? b : `${b.trim()} ${q}`.trim()))}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-border-strong hover:bg-surface-2"
          >
            {q}
          </button>
        ))}
      </div>
      <Label htmlFor="chat-body">Your message</Label>
      <Textarea id="chat-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1900} rows={4} autoFocus />
      <Label htmlFor="chat-offer" optional className="mt-4">
        Make an offer
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-fg-muted">Rs</span>
        <input
          id="chat-offer"
          inputMode="numeric"
          value={offerAmount ? offerAmount.toLocaleString("en-LK") : ""}
          onChange={(e) => setOffer(e.target.value)}
          placeholder={price ? Math.round(price * 0.95).toLocaleString("en-LK") : "Your price"}
          className="block h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-3.5 text-[15px] shadow-sm placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
        />
      </div>
      {offerAmount > 0 && (
        <p className="mt-1.5 text-[13px] text-fg-muted">
          {formatLakhs(offerAmount)}
          {offerPct != null && offerPct !== 0 && ` · ${Math.abs(offerPct)}% ${offerPct > 0 ? "below" : "above"} the asking price`}
        </p>
      )}
    </Dialog>
  );
}

/**
 * Call / WhatsApp / Chat buttons. "card" for result cards, "panel" for the
 * ad sidebar, "bar" for the sticky phone bar.
 */
export function ContactActions({
  listingId,
  title,
  price,
  sellerName,
  variant = "card",
  className,
}: {
  listingId: number;
  title: string;
  price?: number;
  sellerName: string;
  variant?: "card" | "panel" | "bar";
  className?: string;
}) {
  const session = useSession();
  const [contactOpen, setContactOpen] = useState<null | "call" | "whatsapp">(null);
  const [chatOpen, setChatOpen] = useState(false);
  const signInHref = `/signin?next=${encodeURIComponent(`/ad/${listingId}`)}&reason=chat`;

  const base =
    variant === "card"
      ? "relative z-10 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 text-sm font-bold text-brand-soft-fg transition-colors hover:bg-brand hover:text-brand-fg"
      : variant === "panel"
        ? "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-[15px] font-bold transition-colors"
        : "inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border px-2 text-[15px] font-bold transition-colors";
  const primary = variant === "card" ? "" : "border-brand bg-brand text-brand-fg hover:bg-brand-hover";
  const secondary = variant === "card" ? "" : "border-brand/40 bg-surface text-brand-text hover:bg-brand-soft";

  const chat = session ? (
    <button type="button" onClick={() => setChatOpen(true)} className={cn(base, secondary, variant !== "card" && "flex-1")}>
      <MessageCircle className="size-[18px]" /> Chat
    </button>
  ) : (
    <Link href={signInHref} className={cn(base, secondary, variant !== "card" && "flex-1")}>
      <MessageCircle className="size-[18px]" /> Chat
    </Link>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button type="button" onClick={() => setContactOpen("call")} className={cn(base, primary, variant !== "card" && "flex-1")}>
        <Phone className="size-[18px]" /> Call
      </button>
      <button type="button" onClick={() => setContactOpen("whatsapp")} className={cn(base, secondary, variant !== "card" && "flex-1")} aria-label="WhatsApp">
        <WhatsAppIcon className="size-[18px]" /> <span className={cn(variant === "bar" && "max-[380px]:sr-only")}>WhatsApp</span>
      </button>
      {chat}
      <ContactDialog
        open={!!contactOpen}
        onClose={() => setContactOpen(null)}
        listingId={listingId}
        title={title}
        sellerName={sellerName}
        focus={contactOpen ?? "call"}
        onChat={session ? () => setChatOpen(true) : undefined}
      />
      <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} listingId={listingId} title={title} price={price} />
    </div>
  );
}

export function ContactPanel({ listingId, title, price, isOwner, live, sellerFirstName }: { listingId: number; title: string; price: number; isOwner: boolean; live: boolean; sellerFirstName: string }) {
  if (isOwner || !live) return null;
  return <ContactActions listingId={listingId} title={title} price={price} sellerName={sellerFirstName} variant="panel" />;
}

export function WhatsAppShare({ text, className }: { text: string; className?: string }) {
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener"
      className={cn(buttonClass({ variant: "secondary", size: "md" }), "text-[#0f7a42] dark:text-[#3ccf83]", className)}
    >
      <WhatsAppIcon className="size-[18px]" /> WhatsApp
    </a>
  );
}

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      className={cn(buttonClass({ variant: "secondary", size: "md" }), className)}
      onClick={async () => {
        const url = window.location.href.split("?")[0];
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {}
          return;
        }
        await navigator.clipboard?.writeText(url);
        toast({ tone: "success", title: "Link copied" });
      }}
    >
      <Share2 className="size-4" /> Share
    </button>
  );
}

export function ReportButton({ listingId }: { listingId: number }) {
  const session = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!session)
    return (
      <Link href={`/signin?next=${encodeURIComponent(`/ad/${listingId}`)}`} className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-danger">
        <Flag className="size-4" /> Report this ad
      </Link>
    );

  const submit = async () => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("reports").insert({ listing_id: listingId, reporter_id: session.userId, reason, details: details.trim() || null });
    setBusy(false);
    if (error) return toast({ tone: "error", title: "Couldn't send your report" });
    setDone(true);
    setOpen(false);
    toast({ tone: "success", title: "Thanks, we'll take a look", body: "Ads with several reports are hidden until a moderator reviews them." });
  };

  return (
    <>
      <button type="button" disabled={done} onClick={() => setOpen(true)} className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-danger disabled:opacity-60">
        <Flag className="size-4" /> {done ? "Reported" : "Report this ad"}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Report this ad"
        description="Tell us what's wrong. The seller won't see who reported it."
        variant="sheet"
        footer={
          <Button variant="danger" size="lg" className="w-full" disabled={!reason} loading={busy} onClick={submit}>
            Send report
          </Button>
        }
      >
        <div role="radiogroup" className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3", reason === r.value ? "border-danger bg-danger-soft" : "border-border hover:bg-surface-2")}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="size-4 accent-[var(--danger)]" />
              <span className="font-medium">{r.label}</span>
            </label>
          ))}
        </div>
        <Label htmlFor="report-details" optional className="mt-4">
          Details
        </Label>
        <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} placeholder="Anything that helps us check, e.g. the seller asked for an advance payment." />
      </Dialog>
    </>
  );
}

export function ViewTracker({ listingId, skip }: { listingId: number; skip?: boolean }) {
  useEffect(() => {
    if (skip) return;
    recordRecent(listingId);
    const key = `wahana:viewed:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    supabaseBrowser().rpc("record_view", { p_listing_id: listingId }).then(() => {});
  }, [listingId, skip]);
  return null;
}

/** Sticky bottom bar on phones. */
export function MobileContactBar({ listingId, title, price, sellerName }: { listingId: number; title: string; price: number; sellerName: string }) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-3 pt-3 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] lg:hidden">
      <div className="flex items-center gap-2">
        <FavouriteButton id={listingId} variant="plain" className="size-12 shrink-0 px-0" />
        <ContactActions listingId={listingId} title={title} price={price} sellerName={sellerName} variant="bar" className="min-w-0 flex-1" />
      </div>
    </div>
  );
}
