import Link from "next/link";
import { Camera, Zap, Crown, BadgeCheck } from "lucide-react";
import type { ListingCard as Card } from "@/lib/types";
import { cn } from "@/lib/cn";
import { photoUrl } from "@/lib/env";
import { FUELS, TRANSMISSIONS, label } from "@/lib/constants";
import { formatLKR, formatKmShort, timeAgo } from "@/lib/format";
import { VehiclePlaceholder } from "./vehicle-art";
import { DealBadge } from "./deal-badge";
import { FavouriteButton } from "./favourite-button";
import { Badge } from "./ui/badge";

export const adHref = (l: { id: number; slug: string }) => `/ad/${l.id}/${l.slug}`;

export function specLine(l: Pick<Card, "mileage_km" | "fuel" | "transmission" | "condition" | "vehicle_type">) {
  const parts: string[] = [];
  if (l.condition === "brand_new") parts.push("Brand new");
  else if (l.condition === "reconditioned") parts.push("Recon");
  if (l.mileage_km != null && l.condition !== "brand_new") parts.push(formatKmShort(l.mileage_km));
  if (l.fuel) parts.push(label(FUELS, l.fuel));
  if (l.transmission && !["motorbike", "three-wheeler"].includes(l.vehicle_type))
    parts.push(l.transmission === "automatic" ? "Auto" : label(TRANSMISSIONS, l.transmission));
  return parts.join(" · ");
}

function Cover({ l, eager, sizes }: { l: Card; eager?: boolean; sizes?: string }) {
  const src = photoUrl(l.cover_thumb ?? l.cover_photo);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  ) : (
    <VehiclePlaceholder type={l.vehicle_type} seed={l.id} />
  );
}

function Flags({ l }: { l: Card }) {
  return (
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
  );
}

export function ListingCard({
  l,
  eager,
  layout = "grid",
  className,
}: {
  l: Card;
  eager?: boolean;
  /** "responsive" is a row on phones and a card from sm up. */
  layout?: "grid" | "responsive";
  className?: string;
}) {
  const where = l.city ?? l.district;
  const row = layout === "responsive";
  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-[box-shadow,border-color] hover:border-border-strong hover:shadow-md",
        row ? "flex-row sm:flex-col" : "flex-col",
        l.is_top && "ring-1 ring-accent/50",
        className,
      )}
    >
      <div className={cn("relative shrink-0 overflow-hidden bg-surface-2", row ? "aspect-[4/3] w-[42%] sm:w-full" : "aspect-[4/3] w-full")}>
        <Cover l={l} eager={eager} sizes={row ? "(max-width: 640px) 42vw, 33vw" : "(max-width: 640px) 80vw, 25vw"} />
        <Flags l={l} />
        {l.photo_count > 1 && (
          <span className="pointer-events-none absolute bottom-2 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Camera className="size-3" /> {l.photo_count}
          </span>
        )}
        <FavouriteButton id={l.id} className={cn("absolute right-2 top-2", row && "max-sm:size-9")} />
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col", row ? "gap-1 p-3 sm:gap-1.5 sm:p-3.5" : "gap-1.5 p-3.5")}>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug sm:line-clamp-1">
          <Link href={adHref(l)} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand">
            {l.title}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="tabular text-lg font-bold tracking-tight">{formatLKR(l.price_lkr)}</p>
          {l.negotiable && <span className="text-xs font-medium text-fg-subtle">Negotiable</span>}
        </div>
        <div className={cn("flex flex-wrap items-center gap-1.5", row ? "max-sm:empty:hidden sm:min-h-5" : "min-h-5")}>
          <DealBadge rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} />
        </div>
        <p className="truncate text-[13px] text-fg-muted">{specLine(l)}</p>
        <p className="mt-auto flex items-center gap-1.5 truncate pt-0.5 text-xs text-fg-subtle">
          <span className="truncate">{where}</span>
          <span aria-hidden>·</span>
          <time dateTime={l.bumped_at} className="shrink-0">
            {timeAgo(l.bumped_at)}
          </time>
          {l.is_dealer && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-brand-text">
                <BadgeCheck className="size-3.5" /> Dealer
              </span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}

export function ListingCardSkeleton({ layout = "grid" }: { layout?: "grid" | "responsive" }) {
  const row = layout === "responsive";
  return (
    <div className={cn("flex overflow-hidden rounded-2xl border border-border bg-surface", row ? "flex-row sm:flex-col" : "flex-col")}>
      <div className={cn("skeleton aspect-[4/3]", row ? "w-[42%] sm:w-full" : "w-full")} />
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton mt-2 h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}
