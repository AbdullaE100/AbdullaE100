"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useFavourites, useSession } from "@/app/providers";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ListingCard as Card } from "@/lib/types";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";

export function SavedAds() {
  const { ids, ready, toggle } = useFavourites();
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
              <Button variant="secondary" size="sm" onClick={() => gone.forEach((id) => toggle(id))}>
                Clear {gone.length === 1 ? "it" : "them"}
              </Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {items.map((l) => (
              <ListingCard key={l.id} l={l} layout="responsive" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
