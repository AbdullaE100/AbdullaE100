"use client";
import { useEffect, useState } from "react";
import { Heart, TrendingDown } from "lucide-react";
import { formatLKRCompact } from "@/lib/format";
import { useFavourites, useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ListingCard as Card } from "@/lib/types";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";

export function SavedAds() {
  const { ids, ready, removeMany, savedAt } = useFavourites();
  const [drops, setDrops] = useState<Record<number, number>>({});
  const session = useSession();
  const [items, setItems] = useState<Card[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!ids.length) {
      setItems([]);
      return;
    }
    let alive = true;
    supabaseBrowser()
      .rpc("search_listings_by_ids", { p_ids: ids })
      .then(({ data }) => alive && setItems((data as unknown as Card[]) ?? []));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  // Price at the time each ad was saved = the old price of the first change after saving.
  useEffect(() => {
    if (!session || !items?.length) return;
    const since = items.map((i) => savedAt[i.id]).filter(Boolean).sort()[0];
    if (!since) return;
    let alive = true;
    supabaseBrowser()
      .from("listing_price_changes")
      .select("listing_id, old_price_lkr, changed_at")
      .in("listing_id", items.map((i) => i.id))
      .gte("changed_at", since)
      .order("changed_at")
      .then(({ data }) => {
        if (!alive || !data) return;
        const out: Record<number, number> = {};
        for (const item of items) {
          const at = savedAt[item.id];
          const first = at && data.find((c) => c.listing_id === item.id && c.changed_at > at);
          if (first && first.old_price_lkr > item.price_lkr) out[item.id] = first.old_price_lkr - item.price_lkr;
        }
        setDrops(out);
      });
    return () => {
      alive = false;
    };
  }, [session, items, savedAt]);

  const gone = items ? ids.filter((id) => !items.some((i) => i.id === id)) : [];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">Saved ads</h1>
      <p className="mb-5 text-fg-muted">{session ? "Synced to your account." : "Saved on this device. Sign in to keep them everywhere."}</p>
      {items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <ListingCardSkeleton key={i} layout="responsive" />
          ))}
        </div>
      ) : items.length === 0 && gone.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved ads yet"
          body="Tap the heart on any ad to keep it here. We'll show you if the price drops."
          action={<ButtonLink href="/vehicles">Browse vehicles</ButtonLink>}
        />
      ) : (
        <>
          {gone.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-sm">
              <p>
                {gone.length} saved {gone.length === 1 ? "ad has" : "ads have"} sold or expired.
              </p>
              <Button variant="secondary" size="sm" onClick={() => removeMany(gone)}>
                Clear {gone.length === 1 ? "it" : "them"}
              </Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {items.map((l) => (
              <ListingCard
                key={l.id}
                l={l}
                layout="responsive"
                note={
                  drops[l.id] ? (
                    <p className="inline-flex items-center gap-1 text-[13px] font-semibold text-good">
                      <TrendingDown className="size-3.5" /> {formatLKRCompact(drops[l.id])} cheaper since you saved it
                    </p>
                  ) : null
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
