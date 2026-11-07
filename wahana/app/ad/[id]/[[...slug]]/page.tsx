import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Calculator,
  BadgeCheck,
  Calendar,
  Car,
  ChevronRight,
  Cog,
  Crown,
  FileText,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  PartyPopper,
  ShieldCheck,
  Users,
  Wrench,
  Zap,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getListing, priceSpread, searchListings, similarListings } from "@/lib/queries";
import { getUser } from "@/lib/supabase/server";
import { ALL_BODY_LABELS, CONDITIONS, FUELS, TRANSMISSIONS, label, typeBySlug } from "@/lib/constants";
import { formatDate, formatKm, formatLKR, formatLKRCompact, formatLakhs, formatNumber, timeAgo } from "@/lib/format";
import { photoUrl, SITE_URL } from "@/lib/env";
import { site } from "@/lib/site";
import { Gallery } from "@/components/listing/gallery";
import { PriceRange } from "@/components/listing/price-range";
import { ContactPanel, MobileContactBar, ReportButton, ShareButton, ViewTracker, WhatsAppShare } from "@/components/listing/contact";
import { CompareButton } from "@/components/compare";
import { RecentlyViewed } from "@/components/recently-viewed";
import { OwnerBar } from "@/components/listing/owner-actions";
import { LeasingCalculator } from "@/components/leasing-calculator";
import { FavouriteButton } from "@/components/favourite-button";
import { DealBadge } from "@/components/deal-badge";
import { ListingRail, SectionHeader } from "@/components/rail";
import { PriceTag } from "@/components/listing-card";
import { ReadMore } from "@/components/read-more";
import { leaseEstimate } from "@/lib/finance";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type Props = { params: Promise<{ id: string; slug?: string[] }>; searchParams: Promise<{ posted?: string }> };

