import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { ListingCard as Card } from "@/lib/types";
import { ListingCard } from "./listing-card";
import { Carousel } from "./carousel";

export function SectionHeader({ title, sub, href, linkLabel = "See all" }: { title: ReactNode; sub?: ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-bold sm:text-[26px]">{title}</h2>
        {sub && <p className="mt-1 text-sm text-fg-muted sm:text-[15px]">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[15px] font-bold text-brand-text hover:underline">
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** Carousel of listing cards: swipe on phones, arrows on desktop. */
export function ListingRail({ items, eager = 0, label = "Vehicles" }: { items: Card[]; eager?: number; label?: string }) {
  return (
    <Carousel label={label}>
      {items.map((l, i) => (
        <ListingCard key={l.id} l={l} eager={i < eager} className="w-[76%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-3rem)/4)]" />
      ))}
    </Carousel>
  );
}
