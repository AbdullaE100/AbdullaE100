import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle, Scale, Sparkles, TrendingDown, Calculator } from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { ListingRail, SectionHeader } from "@/components/rail";
import { ListingCard } from "@/components/listing-card";
import { VehicleArt } from "@/components/vehicle-art";
import { ButtonLink } from "@/components/ui/button";
import { homeSummary, searchFacets, searchListings } from "@/lib/queries";
import { VEHICLE_TYPES, typeBySlug } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export default async function HomePage() {
  const [summary, deals, latest, facets] = await Promise.all([
    homeSummary(),
    searchListings({ deal: "good", page_size: 8 }),
    searchListings({ page_size: 8 }),
    searchFacets({}),
  ]);

  const types = VEHICLE_TYPES.filter((t) => (summary.by_type[t.slug] ?? 0) > 0);
  const districts = (facets?.district ?? []).slice(0, 16);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 85% 0%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 70%), radial-gradient(50% 60% at 0% 100%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)",
          }}
        />
        <div className="container-page relative pb-8 pt-6 sm:pb-14 sm:pt-14">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-[13px] font-semibold text-fg-muted shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-good" aria-hidden />
              {formatNumber(summary.total)} vehicles for sale right now
            </p>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Find the right vehicle <span className="text-brand-text">at the right price.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:mt-4 sm:text-lg">
              Cars, SUVs, bikes and three-wheelers from across Sri Lanka. Every ad is checked against similar ads, so you can spot a fair deal at a glance.
            </p>
          </div>
          <div className="mt-7 sm:mt-9">
            <HeroSearch counts={summary.by_type} />
          </div>
          {summary.popular_models.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-medium text-fg-subtle">Popular:</span>
              {summary.popular_models.slice(0, 8).map((m) => (
                <Link
                  key={`${m.type}-${m.make_slug}-${m.model_slug}`}
                  href={`/${typeBySlug(m.type)?.path ?? "vehicles"}/${m.make_slug}/${m.model_slug}`}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium shadow-sm hover:border-border-strong hover:bg-surface-2"
                >
                  {m.make} {m.model}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container-page space-y-14 py-10 sm:space-y-16 sm:py-14">
        {/* Types */}
        <section aria-labelledby="types">
          <SectionHeader title={<span id="types">Browse by type</span>} />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {types.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.path}`}
                className="group flex w-36 shrink-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md sm:w-auto"
              >
                <VehicleArt type={t.slug} className="h-12 w-24 text-fg-muted transition-colors [--art-bg:var(--surface)] group-hover:text-brand-text" />
                <span className="mt-3 font-semibold">{t.plural}</span>
                <span className="tabular text-sm text-fg-subtle">{formatNumber(summary.by_type[t.slug] ?? 0)} ads</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Good deals */}
        {deals.items.length > 0 && (
          <section aria-labelledby="deals">
            <SectionHeader
              title={
                <span id="deals" className="inline-flex items-center gap-2">
                  <TrendingDown className="size-6 text-good" /> Good deals right now
                </span>
              }
              sub="Priced at least 5% below similar ads of the same model, condition and year."
              href="/vehicles?deal=good"
              linkLabel={`All ${formatNumber(summary.good_deals)}`}
            />
            <ListingRail items={deals.items} eager={2} />
          </section>
        )}

        {/* Value props */}
        <section className="grid gap-4 md:grid-cols-3" aria-label="Why people use us">
          {[
            {
              icon: Scale,
              title: "Know a fair price",
              body: "Each ad is compared with live ads for the same model, year and condition, and gets a Good, Fair or Above market tag.",
            },
            {
              icon: MessageCircle,
              title: "Chat before you call",
              body: "Message sellers in the app. Your number stays private until you choose to share it.",
            },
            {
              icon: BadgeCheck,
              title: "Free to sell",
              body: "Post an ad in a few minutes. We show you what similar vehicles are listed for before you set a price.",
            },
          ].map(({ icon: I, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-soft-fg">
                <I className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-fg-muted">{body}</p>
            </div>
          ))}
        </section>

        {/* Latest */}
        <section aria-labelledby="latest">
          <SectionHeader title={<span id="latest">Just listed</span>} sub="The newest ads from private sellers and dealers." href="/vehicles" />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {latest.items.map((l) => (
              <ListingCard key={l.id} l={l} layout="responsive" />
            ))}
          </div>
        </section>

        {/* Sell CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-brand px-6 py-10 text-brand-fg sm:px-10 sm:py-12">
          <div aria-hidden className="absolute -right-10 bottom-0 hidden w-[46%] opacity-20 md:block">
            <VehicleArt type="suv" className="w-full text-white [--art-bg:var(--brand)]" />
          </div>
          <div className="relative max-w-xl">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <Sparkles className="size-4" /> Selling a vehicle?
            </p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Post your ad free, priced right from day one.</h2>
            <p className="mt-3 text-white/85">
              Add photos from your phone, and we&apos;ll show you the going rate for your model before you publish. Buyers can message you without seeing your number.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/sell" variant="secondary" size="lg" className="border-transparent">
                Post an ad <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/value" size="lg" className="bg-white/15 text-white shadow-none hover:bg-white/25">
                What&apos;s my vehicle worth?
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Popular models & districts */}
        <section className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title="Popular models" />
            <ul className="grid grid-cols-2 gap-2">
              {summary.popular_models.map((m) => (
                <li key={`${m.type}-${m.make_slug}-${m.model_slug}`}>
                  <Link
                    href={`/${typeBySlug(m.type)?.path ?? "vehicles"}/${m.make_slug}/${m.model_slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] hover:border-border-strong hover:bg-surface-2"
                  >
                    <span className="truncate font-medium">
                      {m.make} {m.model}
                    </span>
                    <span className="tabular shrink-0 text-sm text-fg-subtle">{m.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader title="Browse by district" />
            <ul className="flex flex-wrap gap-2">
              {districts.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/vehicles?district=${d.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[15px] font-medium hover:border-border-strong hover:bg-surface-2"
                  >
                    {d.name}
                    <span className="tabular text-sm font-normal text-fg-subtle">{d.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/leasing" className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm hover:border-border-strong">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-fg">
                <Calculator className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Leasing calculator</span>
                <span className="block text-sm text-fg-muted">Work out a monthly rental before you talk to a lender.</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-fg-subtle" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
