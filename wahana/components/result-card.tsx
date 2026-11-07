import Link from "next/link";
import { BadgeCheck, Camera, Crown, MapPin, Zap } from "lucide-react";
import type { ListingCard as Card } from "@/lib/types";
import { photoUrl } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { adHref, PriceTag, SpecIcons } from "./listing-card";
import { DealBadge } from "./deal-badge";
import { FavouriteButton } from "./favourite-button";
import { VehiclePlaceholder } from "./vehicle-art";
import { Badge } from "./ui/badge";
import { ContactActions } from "./listing/contact";

/** Wide search-result card: photo left, details and contact buttons right. */
export function ResultCard({ l, eager, note, className }: { l: Card; eager?: boolean; note?: React.ReactNode; className?: string }) {
  const src = photoUrl(l.cover_thumb ?? l.cover_photo);
  const seller = l.is_dealer ? l.dealer_name ?? "Dealer" : "Private seller";
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition-shadow hover:shadow-md sm:flex-row",
        l.is_top ? "border-accent/60" : "border-border",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-2 sm:aspect-auto sm:min-h-[214px] sm:w-[300px]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <VehiclePlaceholder type={l.vehicle_type} seed={l.id} className="absolute inset-0" />
        )}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {l.is_top && (
            <Badge tone="solid-accent" icon={<Crown className="size-3" />}>
              Top ad
            </Badge>
          )}
          {l.is_urgent && (
            <Badge tone="solid-danger" icon={<Zap className="size-3" />}>
              Urgent
            </Badge>
          )}
        </div>
        {l.photo_count > 0 && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
            <Camera className="size-3" /> {l.photo_count}
          </span>
        )}
        <FavouriteButton id={l.id} className="absolute right-2.5 top-2.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <PriceTag price={l.price_lkr} size="lg" />
              {l.negotiable && <span className="text-xs font-bold text-fg-subtle">Negotiable</span>}
            </div>
            <div className="mt-1 empty:hidden">
              <DealBadge rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} />
            </div>
          </div>
          {l.is_dealer && (
            <span className="hidden max-w-40 shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-bold text-fg-muted sm:inline-flex">
              <BadgeCheck className="size-3.5 shrink-0 text-brand-text" /> <span className="truncate">{l.dealer_name ?? "Dealer"}</span>
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-1 text-[17px] font-bold leading-snug">
          <Link href={adHref(l)} className="after:absolute after:inset-0 hover:text-brand-text focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand">
            {l.title}
          </Link>
        </h3>
        <SpecIcons l={l} className="mt-2" />
        <p className="mt-2 flex items-center gap-1 text-[14px] text-fg-muted">
          <MapPin className="size-4 shrink-0 text-fg-subtle" aria-hidden /> <span className="truncate">{l.city ? `${l.city}, ${l.district}` : l.district}</span>
        </p>
        {note}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
          <p className="text-xs text-fg-subtle">
            <time dateTime={l.bumped_at} suppressHydrationWarning>
              Updated {timeAgo(l.bumped_at)}
            </time>
            <span className="sm:hidden"> · {seller}</span>
          </p>
          <ContactActions listingId={l.id} title={l.title} price={l.price_lkr} sellerName={seller} variant="card" />
        </div>
      </div>
    </article>
  );
}

export function ResultCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:flex-row">
      <div className="skeleton aspect-[16/10] w-full sm:aspect-auto sm:min-h-[214px] sm:w-[300px]" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="mt-auto flex justify-end gap-2 pt-3">
          <div className="skeleton h-10 w-20 rounded-lg" />
          <div className="skeleton h-10 w-28 rounded-lg" />
          <div className="skeleton h-10 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