async function load(idParam: string) {
  if (!/^\d{1,12}$/.test(idParam)) notFound();
  const l = await getListing(Number(idParam));
  if (!l) notFound();
  return l;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const l = await load(id);
  const where = l.city?.name ?? l.district?.name;
  const title = `${l.title} for ${formatLKR(l.price_lkr)}${where ? ` in ${where}` : ""}`;
  const description = [
    label(CONDITIONS, l.condition),
    l.mileage_km != null && l.condition !== "brand_new" ? formatKm(l.mileage_km) : null,
    l.fuel && label(FUELS, l.fuel),
    l.transmission && label(TRANSMISSIONS, l.transmission),
    l.description?.slice(0, 120),
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title,
    description,
    alternates: { canonical: `/ad/${l.id}/${l.slug}` },
    robots: l.status === "active" ? undefined : { index: false, follow: true },
    openGraph: { title, description, images: [{ url: `/og/ad/${l.id}`, width: 1200, height: 630, alt: l.title }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [`/og/ad/${l.id}`] },
  };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id, slug } = await params;
  const { posted } = await searchParams;
  const l = await load(id);
  if ((slug?.[0] ?? "") !== l.slug) redirect(`/ad/${l.id}/${l.slug}${posted ? "?posted=1" : ""}`);

  const [user, similar, spread, sellerAds] = await Promise.all([
    getUser(),
    similarListings(l.id, 8),
    l.model_id ? priceSpread(l.model_id, l.condition, l.year_manufactured, l.id) : Promise.resolve(null),
    searchListings({ seller: l.seller_id, page_size: 9 }),
  ]);

  const isOwner = user?.id === l.seller_id;
  const live = l.status === "active";
  const t = typeBySlug(l.vehicle_type);
  const where = [l.city?.name, l.district?.name].filter(Boolean).join(", ");
  const seller = l.seller;
  const isDealer = seller?.account_type === "dealer";
  const sellerName = (isDealer && seller?.dealer_name) || seller?.display_name || "Private seller";
  const isTop = !!l.promoted_until && new Date(l.promoted_until) > new Date();
  const isUrgent = !!l.urgent_until && new Date(l.urgent_until) > new Date();
  const lakhs = formatLakhs(l.price_lkr);
  const lastDrop = l.price_changes.find((c) => c.new_price_lkr < c.old_price_lkr);
  const subject = [l.make?.name, l.model?.name].filter(Boolean).join(" ");
  const shareText = `${l.title} for ${formatLKR(l.price_lkr)}${where ? ` in ${where}` : ""} on Wahana: ${SITE_URL}/ad/${l.id}/${l.slug}`;
  const similarIds = new Set(similar.map((s) => s.id));
  const moreFromSeller = sellerAds.items.filter((a) => a.id !== l.id && !similarIds.has(a.id)).slice(0, 8);
  const searchHref = l.make ? `/${t?.path ?? "vehicles"}/${l.make.slug}${l.model ? `/${l.model.slug}` : ""}` : `/${t?.path ?? "vehicles"}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Product", l.vehicle_type === "motorbike" ? "Motorcycle" : "Car"],
    name: l.title,
    brand: l.make ? { "@type": "Brand", name: l.make.name } : undefined,
    model: l.model?.name ?? l.model_other ?? undefined,
    vehicleModelDate: String(l.year_manufactured),
    mileageFromOdometer: l.mileage_km != null ? { "@type": "QuantitativeValue", value: l.mileage_km, unitCode: "KMT" } : undefined,
    fuelType: l.fuel ? label(FUELS, l.fuel) : undefined,
    vehicleTransmission: l.transmission ? label(TRANSMISSIONS, l.transmission) : undefined,
    color: l.colour ?? undefined,
    itemCondition: l.condition === "brand_new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    image: l.photos.map((p) => photoUrl(p.path)),
    description: l.description,
    url: `${SITE_URL}/ad/${l.id}/${l.slug}`,
    offers: {
      "@type": "Offer",
      price: l.price_lkr,
      priceCurrency: "LKR",
      availability: live ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      areaServed: where,
    },
  };

  const regLabel =
    l.year_registered != null ? String(l.year_registered) : l.condition === "brand_new" || l.condition === "reconditioned" ? "Not registered yet" : null;

  const monthly = leaseEstimate(l.price_lkr);
  const facts = [
    { icon: Calendar, label: "Year", value: String(l.year_manufactured) },
    { icon: Gauge, label: "Mileage", value: l.condition === "brand_new" ? "Brand new" : l.mileage_km != null ? formatKm(l.mileage_km) : null },
    { icon: Fuel, label: "Fuel", value: l.fuel ? label(FUELS, l.fuel) : null },
    { icon: Cog, label: "Transmission", value: l.transmission ? label(TRANSMISSIONS, l.transmission) : null },
    { icon: Wrench, label: "Engine", value: l.engine_cc ? `${formatNumber(l.engine_cc)} cc` : null },
  ].filter((f) => f.value);
  const info: [string, React.ReactNode][] = (
    [
      ["Make", l.make?.name ?? l.make_other],
      ["Model", l.model?.name ?? l.model_other],
      ["Edition", l.trim_level],
      ["Condition", label(CONDITIONS, l.condition)],
      ["Year made", l.year_manufactured],
      ["Registered", regLabel],
      ["Mileage", l.mileage_km != null ? formatKm(l.mileage_km) : null],
      ["Engine", l.engine_cc ? `${formatNumber(l.engine_cc)} cc` : null],
      ["Fuel", l.fuel ? label(FUELS, l.fuel) : null],
      ["Transmission", l.transmission ? label(TRANSMISSIONS, l.transmission) : null],
      ["Body", l.body_type ? ALL_BODY_LABELS[l.body_type] ?? l.body_type : t?.name],
      ["Colour", l.colour],
      ["Previous owners", l.previous_owners != null ? (l.previous_owners === 0 ? "None" : l.previous_owners) : null],
      ["Leasing", l.leasing_available ? "Available" : null],
      ["Location", where],
      ["Ad reference", String(l.id)],
      ["Posted", formatDate(l.published_at)],
    ] as [string, React.ReactNode][]
  ).filter(([, v]) => v != null && v !== "");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker listingId={l.id} skip={isOwner || !live} />

      <div className="container-page pb-32 pt-3 sm:pt-5 lg:pb-12">
        <div className="mb-3 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-fg-muted">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="inline-flex min-h-7 items-center hover:text-fg hover:underline">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="size-3.5 text-fg-subtle" />
                <Link href={`/${t?.path ?? "vehicles"}`} className="inline-flex min-h-7 items-center hover:text-fg hover:underline">
                  {t?.plural ?? "Vehicles"}
                </Link>
              </li>
              {l.make && (
                <li className="flex items-center gap-1">
                  <ChevronRight className="size-3.5 text-fg-subtle" />
                  <Link href={`/${t?.path ?? "vehicles"}/${l.make.slug}`} className="inline-flex min-h-7 items-center hover:text-fg hover:underline">
                    {l.make.name}
                  </Link>
                </li>
              )}
              {l.make && l.model && (
                <li className="flex items-center gap-1">
                  <ChevronRight className="size-3.5 text-fg-subtle" />
                  <Link href={searchHref} className="inline-flex min-h-7 items-center hover:text-fg hover:underline">
                    {l.model.name}
                  </Link>
                </li>
              )}
            </ol>
          </nav>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <FavouriteButton id={l.id} variant="plain" withLabel className="h-10 px-3.5 text-sm" />
            <ShareButton title={l.title} className="h-10 px-3.5 text-sm" />
            <CompareButton id={l.id} className="h-10 px-3.5 text-sm" />
          </div>
        </div>

        {posted && isOwner && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-good/30 bg-good-soft p-4 sm:flex-row sm:items-center">
            <PartyPopper className="size-6 shrink-0 text-good" />
            <div className="flex-1">
              <p className="font-bold">Your ad is live</p>
              <p className="text-sm text-fg-muted">Share the link with friends, or boost it to appear above other {subject || "similar"} ads.</p>
            </div>
            <div className="flex gap-2">
              <WhatsAppShare text={shareText} />
              <ButtonLink href={`/account/promote/${l.id}`} variant="accent">
                Boost ad
              </ButtonLink>
            </div>
          </div>
        )}

        {!live && (
          <div className={`mb-4 flex items-start gap-3 rounded-2xl border p-4 ${l.status === "sold" ? "border-good/30 bg-good-soft" : "border-high/30 bg-high-soft"}`}>
            {l.status === "sold" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" /> : l.status === "expired" ? <Clock className="mt-0.5 size-5 shrink-0 text-high" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-high" />}
            <div className="flex-1">
              <p className="font-bold">
                {l.status === "sold"
                  ? `This vehicle was sold${l.sold_at ? ` on ${formatDate(l.sold_at)}` : ""}`
                  : l.status === "expired"
                    ? "This ad has expired"
                    : l.status === "under_review"
                      ? "This ad is being reviewed"
                      : "This ad is no longer available"}
              </p>
              <p className="text-sm text-fg-muted">
                {isOwner
                  ? l.status === "under_review"
                    ? "Several people reported it, so it's hidden until a moderator checks it."
                    : "Only you can see it now."
                  : "Here are similar vehicles that are still for sale."}
              </p>
            </div>
            {!isOwner && (
              <ButtonLink href={searchHref} variant="secondary" size="sm">
                See similar
              </ButtonLink>
            )}
          </div>
        )}

        {isOwner && (
          <div className="mb-4">
            <OwnerBar id={l.id} status={l.status} views={l.view_count} reveals={l.contact_reveal_count} expiresAt={l.expires_at} />
          </div>
        )}

        <div className="-mx-4 sm:mx-0">
          <Gallery photos={l.photos} title={l.title} type={l.vehicle_type} seed={l.id} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-9">
            <section aria-label="Price and key details">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <PriceTag price={l.price_lkr} size="xl" />
                    {lakhs && <span className="text-[15px] text-fg-muted">({lakhs})</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 empty:hidden">
                    {l.negotiable && <Badge tone="neutral">Negotiable</Badge>}
                    <DealBadge rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} size="md" />
                    {isTop && (
                      <Badge tone="solid-accent" icon={<Crown className="size-3" />}>
                        Top ad
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge tone="solid-danger" icon={<Zap className="size-3" />}>
                        Urgent sale
                      </Badge>
                    )}
                  </div>
                </div>
                {live && (
                  <a href="#leasing" className="inline-flex min-h-8 items-center gap-1 text-[15px] font-bold text-brand-text hover:underline">
                    <Calculator className="size-4" /> Leasing from {formatLKR(monthly)}/month
                  </a>
                )}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[15px] text-fg-muted">
                <MapPin className="size-4 shrink-0" /> {where}
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-4 border-y border-border py-4">
                {facts.map(({ icon: I, label: k, value }) => (
                  <li key={k} className="flex items-center gap-2.5">
                    <I className="size-5 text-fg-subtle" aria-hidden />
                    <span>
                      <span className="block text-xs text-fg-subtle">{k}</span>
                      <span className="block font-bold">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <h1 className="mt-5 text-2xl font-bold leading-tight sm:text-[28px]">{l.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-subtle">
                <Badge tone="brand">{label(CONDITIONS, l.condition)}</Badge>
                {l.leasing_available && <Badge tone="neutral">Leasing available</Badge>}
                {l.is_demo && <Badge tone="neutral">Demo ad</Badge>}
                <span>Posted {timeAgo(l.published_at)}</span>
                {l.view_count > 0 && <span>· {formatNumber(l.view_count)} views</span>}
              </div>
            </section>

            {lastDrop && (
              <div className="flex items-center gap-3 rounded-xl border border-good/30 bg-good-soft px-4 py-3 text-sm">
                <TrendingDown className="size-5 shrink-0 text-good" />
                <p>
                  <span className="font-bold">Price dropped {formatLKRCompact(lastDrop.old_price_lkr - lastDrop.new_price_lkr)}</span>{" "}
                  <span className="text-fg-muted">
                    on {formatDate(lastDrop.changed_at)}, from {formatLKR(lastDrop.old_price_lkr)}
                  </span>
                </p>
              </div>
            )}

            {l.description && (
              <section aria-labelledby="desc">
                <h2 id="desc" className="mb-3 text-xl font-bold">
                  Description
                </h2>
                <ReadMore text={l.description} />
              </section>
            )}

            <section aria-labelledby="info">
              <h2 id="info" className="text-xl font-bold">
                Vehicle information
              </h2>
              <dl className="mt-2 grid sm:grid-cols-2 sm:gap-x-10">
                {info.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border py-3 text-[15px]">
                    <dt className="text-fg-muted">{k}</dt>
                    <dd className="text-right font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {l.features.length > 0 && (
              <section aria-labelledby="features">
                <h2 id="features" className="text-xl font-bold">
                  Features
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {l.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[15px]">
                      <CheckCircle2 className="size-[18px] shrink-0 text-brand-text" /> {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {l.model_id && (
              <section aria-label="Price check">
                <PriceRange spread={spread} price={l.price_lkr} rating={l.price_rating} median={l.market_median_lkr} peers={l.market_peer_count} subject={subject} />
              </section>
            )}

            {l.price_changes.length > 0 && (
              <section aria-labelledby="history">
                <h2 id="history" className="text-xl font-bold">
                  Price history
                </h2>
                <ol className="mt-3 space-y-2 border-l-2 border-border pl-4 text-sm">
                  {l.price_changes.map((c) => (
                    <li key={c.id}>
                      <span className="font-bold">{formatLKR(c.new_price_lkr)}</span>
                      <span className="text-fg-muted">
                        {" "}
                        from {formatLKR(c.old_price_lkr)} · {formatDate(c.changed_at)}
                      </span>
                    </li>
                  ))}
                  <li className="text-fg-muted">Listed {formatDate(l.published_at)}</li>
                </ol>
              </section>
            )}

            {live && (
              <section aria-labelledby="leasing-title" id="leasing" className="scroll-mt-24">
                <h2 id="leasing-title" className="text-xl font-bold">
                  Leasing calculator
                </h2>
                <p className="mb-3 mt-1 text-sm text-fg-muted">See roughly what this would cost each month on a lease.</p>
                <LeasingCalculator price={l.price_lkr} />
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-md">
              <div className="flex items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft text-xl font-bold text-brand-soft-fg">{sellerName.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-lg font-bold">
                    {sellerName}
                    {isDealer && <BadgeCheck className="size-5 shrink-0 text-brand-text" aria-label="Dealer" />}
                  </p>
                  <p className="text-sm text-fg-muted">
                    {isDealer ? "Dealer" : "Private seller"}
                    {seller?.created_at && ` · since ${new Date(seller.created_at).getFullYear()}`}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <ContactPanel listingId={l.id} title={l.title} price={l.price_lkr} isOwner={isOwner} live={live} sellerFirstName={sellerName} />
              </div>
              {isDealer && seller?.dealer_slug && (
                <Link href={`/dealers/${seller.dealer_slug}`} className="mt-4 flex min-h-10 items-center justify-center gap-1 rounded-lg text-[15px] font-bold text-brand-text hover:bg-brand-soft">
                  View all {sellerAds.total} ads from this dealer <ChevronRight className="size-4" />
                </Link>
              )}
              <p className="mt-4 border-t border-border pt-3 text-xs text-fg-subtle">
                Ad reference {l.id} · Posted {formatDate(l.published_at)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                <CompareButton id={l.id} className="col-span-2" />
                <ShareButton title={l.title} />
                <WhatsAppShare text={shareText} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="size-5 text-good" /> Buy safely
              </p>
              <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                <li>Never pay an advance before you&apos;ve seen the vehicle.</li>
                <li>Check the CR book, and that the chassis and engine numbers match it.</li>
                <li>Meet somewhere public, and bring a mechanic if you can.</li>
              </ul>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Link href="/safety" className="inline-flex min-h-8 items-center text-sm font-bold text-brand-text hover:underline">
                  More safety tips
                </Link>
                {!isOwner && <ReportButton listingId={l.id} />}
              </div>
            </div>
          </aside>
        </div>

        {moreFromSeller.length > 0 && (
          <section className="mt-14" aria-labelledby="seller-more">
            <SectionHeader
              title={<span id="seller-more">More from {sellerName}</span>}
              href={isDealer && seller?.dealer_slug ? `/dealers/${seller.dealer_slug}` : undefined}
              linkLabel={`All ${sellerAds.total} ads`}
            />
            <ListingRail items={moreFromSeller} label={`More from ${sellerName}`} />
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-14" aria-labelledby="similar">
            <SectionHeader title={<span id="similar">Similar vehicles</span>} sub={`Other ${subject || t?.plural.toLowerCase()} for sale`} href={searchHref} />
            <ListingRail items={similar.slice(0, 8)} label="Similar vehicles" />
          </section>
        )}

        <RecentlyViewed exclude={l.id} className="mt-14" />
      </div>

      {live && !isOwner && <MobileContactBar listingId={l.id} title={l.title} price={l.price_lkr} sellerName={sellerName} />}
    </>
  );
}
