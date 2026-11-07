import Link from "next/link";
import { ArrowRight, Calculator, Crown, Gauge, SearchX } from "lucide-react";
import type { Facets, SearchResult } from "@/lib/types";
import type { Filters, Names } from "@/lib/search";
import { ResultCard } from "@/components/result-card";
import { formatNumber } from "@/lib/format";
import { SearchProvider, PendingArea } from "./search-context";
import { ActiveChips, SaveSearchButton, SortSelect } from "./toolbar";
import { FilterBar } from "./filter-bar";
import { Pagination } from "./pagination";
import { ClearFiltersButton } from "./clear-filters";

export type QuickLink = { href: string; label: string; count?: number };

/** Faceted results layout shared by browse pages and dealer pages. */
export function Results({
  filters,
  result,
  facets,
  names,
  title,
  hrefFor,
  base,
  hideType,
  hideSeller,
  saveLabel,
  header,
  footer,
  quickLinks,
  popular,
}: {
  filters: Filters;
  result: SearchResult;
  facets: Facets | null;
  names: Names;
  title: string;
  hrefFor: (page: number) => string;
  base?: string;
  hideType?: boolean;
  hideSeller?: boolean;
  saveLabel?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Chips under the heading to narrow the search (models, makes or towns). */
  quickLinks?: QuickLink[];
  /** Sidebar "Popular searches" links. */
  popular?: { title: string; links: QuickLink[] };
}) {
  const page = Number(filters.page || 1);
  const topIds = new Set(result.top.map((t) => t.id));
  const items = result.items.filter((i) => !topIds.has(i.id));

  return (
    <SearchProvider filters={filters} base={base ?? null}>
      <div className="sticky top-16 z-30 border-b border-border bg-surface lg:static">
        <div className="container-page py-3">
          <FilterBar facets={facets} names={names} total={result.total} hideType={hideType} hideSeller={hideSeller} saveLabel={saveLabel ?? title} />
        </div>
      </div>

      <div className="container-page pb-6 pt-4 sm:pt-6">
        {header}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[22px] font-bold sm:text-[28px]">{title}</h1>
          <p className="text-[15px] text-fg-muted">
            <span className="tabular font-bold text-fg">{formatNumber(result.total)}</span> {result.total === 1 ? "result" : "results"}
            {page > 1 && ` · page ${page}`}
          </p>
        </div>

        {quickLinks && quickLinks.length > 1 && (
          <nav aria-label="Narrow your search" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {quickLinks.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-bold text-fg hover:border-brand hover:text-brand-text"
              >
                {q.label}
                {q.count != null && <span className="tabular font-normal text-fg-subtle">({formatNumber(q.count)})</span>}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <ActiveChips names={names} />
              </div>
              <SortSelect className="ml-auto shrink-0 sm:hidden lg:inline-flex" />
            </div>
            <PendingArea>
              <h2 className="sr-only">Results</h2>
              {result.top.length > 0 && (
                <section aria-label="Top ads" className="mb-5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-accent-fg">
                    <Crown className="size-4" /> Top ads
                  </p>
                  <ul className="space-y-4">
                    {result.top.map((l) => (
                      <li key={l.id}>
                        <ResultCard l={l} eager />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {items.length > 0 ? (
                <ul className="space-y-4">
                  {items.map((l, i) => (
                    <li key={l.id}>
                      <ResultCard l={l} eager={i < 2} />
                    </li>
                  ))}
                </ul>
              ) : result.top.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
                  <span className="grid size-14 place-items-center rounded-xl bg-surface-2 text-fg-muted">
                    <SearchX className="size-7" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold">No ads match all of that</h2>
                  <p className="mt-1.5 max-w-sm text-[15px] text-fg-muted">
                    Try removing a filter or widening the price range. You can also save this search and check back later.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <ClearFiltersButton />
                    <SaveSearchButton label={saveLabel ?? title} />
                  </div>
                </div>
              ) : null}

              <Pagination page={page} total={result.total} pageSize={result.page_size} hrefFor={hrefFor} />
              {footer}
            </PendingArea>
          </div>

          <aside className="hidden space-y-5 lg:block" aria-label="More ways to search">
            {popular && popular.links.length > 0 && (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-base font-bold">{popular.title}</h2>
                <ul className="mt-3 space-y-0.5">
                  {popular.links.map((p) => (
                    <li key={p.href}>
                      <Link href={p.href} className="flex min-h-9 items-center justify-between gap-2 text-[15px] text-fg hover:text-brand-text hover:underline">
                        <span className="truncate">{p.label}</span>
                        {p.count != null && <span className="tabular text-sm text-fg-subtle">({formatNumber(p.count)})</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <Link href="/value" className="group block rounded-2xl border border-border bg-brand-soft p-5 transition hover:border-brand">
              <Gauge className="size-7 text-brand-soft-fg" />
              <p className="mt-3 text-lg font-bold text-brand-soft-fg">What&apos;s my vehicle worth?</p>
              <p className="mt-1 text-[15px] text-fg-muted">See what similar vehicles are listed for, based on live ads.</p>
              <span className="mt-3 inline-flex items-center gap-1 font-bold text-brand-soft-fg underline-offset-2 group-hover:underline">
                Check now <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link href="/leasing" className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-brand">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-fg">
                <Calculator className="size-5" />
              </span>
              <span>
                <span className="block font-bold group-hover:text-brand-text">Leasing calculator</span>
                <span className="block text-sm text-fg-muted">Estimate your monthly rental</span>
              </span>
            </Link>
          </aside>
        </div>
      </div>
    </SearchProvider>
  );
}
