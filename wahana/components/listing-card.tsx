import Link from "next/link";
import { Camera, Zap, Crown, BadgeCheck, Calendar, Gauge, Fuel, Cog, MapPin } from "lucide-react";
import type { ListingCard as Card } from "@/lib/types";
import { cn } from "@/lib/cn";
import { photoUrl } from "@/lib/env";
import { FUELS, TRANSMISSIONS, label } from "@/lib/constants";
import { formatKmShort, formatNumber, timeAgo } from "@/lib/format";
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

/** "Rs" small, amount large: the way property portals show prices. */
export function PriceTag({ price, className, size = "md" }: { price: number; className?: string; size?: "md" | "lg" | "xl" }) {
  return (
    <p className={cn("tabular font-bold tracking-tight text-fg", size === "md" && "text-lg", size === "lg" && "text-[22px]", size === "xl" && "text-3xl sm:text-[34px]", className)}>
      <span className={cn("mr-1 font-bold text-fg-muted", size === "xl" ? "text-base" : "text-xs")}>Rs</span>
      {formatNumber(Math.round(price))}
    </p>
  );
}

/** Year, mileage, fuel and gearbox with small icons. */
export function SpecIcons({ l, max = 4, className }: { l: Pick<Card, "year_manufactured" | "mileage_km" | "fuel" | "transmission" | "condition" | "vehicle_type">; max?: number; className?: string }) {
  const items: { icon: typeof Calendar; text: string; label: string }[] = [{ icon: Calendar, text: String(l.year_manufactured), label: "Year" }];
  if (l.condition === "brand_new") items.push({ icon: Gauge, text: "Brand new", label: "Mileage" });
  else if (l.mileage_km != null) items.push({ icon: Gauge, text: formatKmShort(l.mileage_km), label: "Mileage" });
  if (l.fuel) items.push({ icon: Fuel, text: label(FUELS, l.fuel), label: "Fuel" });
  if (l.transmission && !["motorbike", "three-wheeler"].includes(l.vehicle_type))
    items.push({ icon: Cog, text: l.transmission === "automatic" ? "Auto" : label(TRANSMISSIONS, l.transmission), label: "Transmission" });
  return (
    <ul className={cn("flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-muted", className)}>
      {items.slice(0, max).map(({ icon: I, text, label: lbl }) => (
        <li key={lbl} className="inline-flex items-center gap-1 whitespace-nowrap">
          <I className="size-3.5 text-fg-subtle" aria-label={lbl} />
          {text}
        </li>
      ))}
    </ul>
  );
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
  preview,
  note,
}: {
  preview?: boolean;
  /** Extra line under the details, e.g. a price drop since saving. */
  note?: React.ReactNode;
  l: Card;
  eager?: boolean;
  /** "responsive" is a row on phones and a card from sm up. */
  layout?: "grid" | "responsive";
  className?: string;
}) {
  const row = layout === "responsive";
  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-[box-shadow,border-color] hover:shadow-md",
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
        {!preview && <FavouriteButton id={l.id} className={cn("absolute right-2 top-2", row && "max-sm:size-9")} />}
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col", row ? "gap-1 p-3 sm:gap-1.5 sm:p-3.5" : "gap-1.5 p-3.5")}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <PriceTag price={l.price_lkr} />
          {l.negotiable && <span className="text-xs font-bold text-fg-subtle">Negotiable</span>}
        </div>
        <div className={cn("flex flex-wrap items-center gap-1.5", row ? "max-sm:empty:hidden sm:min-h-5" : "min-h-5")}>
          <DealBadge rating={l.price_rating} price={l.price_lkr} median={l.market_median_lkr} peers={l.market_peer_count} />
        </div>
        <SpecIcons l={l} max={3} />
        <h3 className="line-clamp-1 text-[15px] font-bold leading-snug">
          {preview ? (
            l.title
          ) : (
            <Link href={adHref(l)} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand">
              {l.title}
            </Link>
          )}
        </h3>
        {note}
        <p className="flex items-center gap-1 truncate text-[13px] text-fg-muted">
          <MapPin className="size-3.5 shrink-0 text-fg-subtle" aria-hidden /> <span className="truncate">{l.city ? `${l.city}, ${l.district}` : l.district}</span>
        </p>
        <p className="mt-auto flex items-center gap-1.5 truncate border-t border-border pt-2 text-xs text-fg-subtle">
          <time dateTime={l.bumped_at} className="shrink-0" suppressHydrationWarning>
            {timeAgo(l.bumped_at)}
          </time>
          {l.is_dealer && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex min-w-0 items-center gap-0.5 font-bold text-brand-text">
                <BadgeCheck className="size-3.5 shrink-0" /> <span className="truncate">{l.dealer_name ?? "Dealer"}</span>
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
