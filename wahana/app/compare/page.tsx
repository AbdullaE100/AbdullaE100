import type { Metadata } from "next";
import Link from "next/link";
import { Columns3, Check, Minus, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/env";
import { ALL_BODY_LABELS, CONDITIONS, FUELS, TRANSMISSIONS, label } from "@/lib/constants";
import { formatDate, formatKm, formatLKR, formatNumber } from "@/lib/format";
import { DealBadge } from "@/components/deal-badge";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecentlyViewed } from "@/components/recently-viewed";
import { cn } from "@/lib/cn";
import { RemoveColumn, SyncCompare } from "./actions";

export const metadata: Metadata = { title: "Compare vehicles", robots: { index: false } };

const SELECT = `id, slug, title, vehicle_type, status, price_lkr, negotiable, condition, year_manufactured, year_registered, mileage_km, engine_cc,
  fuel, transmission, body_type, colour, previous_owners, features, leasing_available, price_rating, market_median_lkr, market_peer_count,
  cover_photo, cover_thumb, published_at,
  district:districts(name), city:cities(name),
  seller:profiles!listings_seller_id_fkey(account_type, dealer_name, display_name)`;

type Row = { label: string; values: React.ReactNode[]; best?: number[] };

function bestIndexes(nums: (number | null)[], mode: "min" | "max") {
  const valid = nums.filter((n): n is number => n != null);
  if (valid.length < 2) return [];
  const target = mode === "min" ? Math.min(...valid) : Math.max(...valid);
  if (valid.every((n) => n === target)) return [];
  return nums.map((n, i) => (n === target ? i : -1)).filter((i) => i >= 0);
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: raw } = await searchParams;
  const ids = [...new Set((raw ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 3);
  const db = await createClient();
  const { data } = ids.length ? await db.from("listings").select(SELECT).in("id", ids) : { data: [] };
  const list = ids.map((id) => (data ?? []).find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);

  if (list.length === 0) {
    return (
      <div className="container-page py-8 sm:py-12">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Compare vehicles</h1>
        <EmptyState
          icon={Columns3}
          title="Pick up to three vehicles"
          body="Tap Compare on any ad to see prices, mileage, features and price ratings side by side."
          action={<ButtonLink href="/vehicles">Browse vehicles</ButtonLink>}
        />
        <RecentlyViewed className="mt-12" />
      </div>
    );
  }

  const shown = list.map((l) => l.id);
  const allFeatures = [...new Set(list.flatMap((l) => l.features ?? []))].sort();
  const sellerName = (l: (typeof list)[number]) => (l.seller?.account_type === "dealer" ? l.seller.dealer_name : l.seller?.display_name) || "Private seller";

  const rows: Row[] = [
    { label: "Price", values: list.map((l) => <span key={l.id} className="tabular font-bold">{formatLKR(l.price_lkr)}{l.negotiable && <span className="block text-xs font-medium text-fg-subtle">Negotiable</span>}</span>), best: bestIndexes(list.map((l) => l.price_lkr), "min") },
    { label: "Price rating", values: list.map((l) => (l.price_rating ? <DealBadge key={l.id} rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} /> : <span key={l.id} className="text-fg-subtle">Not rated yet</span>)) },
    { label: "Year made", values: list.map((l) => l.year_manufactured), best: bestIndexes(list.map((l) => l.year_manufactured), "max") },
    { label: "Registered", values: list.map((l) => l.year_registered ?? (l.condition === "used" ? "—" : "Not yet")) },
    { label: "Mileage", values: list.map((l) => (l.mileage_km != null ? formatKm(l.mileage_km) : "—")), best: bestIndexes(list.map((l) => l.mileage_km), "min") },
    { label: "Condition", values: list.map((l) => label(CONDITIONS, l.condition)) },
    { label: "Fuel", values: list.map((l) => (l.fuel ? label(FUELS, l.fuel) : "—")) },
    { label: "Transmission", values: list.map((l) => (l.transmission ? label(TRANSMISSIONS, l.transmission) : "—")) },
    { label: "Engine", values: list.map((l) => (l.engine_cc ? `${formatNumber(l.engine_cc)} cc` : "—")) },
    { label: "Body", values: list.map((l) => (l.body_type ? ALL_BODY_LABELS[l.body_type] ?? l.body_type : "—")) },
    { label: "Colour", values: list.map((l) => l.colour ?? "—") },
    { label: "Previous owners", values: list.map((l) => (l.previous_owners == null ? "—" : l.previous_owners === 0 ? "None" : l.previous_owners)), best: bestIndexes(list.map((l) => l.previous_owners), "min") },
    { label: "Location", values: list.map((l) => [l.city?.name, l.district?.name].filter(Boolean).join(", ")) },
    { label: "Seller", values: list.map((l) => `${sellerName(l)}${l.seller?.account_type === "dealer" ? " (dealer)" : ""}`) },
    { label: "Leasing", values: list.map((l) => (l.leasing_available ? "Available" : "—")) },
    { label: "Listed", values: list.map((l) => formatDate(l.published_at)) },
  ];

  const cols = list.length;
  return (
    <div className="container-page py-6 sm:py-10">
      <SyncCompare ids={shown} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Compare vehicles</h1>
          <p className="mt-1 text-fg-muted">
            <Trophy className="mr-1 inline size-4 text-good" aria-hidden />
            Green marks the best value in each row.
          </p>
        </div>
        {cols < 3 && (
          <ButtonLink href="/vehicles" variant="secondary">
            Add another vehicle
          </ButtonLink>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0 text-left text-sm sm:text-[15px]" style={{ minWidth: `${5 + cols * 8.5}rem` }}>
          <caption className="sr-only">Side-by-side comparison of {cols} vehicles</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-24 bg-bg align-bottom sm:w-44">
                <span className="sr-only">Detail</span>
              </th>
              {list.map((l) => {
                const src = photoUrl(l.cover_thumb ?? l.cover_photo);
                return (
                  <th key={l.id} scope="col" className="px-1 pb-3 align-top font-normal sm:px-2" style={{ width: `${100 / cols}%` }}>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
                      <RemoveColumn id={l.id} ids={shown} title={l.title} />
                      <div className="relative aspect-[4/3] bg-surface-2 sm:aspect-[16/10]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <VehiclePlaceholder type={l.vehicle_type} seed={l.id} />}
                      </div>
                      <div className="p-2.5 sm:p-3">
                        {l.status !== "active" && <Badge tone="high" className="mb-1.5">{l.status === "sold" ? "Sold" : "No longer live"}</Badge>}
                        <Link href={`/ad/${l.id}/${l.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:underline sm:text-[15px]">
                          {l.title}
                        </Link>
                        <p className="tabular mt-1 text-[15px] font-extrabold sm:text-lg">{formatLKR(l.price_lkr)}</p>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="sticky left-0 z-10 border-t border-border bg-bg py-3 pr-2 align-top text-[13px] font-semibold text-fg-muted sm:pr-3 sm:text-sm">
                  {r.label}
                </th>
                {r.values.map((v, i) => {
                  const best = r.best?.includes(i);
                  return (
                    <td key={i} className={cn("border-t border-border px-2 py-3 align-top sm:px-3", best && "bg-good-soft/60")}>
                      <span className={cn(best && "font-semibold text-good")}>{v}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {allFeatures.length > 0 && (
              <>
                <tr>
                  <th colSpan={cols + 1} scope="colgroup" className="pb-2 pt-8 text-lg font-bold">
                    Features
                  </th>
                </tr>
                {allFeatures.map((f) => (
                  <tr key={f}>
                    <th scope="row" className="sticky left-0 z-10 border-t border-border bg-bg py-2.5 pr-2 text-[13px] font-medium text-fg-muted sm:pr-3 sm:text-sm">
                      {f}
                    </th>
                    {list.map((l) => (
                      <td key={l.id} className="border-t border-border px-2 py-2.5 sm:px-3">
                        {l.features?.includes(f) ? <Check className="size-5 text-good" aria-label="Yes" /> : <Minus className="size-5 text-fg-subtle" aria-label="No" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
