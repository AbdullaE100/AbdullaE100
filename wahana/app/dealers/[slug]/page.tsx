import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, ChevronRight, Calendar } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import { getRef, resolveNames } from "@/lib/ref";
import { searchFacets, searchListings } from "@/lib/queries";
import { filtersToRpc, parseFilters, type Filters } from "@/lib/search";
import { Results } from "@/components/browse/results";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function getDealer(slug: string) {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const { data } = await createPublicClient().from("profiles").select("id, dealer_name, dealer_slug, dealer_about, dealer_address, district_id, created_at").eq("dealer_slug", slug).eq("account_type", "dealer").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDealer((await params).slug);
  if (!d) return {};
  return { title: `${d.dealer_name}: vehicles for sale`, description: d.dealer_about?.slice(0, 160) ?? `Every vehicle ${d.dealer_name} has for sale on Wahana.` };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DealerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const d = await getDealer(slug);
  if (!d) notFound();
  const sp = await searchParams;
  const f = parseFilters("vehicles", [], sp)!;
  for (const k of ["type", "make", "model"] as const) {
    const v = one(sp[k]);
    if (v && /^[a-z0-9-]{1,60}$/.test(v)) f[k] = v;
  }
  const rpc = filtersToRpc(f, { seller: d.id });
  const [result, facets, r, ref] = await Promise.all([searchListings(rpc), searchFacets(rpc), resolveNames(f), getRef()]);
  const district = ref.districts.find((x) => x.id === d.district_id);
  const base = `/dealers/${d.dealer_slug}`;
  const href = (page: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...f, page: page > 1 ? String(page) : undefined } as Filters)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <Results
      filters={f}
      result={result}
      facets={facets}
      names={{ make: r.make?.name, model: r.model?.name, district: r.district?.name, city: r.city?.name }}
      title={`${d.dealer_name}`}
      saveLabel={`${d.dealer_name} stock`}
      base={base}
      hideSeller
      hrefFor={href}
      header={
        <div className="mb-6">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-fg-muted">
            <Link href="/dealers" className="inline-flex min-h-7 items-center hover:text-fg hover:underline">
              Dealers
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-fg">{d.dealer_name}</span>
          </nav>
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-start sm:p-6">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-extrabold text-brand-fg">{(d.dealer_name ?? "?").charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-text">
                <BadgeCheck className="size-4" /> Dealer
              </p>
              {d.dealer_about && <p className="mt-2 max-w-2xl whitespace-pre-line text-[15px] text-fg-muted">{d.dealer_about}</p>}
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-muted">
                {(d.dealer_address || district) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {[d.dealer_address, district?.name].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" /> On Wahana since {new Date(d.created_at).getFullYear()}
                </span>
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}
