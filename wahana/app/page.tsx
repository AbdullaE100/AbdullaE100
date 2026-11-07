import Link from "next/link";
import { ArrowRight, Calculator, Columns3, Gauge, Store } from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { HeroScene } from "@/components/hero-scene";
import { ListingRail, SectionHeader } from "@/components/rail";
import { BrowseTabs, type BrowseTab } from "@/components/browse-tabs";
import { RecentlyViewed } from "@/components/recently-viewed";
import { ButtonLink } from "@/components/ui/button";
import { homeSummary, searchFacets, searchListings } from "@/lib/queries";
import { VEHICLE_TYPES, typeBySlug } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export default async function HomePage() {
  const [summary, deals, latest, facets] = await Promise.all([
    homeSummary(),
    searchListings({ deal: "good", page_size: 12 }),
    searchListings({ page_size: 12 }),
    searchFacets({}),
  ]);

  const tabs: BrowseTab[] = [
    {
      id: "models",
      label: "Popular models",
      links: summary.popular_models.map((m) => ({
        href: `/${typeBySlug(m.type)?.path ?? "vehicles"}/${m.make_slug}/${m.model_slug}`,
        label: `${m.make} ${m.model}`,
        count: m.count,
      })),
    },
    { id: "makes", label: "Makes", links: (facets?.make ?? []).map((m) => ({ href: `/vehicles/${m.slug}`, label: m.name, count: m.count })) },
    {
      id: "types",
      label: "Vehicle types",
      links: VEHICLE_TYPES.filter((t) => summary.by_type[t.slug]).map((t) => ({ href: `/${t.path}`, label: t.plural, count: summary.by_type[t.slug] })),
    },
    { id: "districts", label: "Districts", links: (facets?.district ?? []).map((d) => ({ href: `/vehicles?district=${d.slug}`, label: d.name, count: d.count })) },
  ];

  const tools = [
    { href: "/value", icon: Gauge, title: "What's my vehicle worth?", body: "See what similar vehicles are listed for right now." },
    { href: "/leasing", icon: Calculator, title: "Leasing calculator", body: "Work out a monthly rental before you talk to a lender." },
    { href: "/compare", icon: Columns3, title: "Compare vehicles", body: "Put up to three ads side by side, spec by spec." },
    { href: "/dealers", icon: Store, title: "Find a dealer", body: "Browse showrooms and everything they have in stock." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <HeroScene className="absolute inset-0 -z-10 h-full w-full" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/25 to-black/50" />
        <div className="container-page flex flex-col items-center pb-10 pt-12 text-center sm:pb-20 sm:pt-20">
          <h1 className="max-w-3xl text-[28px] font-bold leading-tight text-white drop-shadow-sm sm:text-5xl">Find your next vehicle in Sri Lanka</h1>
          <p className="mt-3 max-w-2xl text-base text-white sm:text-lg">
            {formatNumber(summary.total)} cars, bikes and three-wheelers from sellers and dealers, each with a fair-price rating.
          </p>
          <div className="mt-7 w-full sm:mt-9">
            <HeroSearch counts={summary.by_type} />
          </div>
        </div>
      </section>

      <div className="container-page space-y-12 py-10 sm:space-y-16 sm:py-14">
        <RecentlyViewed />

        {deals.items.length > 0 && (
          <section aria-labelledby="deals">
            <SectionHeader
              title={<span id="deals">Good deals</span>}
              sub="Priced at least 5% below similar ads of the same model, condition and year."
              href="/vehicles?deal=good"
              linkLabel={`View all ${formatNumber(summary.good_deals)}`}
            />
            <ListingRail items={deals.items} eager={2} label="Good deals" />
          </section>
        )}

        <section aria-labelledby="browse">
          <SectionHeader title={<span id="browse">Browse vehicles</span>} />
          <BrowseTabs tabs={tabs} />
        </section>

        <section aria-labelledby="latest">
          <SectionHeader title={<span id="latest">Recently added</span>} sub="The newest ads from private sellers and dealers." href="/vehicles" linkLabel="View all" />
          <ListingRail items={latest.items} label="Recently added" />
        </section>

        <section aria-labelledby="tools">
          <SectionHeader title={<span id="tools">Explore more on Wahana</span>} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map(({ href, icon: I, title, body }) => (
              <li key={href}>
                <Link href={href} className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition hover:border-brand hover:shadow-md">
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-soft-fg">
                    <I className="size-6" />
                  </span>
                  <span className="mt-4 text-lg font-bold group-hover:text-brand-text">{title}</span>
                  <span className="mt-1 text-[15px] text-fg-muted">{body}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[15px] font-bold text-brand-text">
                    Open <ArrowRight className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Sell banner */}
      <section className="bg-brand text-brand-fg">
        <div className="container-page flex flex-col items-start gap-6 py-10 sm:py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Selling your vehicle?</h2>
            <p className="mt-2 text-white">Post your ad free in a few minutes. We&apos;ll show you what similar vehicles are listed for before you set a price.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/sell" variant="secondary" size="lg" className="border-transparent text-brand-text">
              Post an ad free
            </ButtonLink>
            <ButtonLink href="/value" size="lg" className="bg-black/25 text-white shadow-none hover:bg-black/35">
              Value my vehicle
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
