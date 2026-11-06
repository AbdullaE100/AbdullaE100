"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Share2, Flag, Check, Copy } from "lucide-react";
import { useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import { displayLkPhone } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/constants";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { FavouriteButton } from "@/components/favourite-button";
import { cn } from "@/lib/cn";

type Contact = { phone: string; whatsapp: string | null; seller_name: string | null } | "none" | null;

function WhatsAppIcon({ className }: { className?: string }) {
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

export function ContactPanel({ listingId, title, isOwner, live, sellerFirstName }: { listingId: number; title: string; isOwner: boolean; live: boolean; sellerFirstName: string }) {
  const { contact, busy, reveal } = useReveal(listingId);
  const [copied, setCopied] = useState(false);

  if (isOwner || !live) return null;

  return (
    <div className="space-y-2.5">
      {contact && contact !== "none" ? (
        <div className="rounded-2xl border border-good/30 bg-good-soft p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-good">{contact.seller_name || sellerFirstName}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <a href={`tel:${contact.phone}`} className="tabular text-xl font-bold tracking-tight text-fg hover:underline">
              {displayLkPhone(contact.phone)}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(contact.phone).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="grid size-9 place-items-center rounded-lg text-fg-muted hover:bg-surface/60"
              aria-label="Copy number"
            >
              {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`tel:${contact.phone}`} className={buttonClass({ variant: "primary", size: "md", className: "w-full" })}>
              <Phone className="size-4" /> Call
            </a>
            <a href={waLink(contact.whatsapp || contact.phone, title)} target="_blank" rel="noopener" className={buttonClass({ variant: "secondary", size: "md", className: "w-full text-[#128c4b]" })}>
              <WhatsAppIcon className="size-[18px]" /> WhatsApp
            </a>
          </div>
        </div>
      ) : contact === "none" ? (
        <div className="rounded-2xl border border-border bg-surface-2 p-3.5 text-sm text-fg-muted">This seller hasn&apos;t shared a phone number. Send them a message instead.</div>
      ) : (
        <Button size="lg" className="w-full" onClick={reveal} loading={busy}>
          {!busy && <Phone className="size-[18px]" />} Show phone number
        </Button>
      )}
      <ChatButton listingId={listingId} title={title} variant={contact && contact !== "none" ? "secondary" : contact === "none" ? "primary" : "secondary"} />
    </div>
  );
}

const QUICK_REPLIES = ["Is it still available?", "What's your best price?", "Can I see it this weekend?", "Is the CR book clear?", "Any accident repairs?"];

export function ChatButton({ listingId, title, variant = "secondary", className, compact }: { listingId: number; title: string; variant?: "primary" | "secondary"; className?: string; compact?: boolean }) {
  const session = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(`Hi, is your ${title} still available?`);
  const [busy, setBusy] = useState(false);

  if (!session)
    return (
      <ButtonLink href={`/signin?next=${encodeURIComponent(`/ad/${listingId}`)}&reason=chat`} variant={variant} size="lg" className={cn("w-full", className)}>
        <MessageCircle className="size-[18px]" /> {compact ? "Chat" : "Message seller"}
      </ButtonLink>
    );

  const send = async () => {
    setBusy(true);
    const { data, error } = await supabaseBrowser().rpc("start_conversation", { p_listing_id: listingId, p_body: body });
    setBusy(false);
    if (error || !data) {
      toast({ tone: "error", title: error?.message || "Couldn't send your message" });
      return;
    }
    setOpen(false);
    router.push(`/messages/${data}`);
  };

  return (
    <>
      <Button variant={variant} size="lg" className={cn("w-full", className)} onClick={() => setOpen(true)}>
        <MessageCircle className="size-[18px]" /> {compact ? "Chat" : "Message seller"}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
        <Textarea id="chat-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4} autoFocus />
      </Dialog>
    </>
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
      <Link href={`/signin?next=${encodeURIComponent(`/ad/${listingId}`)}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-danger">
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
      <button type="button" disabled={done} onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-danger disabled:opacity-60">
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
export function MobileContactBar({ listingId, title }: { listingId: number; title: string; price?: string }) {
  const { contact, busy, reveal } = useReveal(listingId);
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2">
        <FavouriteButton id={listingId} variant="plain" className="size-12 shrink-0 px-0" />
        {contact && contact !== "none" ? (
          <a href={`tel:${contact.phone}`} className={buttonClass({ variant: "primary", size: "lg", className: "flex-1 basis-0" })}>
            <Phone className="size-[18px]" /> {displayLkPhone(contact.phone)}
          </a>
        ) : contact === "none" ? null : (
          <Button size="lg" onClick={reveal} loading={busy} className="flex-1 basis-0">
            {!busy && <Phone className="size-[18px]" />} Call
          </Button>
        )}
        <div className="flex-1 basis-0">
          <ChatButton listingId={listingId} title={title} compact variant={contact === "none" ? "primary" : "secondary"} />
        </div>
      </div>
      {contact === "none" && <p className="mt-2 text-xs text-fg-muted">No phone number shared. Message the seller instead.</p>}
    </div>
  );
}
