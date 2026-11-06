import { Info } from "lucide-react";
import type { PriceSpread } from "@/lib/types";
import { formatLKRCompact } from "@/lib/format";
import { DealBadge, dealText } from "@/components/deal-badge";
import { cn } from "@/lib/cn";

/**
 * Where this ad's price sits among similar live ads (same model, condition,
 * year ±1). Band = middle half of prices, tick = median.
 */
export function PriceRange({
  spread,
  price,
  rating,
  median,
  peers,
  subject,
}: {
  spread: PriceSpread | null;
  price: number;
  rating: string | null;
  median: number | null;
  peers: number | null;
  subject: string;
}) {
  if (!spread || spread.peer_count < 2 || spread.min == null || spread.max == null) {
    return (
      <div className="flex gap-3 rounded-2xl border border-border bg-surface p-4 text-[15px] text-fg-muted">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p>
          {spread?.peer_count
            ? `Only ${spread.peer_count} other similar ad is live, so we can't rate this price yet.`
            : "There aren't enough similar ads live right now to rate this price."}
        </p>
      </div>
    );
  }

  const lo = Math.min(spread.min, price);
  const hi = Math.max(spread.max, price);
  const pad = (hi - lo) * 0.06 || hi * 0.05;
  const a = lo - pad;
  const span = hi + pad - a;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - a) / span) * 100));
  const pos = (v: number) => `${pct(v)}%`;
  const here = pct(price);
  const shift = here < 20 ? 14 : here > 80 ? 86 : 50;
  const text = dealText(rating, price, median, peers);
  const marker = rating === "good" ? "bg-good" : rating === "high" ? "bg-high" : "bg-fg";

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold">Price check</h3>
        <DealBadge rating={rating} price={price} median={median} peers={peers} size="md" />
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        {text ?? `Compared with ${spread.peer_count} similar ${subject} ads`}. Similar means the same model and condition, within a year either side.
      </p>

      <div className="relative mb-2 mt-12 h-2.5 rounded-full bg-surface-2" role="img" aria-label={`Similar ads range from ${formatLKRCompact(spread.min)} to ${formatLKRCompact(spread.max)}, median ${formatLKRCompact(spread.median)}. This ad is ${formatLKRCompact(price)}.`}>
        {spread.p25 != null && spread.p75 != null && (
          <div className="absolute inset-y-0 rounded-full bg-brand-soft ring-1 ring-brand/25" style={{ left: pos(spread.p25), right: `calc(100% - ${pos(spread.p75)})` }} />
        )}
        {spread.median != null && <div className="absolute -top-1.5 h-5.5 w-0.5 -translate-x-1/2 rounded bg-brand" style={{ left: pos(spread.median) }} />}
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(price) }}>
          <div className={cn("size-4.5 rounded-full border-[3px] border-surface shadow-md", marker)} />
          <span className="absolute bottom-[22px] left-1/2 size-2 -translate-x-1/2 rotate-45 bg-fg" aria-hidden />
          <div className="absolute bottom-6 left-1/2 whitespace-nowrap rounded-lg bg-fg px-2 py-1 text-xs font-bold text-bg shadow-md" style={{ transform: `translateX(-${shift}%)` }}>
            This ad · {formatLKRCompact(price)}
          </div>
        </div>
      </div>
      <div className="tabular flex justify-between text-xs text-fg-subtle">
        <span>{formatLKRCompact(spread.min)}</span>
        {spread.median != null && (
          <span className="font-semibold text-brand-text">Median {formatLKRCompact(spread.median)}</span>
        )}
        <span>{formatLKRCompact(spread.max)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-brand-soft ring-1 ring-brand/25" /> Middle half of prices
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded bg-brand" /> Median
        </span>
        <span>{spread.peer_count} similar ads</span>
      </div>
    </div>
  );
}
