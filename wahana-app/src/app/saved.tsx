import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Heart, TrendingDown, X } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { formatLKRCompact } from "@shared/format";
import { ResultCard, ResultCardSkeleton } from "@/components/listing/cards";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { useCardsByIds } from "@/lib/api";
import { openSearch } from "@/lib/search-store";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useFavourites } from "@/providers/favourites";
import { useSession } from "@/providers/session";

export default function SavedScreen() {
  const c = useColors();
  const { userId } = useSession();
  const { ids, savedAt, ready, removeMany } = useFavourites();
  const cards = useCardsByIds(ids, ready);
  const items = useMemo(() => (cards.data ? ids.map((id) => cards.data!.find((x) => x.id === id)).filter((x) => !!x) : []), [cards.data, ids]);
  const gone = cards.data ? ids.filter((id) => !cards.data!.some((x) => x.id === id)) : [];

  // Price when each ad was saved = the old price of the first change after saving.
  const since = items
    .map((i) => savedAt[i.id])
    .filter(Boolean)
    .sort()[0];
  const drops = useQuery({
    queryKey: ["saved-drops", items.map((i) => i.id).join(","), since],
    enabled: !!userId && !!since && items.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("listing_price_changes")
        .select("listing_id, old_price_lkr, changed_at")
        .in(
          "listing_id",
          items.map((i) => i.id),
        )
        .gte("changed_at", since!)
        .order("changed_at");
      const first = new Map<number, number>();
      for (const r of data ?? []) if (new Date(r.changed_at) >= new Date(savedAt[r.listing_id] ?? 0) && !first.has(r.listing_id)) first.set(r.listing_id, r.old_price_lkr);
      return first;
    },
  });

  if (ready && ids.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <EmptyState icon={<Heart size={30} color={c.brandSoftFg} />} title="No saved ads yet" body="Tap the heart on any ad to keep it here and see if the price drops.">
          <Button title="Browse vehicles" onPress={() => openSearch({})} />
          {!userId && (
            <Button title="Sign in to see ads saved on other devices" variant="ghost" onPress={() => router.push({ pathname: "/signin", params: { reason: "saved" } })} />
          )}
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={items}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={
          <View style={styles.head}>
            <Text tone="muted">
              {ids.length} saved {ids.length === 1 ? "ad" : "ads"}
              {userId ? "" : " on this phone"}
            </Text>
            {!userId && (
              <Pressable
                onPress={() => router.push({ pathname: "/signin", params: { reason: "saved" } })}
                accessibilityRole="button"
                style={[styles.note, { backgroundColor: c.brandSoft }]}
              >
                <Text variant="small" weight="600" style={{ color: c.brandSoftFg }}>
                  Sign in to keep these on all your devices and get price-drop notes.
                </Text>
              </Pressable>
            )}
            {gone.length > 0 && (
              <View style={[styles.note, styles.row, { backgroundColor: c.surface2 }]}>
                <Text variant="small" tone="muted" style={styles.flex}>
                  {gone.length} saved {gone.length === 1 ? "ad is" : "ads are"} no longer for sale.
                </Text>
                <Pressable onPress={() => removeMany(gone)} accessibilityRole="button" hitSlop={8} style={styles.row}>
                  <X size={14} color={c.brandText} />
                  <Text variant="small" weight="700" tone="brand">
                    Clear
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ gap: 14 }}>
            <ResultCardSkeleton />
            <ResultCardSkeleton />
          </View>
        }
        renderItem={({ item }) => {
          const before = drops.data?.get(item.id);
          const dropped = before && before > item.price_lkr ? before - item.price_lkr : 0;
          return (
            <ResultCard
              l={item}
              source="saved"
              note={
                dropped ? (
                  <View style={[styles.drop, { backgroundColor: c.goodSoft }]}>
                    <TrendingDown size={15} color={c.good} />
                    <Text variant="small" weight="700" tone="good">
                      {formatLKRCompact(dropped)} cheaper since you saved it
                    </Text>
                  </View>
                ) : undefined
              }
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: 760, alignSelf: "center" },
  head: { gap: 10, marginBottom: 14 },
  note: { padding: 12, borderRadius: radius.lg },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  flex: { flex: 1 },
  drop: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.md },
});
