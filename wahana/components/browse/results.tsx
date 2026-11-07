import { Crown, SearchX } from "lucide-react";
import type { Facets, SearchResult } from "@/lib/types";
import type { Filters, Names } from "@/lib/search";
import { ListingCard } from "@/components/listing-card";
import { formatNumber } from "@/lib/format";
import { SearchProvider, PendingArea } from "./search-context";
import { FilterPanel } from "./filter-panel";
import { ActiveChips, MobileFilters, SaveSearchButton, SortSelect } from "./toolbar";
import { Pagination } from "./pagination";
import { ClearFiltersButton } from "./clear-filters";

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
}) {
  const page = Number(filters.page || 1);
  const topIds = new Set(result.top.map((t) => t.id));
  const items = result.items.filter((i) => !topIds.has(i.id));

  return (
    <SearchProvider filters={filters} base={base ?? null}>
      <div className="container-page pb-6 pt-5 sm:pt-8">
        {header}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
            <p className="mt-1 text-[15px] text-fg-muted">
              <span className="tabular font-semibold text-fg">{formatNumber(result.total)}</span> {result.total === 1 ? "ad" : "ads"}
              {page > 1 && ` · page ${page}`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-[7.5rem] max-h-[calc(100dvh-8.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="sr-only">Filters</h2>
              <FilterPanel facets={facets} names={names} hideType={hideType} hideSeller={hideSeller} />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mb-5 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <div className="flex items-center gap-2">
                <MobileFilters facets={facets} names={names} total={result.total} hideType={hideType} hideSeller={hideSeller} />
                <div className="hidden min-w-0 flex-1 lg:block">
                  <ActiveChips names={names} />
                </div>
                <SortSelect className="ml-auto shrink-0" />
                <SaveSearchButton label={saveLabel ?? title} compact />
              </div>
              <div className="mt-2.5 empty:hidden lg:hidden">
                <ActiveChips names={names} />
              </div>
            </div>
          <PendingArea>
            <h2 className="sr-only">Results</h2>
            {result.top.length > 0 && (
              <section aria-label="Top ads" className="mb-6 rounded-3xl border border-accent/40 bg-accent-soft/40 p-3 sm:p-4">
                <p className="mb-3 flex items-center gap-1.5 px-1 text-sm font-semibold text-accent-fg">
                  <Crown className="size-4" /> Top ads
                </p>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {result.top.map((l) => (
                    <ListingCard key={l.id} l={l} layout="responsive" eager />
                  ))}
                </div>
              </section>
            )}

            {items.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {items.map((l, i) => (
                  <li key={l.id} className="contents">
                    <ListingCard l={l} layout="responsive" eager={i < 3} />
                  </li>
                ))}
              </ul>
            ) : result.top.length === 0 ? (
              <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-fg-muted">
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
        </div>
      </div>
    </SearchProvider>
  );
}
