import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPromotionProducts } from "@/lib/ref";
import { formatDate, formatLKR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { PromotePicker } from "./picker";

export const metadata: Metadata = { title: "Boost your ad", robots: { index: false } };

export default async function PromotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cancelled?: string }> }) {
  const { id } = await params;
  const { cancelled } = await searchParams;
  if (!/^\d{1,12}$/.test(id)) notFound();
  const user = await requireUser(`/account/promote/${id}`);
  const db = await createClient();
  const [{ data: l }, products, { data: history }] = await Promise.all([
    db.from("listings").select("id, slug, title, status, promoted_until, urgent_until, price_lkr").eq("id", Number(id)).eq("seller_id", user.id).maybeSingle(),
    getPromotionProducts(),
    db.from("promotions").select("id, product_slug, amount_lkr, status, created_at, paid_at").eq("listing_id", Number(id)).order("created_at", { ascending: false }).limit(10),
  ]);
  if (!l) notFound();
  const now = new Date();
  const topUntil = l.promoted_until && new Date(l.promoted_until) > now ? l.promoted_until : null;
  const urgentUntil = l.urgent_until && new Date(l.urgent_until) > now ? l.urgent_until : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/account/ads" className="mb-3 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
        <ArrowLeft className="size-4" /> My ads
      </Link>
      <h1 className="text-2xl font-bold sm:text-3xl">Boost your ad</h1>
      <p className="mt-1 text-fg-muted">
        <Link href={`/ad/${l.id}/${l.slug}`} className="font-medium text-fg hover:underline">
          {l.title}
        </Link>{" "}
        · {formatLKR(l.price_lkr)}
      </p>
      {(topUntil || urgentUntil) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {topUntil && <Badge tone="solid-accent">Top ad until {formatDate(topUntil)}</Badge>}
          {urgentUntil && <Badge tone="solid-danger">Urgent until {formatDate(urgentUntil)}</Badge>}
        </div>
      )}
      {cancelled && <p className="mt-4 rounded-xl border border-border bg-surface-2 p-3 text-sm">Payment cancelled. You haven&apos;t been charged.</p>}

      {l.status !== "active" ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-fg-muted">Only live ads can be boosted. Relist it from My ads first.</p>
      ) : (
        <PromotePicker listingId={l.id} products={products} />
      )}

      {history && history.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Past boosts</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{products.find((p) => p.slug === h.product_slug)?.name ?? h.product_slug}</span>
                  <span className="text-fg-muted"> · {formatDate(h.created_at)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular">{formatLKR(h.amount_lkr)}</span>
                  <Badge tone={h.status === "paid" ? "good" : h.status === "pending" ? "neutral" : "danger"}>{h.status === "paid" ? "Paid" : h.status === "pending" ? "Not completed" : h.status}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
