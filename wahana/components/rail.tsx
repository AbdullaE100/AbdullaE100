import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { ListingCard as Card } from "@/lib/types";
import { ListingCard } from "./listing-card";

export function SectionHeader({ title, sub, href, linkLabel = "See all" }: { title: ReactNode; sub?: ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-fg-muted sm:text-[15px]">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-text hover:bg-brand-soft">
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** Swipeable row on phones, grid on desktop. */
export function ListingRail({ items, eager = 0 }: { items: Card[]; eager?: number }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
      {items.map((l, i) => (
        <ListingCard key={l.id} l={l} eager={i < eager} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto" />
      ))}
    </div>
  );
}
