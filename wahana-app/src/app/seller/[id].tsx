import { Stack, useLocalSearchParams } from "expo-router";
import { Store } from "lucide-react-native";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { formatNumber } from "@shared/format";
import { ResultCard, ResultCardSkeleton } from "@/components/listing/cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { useSearch } from "@/lib/api";
import { useColors } from "@/lib/theme";

/** Every live ad from one seller. */
export default function SellerScreen() {
  const c = useColors();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const q = useSearch({}, { seller: id });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: name ?? "Seller" }} />
      <FlatList
        data={items}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={
          <Text tone="muted" style={styles.head}>
            {q.isLoading ? "Loading ads…" : `${formatNumber(total)} live ${total === 1 ? "ad" : "ads"}`}
          </Text>
        }
        renderItem={({ item, index }) => <ResultCard l={item} source="seller" priority={index < 2} />}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          q.isLoading ? (
            <ResultCardSkeleton />
          ) : (
            <EmptyState icon={<Store size={30} color={c.brandSoftFg} />} title="No live ads" body="This seller has nothing for sale right now." />
          )
        }
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={c.brand} style={{ padding: 20 }} /> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, list: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: 760, alignSelf: "center" }, head: { marginBottom: 12 } });
