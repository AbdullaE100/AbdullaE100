import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, Store } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import { getRef } from "@/lib/ref";
import { formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Vehicle dealers in Sri Lanka",
  description: "Browse vehicle dealers across Sri Lanka and see every car, van and bike they have for sale.",
};

export default async function DealersPage() {
  const db = createPublicClient();
  const [{ data: dealers }, ref] = await Promise.all([
    db.from("profiles").select("id, dealer_name, dealer_slug, dealer_about, district_id, created_at").eq("account_type", "dealer").not("dealer_slug", "is", null).order("dealer_name").limit(200),
    getRef(),
  ]);
  const ids = (dealers ?? []).map((d) => d.id);
  const { data: rows } = ids.length ? await db.from("listings").select("seller_id").eq("status", "active").in("seller_id", ids).limit(10000) : { data: [] };
  const counts = new Map<string, number>();
  for (const r of rows ?? []) counts.set(r.seller_id, (counts.get(r.seller_id) ?? 0) + 1);
  const list = (dealers ?? []).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));

  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Dealers</h1>
      <p className="mt-1 text-fg-muted">Showrooms and traders selling on Wahana.</p>
      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Store} title="No dealers yet" body="Dealers can switch their account type in Profile and settings to get a page here." />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => {
            const district = ref.districts.find((x) => x.id === d.district_id);
            return (
              <li key={d.id}>
                <Link href={`/dealers/${d.dealer_slug}`} className="flex h-full gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:border-border-strong hover:shadow-md">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg font-bold text-brand-soft-fg">{(d.dealer_name ?? "?").charAt(0)}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="truncate">{d.dealer_name}</span> <BadgeCheck className="size-4 shrink-0 text-brand-text" />
                    </span>
                    <span className="mt-0.5 flex items-center gap-3 text-sm text-fg-muted">
                      <span>{formatNumber(counts.get(d.id) ?? 0)} live ads</span>
                      {district && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {district.name}
                        </span>
                      )}
                    </span>
                    {d.dealer_about && <span className="mt-1.5 line-clamp-2 block text-sm text-fg-subtle">{d.dealer_about}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
