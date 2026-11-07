"use client";
import { useState } from "react";
import { ArrowUp, Crown, Zap, Check, Lock, Info } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { PromotionProduct } from "@/lib/types";
import { formatLKR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const ICON = { bump: ArrowUp, top: Crown, urgent: Zap };
const BLURB: Record<string, string> = {
  bump: "Your ad jumps back to the top of the newest ads, as if you posted it today.",
  top: "Pinned above the results whenever someone searches for a vehicle like yours, with a Top ad badge.",
  urgent: "A red Urgent tag that catches the eye of buyers ready to move quickly.",
};

export function PromotePicker({ listingId, products }: { listingId: number; products: PromotionProduct[] }) {
  const { toast } = useToast();
  const [choice, setChoice] = useState(products.find((p) => p.slug === "top-7")?.slug ?? products[0]?.slug);
  const [busy, setBusy] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const product = products.find((p) => p.slug === choice);

  const pay = async () => {
    if (!product) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().functions.invoke("payhere-checkout", { body: { listing_id: listingId, product: product.slug } });
    if (error) {
      setBusy(false);
      let status = 0;
      let message = "";
      if (error instanceof FunctionsHttpError) {
        status = error.context.status;
        message = (await error.context.json().catch(() => ({})))?.error ?? "";
      }
      if (!status || status === 404 || status === 503 || message === "payments_not_configured") return setNotReady(true);
      return toast({ tone: "error", title: message || "Couldn't start the payment" });
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.action;
    for (const [k, v] of Object.entries(data.fields as Record<string, string>)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="mt-6">
      <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const I = ICON[p.kind] ?? Crown;
          const on = p.slug === choice;
          return (
            <label key={p.slug} className="relative">
              <input type="radio" name="product" className="peer sr-only" checked={on} onChange={() => setChoice(p.slug)} />
              <span className={cn("flex h-full cursor-pointer flex-col rounded-2xl border-2 bg-surface p-5 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--ring)]", on ? "border-brand" : "border-border hover:border-border-strong")}>
                <span className="flex items-start justify-between gap-3">
                  <span className={cn("grid size-11 place-items-center rounded-xl", p.kind === "top" ? "bg-accent-soft text-accent-fg" : p.kind === "urgent" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-soft-fg")}>
                    <I className="size-5" />
                  </span>
                  <span className={cn("grid size-6 place-items-center rounded-full border-2", on ? "border-brand bg-brand text-brand-fg" : "border-border-strong")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                </span>
                <span className="mt-4 font-bold">{p.name}</span>
                <span className="tabular mt-0.5 text-2xl font-extrabold">{formatLKR(p.price_lkr)}</span>
                <span className="mt-2 text-sm text-fg-muted">{BLURB[p.kind] ?? p.description}</span>
                {p.kind !== "bump" && <span className="mt-2 text-xs font-medium text-fg-subtle">Includes a bump to the top.</span>}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-6 flex flex-col items-stretch gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-fg-muted">
          <p className="flex items-center gap-2">
            <Lock className="size-4" /> Pay securely by card, eZ Cash or mCash through PayHere.
          </p>
          <p className="mt-1 text-xs">
            By paying you agree to our{" "}
            <a href="/terms" className="font-medium underline">
              terms
            </a>{" "}
            and{" "}
            <a href="/refunds" className="font-medium underline">
              refund policy
            </a>
            .
          </p>
        </div>
        <Button size="lg" onClick={pay} loading={busy} disabled={!product}>
          Pay {product ? formatLKR(product.price_lkr) : ""}
        </Button>
      </div>
      <Dialog
        open={notReady}
        onClose={() => setNotReady(false)}
        title="Online payments are coming soon"
        description="Boosts will be available as soon as card payments are switched on. Your ad is still live and showing in search."
        footer={
          <Button className="w-full sm:w-auto" onClick={() => setNotReady(false)}>
            Got it
          </Button>
        }
      >
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm text-fg-muted">
          <Info className="mt-0.5 size-4 shrink-0" /> Tip: ads with clear photos and a fair price get most of their enquiries in the first week, even without a boost.
        </p>
      </Dialog>
    </div>
  );
}
