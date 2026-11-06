import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
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
import { getListing, priceSpread, similarListings } from "@/lib/queries";
import { getUser } from "@/lib/supabase/server";
import { ALL_BODY_LABELS, CONDITIONS, FUELS, TRANSMISSIONS, label, typeBySlug } from "@/lib/constants";
import { formatDate, formatKm, formatLKR, formatLKRCompact, formatLakhs, formatNumber, timeAgo } from "@/lib/format";
import { photoUrl, SITE_URL } from "@/lib/env";
import { site } from "@/lib/site";
import { Gallery } from "@/components/listing/gallery";
import { PriceRange } from "@/components/listing/price-range";
import { ContactPanel, MobileContactBar, ReportButton, ShareButton, ViewTracker } from "@/components/listing/contact";
import { OwnerBar } from "@/components/listing/owner-actions";
import { LeasingCalculator } from "@/components/leasing-calculator";
import { FavouriteButton } from "@/components/favourite-button";
import { DealBadge } from "@/components/deal-badge";
import { ListingRail, SectionHeader } from "@/components/rail";
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
  const image = photoUrl(l.cover_photo);
  return {
    title,
    description,
    alternates: { canonical: `/ad/${l.id}/${l.slug}` },
    robots: l.status === "active" ? undefined : { index: false, follow: true },
    openGraph: { title, description, images: image ? [{ url: image }] : undefined, type: "website" },
  };
}

