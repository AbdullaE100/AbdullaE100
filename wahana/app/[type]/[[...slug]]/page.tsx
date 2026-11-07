import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Results } from "@/components/browse/results";
import { describeSearch, filtersToHref, filtersToRpc, parseFilters, type Filters, type Names } from "@/lib/search";
import { resolveNames } from "@/lib/ref";
import { searchFacets, searchListings } from "@/lib/queries";
import { typeBySlug } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

type Props = { params: Promise<{ type: string; slug?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(props: Props) {
  const { type, slug = [] } = await props.params;
  const f = parseFilters(type, slug, await props.searchParams);
  if (!f) notFound();
  const r = await resolveNames(f);
  if ((f.make && !r.make) || (f.model && !r.model)) notFound();
  const names: Names = { make: r.make?.name, model: r.model?.name, district: r.district?.name, city: r.city?.name };
  return { f, names };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { f, names } = await load(props);
  const { title } = describeSearch(f, names);
  const canonical = filtersToHref({ type: f.type, make: f.make, model: f.model, district: f.district, city: f.city, condition: f.condition });
  const filtered = Object.keys(f).some((k) => !["type", "make", "model", "district", "city", "condition"].includes(k));
  return {
    title,
    description: `Browse ${title.toLowerCase()}. Compare prices with our fair-price rating, chat with sellers, and find a good deal near you.`,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BrowsePage(props: Props) {
  const { f, names } = await load(props);
  const rpc = filtersToRpc(f);
  const [result, facets] = await Promise.all([searchListings(rpc), searchFacets(rpc)]);
  const { title } = describeSearch(f, names);
  const t = typeBySlug(f.type);

  const crumbs: { label: string; href: string }[] = [{ label: "Home", href: "/" }];
  if (t) crumbs.push({ label: t.plural, href: filtersToHref({ type: f.type }) });
  else crumbs.push({ label: "All vehicles", href: "/vehicles" });
  if (f.make && names.make) crumbs.push({ label: names.make, href: filtersToHref({ type: f.type, make: f.make }) });
  if (f.model && names.model) crumbs.push({ label: names.model, href: filtersToHref({ type: f.type, make: f.make, model: f.model }) });

  const related = f.make && !f.model ? facets?.model?.slice(0, 12) : !f.make ? facets?.make?.slice(0, 12) : null;

  return (
    <Results
      filters={f}
      result={result}
      facets={facets}
      names={names}
      title={title}
      hrefFor={(page) => filtersToHref({ ...f, page: page > 1 ? String(page) : undefined } as Filters)}
      header={
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-fg-muted">
          <ol className="flex flex-wrap items-center gap-1">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="font-medium text-fg">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="inline-flex min-h-7 items-center hover:text-fg hover:underline">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      }
      footer={
        related && related.length > 1 ? (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-bold">{f.make ? `Popular ${names.make} models` : `Popular makes${t ? ` for ${t.plural.toLowerCase()}` : ""}`}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {related.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={filtersToHref(f.make ? { type: f.type, make: f.make, model: m.slug } : { type: f.type, make: m.slug })}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[15px] font-medium hover:border-border-strong hover:bg-surface-2"
                  >
                    {m.name} <span className="tabular text-sm font-normal text-fg-subtle">{formatNumber(m.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null
      }
    />
  );
}
