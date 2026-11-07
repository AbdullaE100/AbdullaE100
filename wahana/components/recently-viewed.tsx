"use client";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { clearRecent, readRecent } from "@/lib/recent";
import type { ListingCard as Card } from "@/lib/types";
import { ListingRail, SectionHeader } from "./rail";

/** Rail of ads this device opened recently. Renders nothing until there are some. */
export function RecentlyViewed({ exclude, className }: { exclude?: number; className?: string }) {
  const [items, setItems] = useState<Card[]>([]);

  useEffect(() => {
    const ids = readRecent().filter((id) => id !== exclude).slice(0, 8);
    if (!ids.length) return;
    let alive = true;
    supabaseBrowser()
      .rpc("search_listings_by_ids", { p_ids: ids })
      .then(({ data }) => alive && setItems(((data as unknown as Card[]) ?? []).slice(0, 8)));
    return () => {
      alive = false;
    };
  }, [exclude]);

  if (!items.length) return null;
  return (
    <section aria-labelledby="recent" className={className}>
      <div className="flex items-end justify-between gap-4">
        <SectionHeader
          title={
            <span id="recent" className="inline-flex items-center gap-2">
              <History className="size-6 text-fg-muted" /> Recently viewed
            </span>
          }
        />
        <button
          type="button"
          onClick={() => {
            clearRecent();
            setItems([]);
          }}
          className="mb-4 rounded-lg px-2 py-1.5 text-sm font-semibold text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          Clear
        </button>
      </div>
      <ListingRail items={items} />
    </section>
  );
}