function Spec({ icon: I, label, value }: { icon: typeof Calendar; label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-3 rounded-xl p-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-muted">
        <I className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-fg-subtle">{label}</dt>
        <dd className="truncate text-[15px] font-semibold">{value}</dd>
      </div>
    </div>
  );
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { id, slug } = await params;
  const { posted } = await searchParams;
  const l = await load(id);
  if ((slug?.[0] ?? "") !== l.slug) permanentRedirect(`/ad/${l.id}/${l.slug}${posted ? "?posted=1" : ""}`);

  const [user, similar, spread] = await Promise.all([
    getUser(),
    similarListings(l.id, 8),
    l.model_id ? priceSpread(l.model_id, l.condition, l.year_manufactured, l.id) : Promise.resolve(null),
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker listingId={l.id} skip={isOwner || !live} />

      <div className="container-page pb-32 pt-3 sm:pt-6 lg:pb-10">
        <nav aria-label="Breadcrumb" className="mb-3 hidden text-sm text-fg-muted sm:block">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-fg hover:underline">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5 text-fg-subtle" />
              <Link href={`/${t?.path ?? "vehicles"}`} className="hover:text-fg hover:underline">
                {t?.plural ?? "Vehicles"}
              </Link>
            </li>
            {l.make && (
              <li className="flex items-center gap-1">
                <ChevronRight className="size-3.5 text-fg-subtle" />
                <Link href={`/${t?.path ?? "vehicles"}/${l.make.slug}`} className="hover:text-fg hover:underline">
                  {l.make.name}
                </Link>
              </li>
            )}
            {l.make && l.model && (
              <li className="flex items-center gap-1">
                <ChevronRight className="size-3.5 text-fg-subtle" />
                <Link href={searchHref} className="hover:text-fg hover:underline">
                  {l.model.name}
                </Link>
              </li>
            )}
          </ol>
        </nav>

        {posted && isOwner && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-good/30 bg-good-soft p-4 sm:flex-row sm:items-center">
            <PartyPopper className="size-6 shrink-0 text-good" />
            <div className="flex-1">
              <p className="font-semibold">Your ad is live</p>
              <p className="text-sm text-fg-muted">Share the link with friends, or boost it to appear above other {subject || "similar"} ads.</p>
            </div>
            <div className="flex gap-2">
              <ShareButton title={l.title} />
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
              <p className="font-semibold">
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            <div className="-mx-4 sm:mx-0">
              <Gallery photos={l.photos} title={l.title} type={l.vehicle_type} seed={l.id} />
            </div>

            {/* Title + price (mobile shows here, desktop repeats in sidebar) */}
            <header>
              <div className="flex flex-wrap items-center gap-1.5">
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
                <Badge tone="brand">{label(CONDITIONS, l.condition)}</Badge>
                {l.leasing_available && <Badge tone="neutral">Leasing available</Badge>}
                {l.is_demo && <Badge tone="neutral">Demo ad</Badge>}
              </div>
              <h1 className="mt-2.5 text-2xl font-extrabold leading-tight sm:text-3xl">{l.title}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {where}
                </span>
                <span>Posted {timeAgo(l.published_at)}</span>
                {l.view_count > 0 && <span>{formatNumber(l.view_count)} views</span>}
              </p>
              <div className="mt-4 lg:hidden">
                <p className="tabular text-3xl font-extrabold tracking-tight">{formatLKR(l.price_lkr)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                  {lakhs && <span>{lakhs}</span>}
                  {l.negotiable && <Badge tone="neutral">Negotiable</Badge>}
                  <DealBadge rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} />
                </p>
              </div>
            </header>

            {lastDrop && (
              <div className="flex items-center gap-3 rounded-2xl border border-good/30 bg-good-soft px-4 py-3 text-sm">
                <TrendingDown className="size-5 shrink-0 text-good" />
                <p>
                  <span className="font-semibold">Price dropped {formatLKRCompact(lastDrop.old_price_lkr - lastDrop.new_price_lkr)}</span>{" "}
                  <span className="text-fg-muted">
                    on {formatDate(lastDrop.changed_at)}, from {formatLKR(lastDrop.old_price_lkr)}
                  </span>
                </p>
              </div>
            )}

            <section aria-labelledby="specs" className="rounded-2xl border border-border bg-surface p-2 sm:p-3">
              <h2 id="specs" className="sr-only">
                Key details
              </h2>
              <dl className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
                <Spec icon={Calendar} label="Year made" value={l.year_manufactured} />
                <Spec icon={FileText} label="Registered" value={regLabel} />
                <Spec icon={Gauge} label="Mileage" value={l.mileage_km != null ? formatKm(l.mileage_km) : null} />
                <Spec icon={Fuel} label="Fuel" value={l.fuel ? label(FUELS, l.fuel) : null} />
                <Spec icon={Cog} label="Transmission" value={l.transmission ? label(TRANSMISSIONS, l.transmission) : null} />
                <Spec icon={Wrench} label="Engine" value={l.engine_cc ? `${formatNumber(l.engine_cc)} cc` : null} />
                <Spec icon={Car} label="Body" value={l.body_type ? ALL_BODY_LABELS[l.body_type] ?? l.body_type : t?.name} />
                <Spec icon={Palette} label="Colour" value={l.colour} />
                <Spec icon={Users} label="Previous owners" value={l.previous_owners != null ? (l.previous_owners === 0 ? "None" : l.previous_owners) : null} />
              </dl>
            </section>

            {l.model_id && (
              <section aria-label="Price check">
                <PriceRange spread={spread} price={l.price_lkr} rating={l.price_rating} median={l.market_median_lkr} peers={l.market_peer_count} subject={subject} />
              </section>
            )}

            {l.description && (
              <section aria-labelledby="desc">
                <h2 id="desc" className="text-lg font-bold">
                  Seller&apos;s description
                </h2>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-fg">{l.description}</p>
              </section>
            )}

            {l.features.length > 0 && (
              <section aria-labelledby="features">
                <h2 id="features" className="text-lg font-bold">
                  Features
                </h2>
                <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  {l.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[15px]">
                      <CheckCircle2 className="size-[18px] shrink-0 text-good" /> {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {l.price_changes.length > 0 && (
              <section aria-labelledby="history">
                <h2 id="history" className="text-lg font-bold">
                  Price history
                </h2>
                <ol className="mt-3 space-y-2 border-l-2 border-border pl-4 text-sm">
                  {l.price_changes.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold">{formatLKR(c.new_price_lkr)}</span>
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
              <section aria-labelledby="leasing">
                <h2 id="leasing" className="text-lg font-bold">
                  Leasing estimate
                </h2>
                <p className="mb-3 mt-1 text-sm text-fg-muted">See roughly what this would cost each month on a lease.</p>
                <LeasingCalculator price={l.price_lkr} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-[7.5rem] lg:self-start">
            <div className="hidden rounded-3xl border border-border bg-surface p-5 shadow-sm lg:block">
              <p className="tabular text-3xl font-extrabold tracking-tight">{formatLKR(l.price_lkr)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                {lakhs && <span>{lakhs}</span>}
                {l.negotiable && <Badge tone="neutral">Negotiable</Badge>}
                <DealBadge rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} />
              </p>
              <div className="mt-5">
                <ContactPanel listingId={l.id} title={l.title} isOwner={isOwner} live={live} sellerFirstName={sellerName} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <FavouriteButton id={l.id} variant="plain" withLabel />
                <ShareButton title={l.title} />
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Seller</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-bold text-brand-soft-fg">{sellerName.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {sellerName}
                    {isDealer && <BadgeCheck className="size-4 shrink-0 text-brand-text" aria-label="Dealer" />}
                  </p>
                  <p className="text-sm text-fg-muted">
                    {isDealer ? "Dealer" : "Private seller"}
                    {seller?.created_at && ` · on ${site.name} since ${new Date(seller.created_at).getFullYear()}`}
                  </p>
                </div>
              </div>
              {isDealer && seller?.dealer_slug && (
                <ButtonLink href={`/dealers/${seller.dealer_slug}`} variant="secondary" size="sm" className="mt-4 w-full">
                  See all ads from this dealer
                </ButtonLink>
              )}
              <div className="mt-4 lg:hidden">
                <ShareButton title={l.title} className="w-full" />
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5 text-good" /> Buy safely
              </p>
              <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                <li>Never pay an advance before you&apos;ve seen the vehicle.</li>
                <li>Check the CR book, and that the chassis and engine numbers match it.</li>
                <li>Meet somewhere public, and bring a mechanic if you can.</li>
              </ul>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Link href="/safety" className="text-sm font-semibold text-brand-text hover:underline">
                  More safety tips
                </Link>
                {!isOwner && <ReportButton listingId={l.id} />}
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-12" aria-labelledby="similar">
            <SectionHeader title={<span id="similar">Similar vehicles</span>} sub={`Other ${subject || t?.plural.toLowerCase()} for sale`} href={searchHref} />
            <ListingRail items={similar.slice(0, 8)} />
          </section>
        )}
      </div>

      {live && !isOwner && <MobileContactBar listingId={l.id} title={l.title} price={formatLKR(l.price_lkr)} />}
    </>
  );
}
