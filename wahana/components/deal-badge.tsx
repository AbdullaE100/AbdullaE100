import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLKRCompact } from "@/lib/format";

export function dealText(rating: string | null | undefined, price: number, median: number | null | undefined, peers?: number | null) {
  if (!rating || !median) return null;
  const diff = price - median;
  const pct = Math.round((Math.abs(diff) / median) * 100);
  const vs = `the ${formatLKRCompact(median)} median${peers ? ` of ${peers} similar ads` : ""}`;
  if (Math.abs(diff) < median * 0.005) return `Right at ${vs}`;
  return `${formatLKRCompact(Math.abs(diff))} (${pct}%) ${diff < 0 ? "below" : "above"} ${vs}`;
}

export function DealBadge({ rating, price, median, peers, size = "sm" }: { rating: string | null | undefined; price: number; median?: number | null; peers?: number | null; size?: "sm" | "md" }) {
  if (!rating) return null;
  const title = dealText(rating, price, median, peers) ?? undefined;
  const cls = size === "md" ? "px-2.5 py-1 text-[13px]" : undefined;
  if (rating === "good")
    return (
      <Badge tone="good" className={cls} icon={<TrendingDown className="size-3.5" />}>
        <span title={title}>Good price</span>
      </Badge>
    );
  if (rating === "high")
    return (
      <Badge tone="high" className={cls} icon={<TrendingUp className="size-3.5" />}>
        <span title={title}>Above market</span>
      </Badge>
    );
  return (
    <Badge tone="neutral" className={cls} icon={<Minus className="size-3.5" />}>
      <span title={title}>Fair price</span>
    </Badge>
  );
}
