import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import type { ListingCard as Card } from "@shared/types";
import { ListingCard, ListingCardSkeleton } from "@/components/listing/cards";
import { Text } from "@/components/ui/text";
import { useColors } from "@/lib/theme";

export function SectionHeader({ title, sub, action, onAction }: { title: string; sub?: string; action?: string; onAction?: () => void }) {
  const c = useColors();
  return (
    <View style={styles.head}>
      <View style={styles.flex}>
        <Text variant="h3" accessibilityRole="header">
          {title}
        </Text>
        {!!sub && (
          <Text variant="small" tone="muted">
            {sub}
          </Text>
        )}
      </View>
      {!!action && (
        <Pressable onPress={onAction} accessibilityRole="link" hitSlop={8} style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
          <Text variant="body" weight="700" tone="brand">
            {action}
          </Text>
          <ChevronRight size={18} color={c.brandText} />
        </Pressable>
      )}
    </View>
  );
}

/** Horizontal, snapping row of cards; the next card peeks to show it scrolls. */
export function Rail({ items, loading, source, note }: { items: Card[] | undefined; loading?: boolean; source: string; note?: (l: Card) => ReactNode }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(300, Math.round((Math.min(width, 900) - 16 * 2 - 12) / (width >= 700 ? 2.6 : 1.35)));
  if (loading && !items?.length) {
    return (
      <View style={styles.skelRow}>
        <ListingCardSkeleton width={cardW} />
        <ListingCardSkeleton width={cardW} />
      </View>
    );
  }
  if (!items?.length) return null;
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(l) => String(l.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      snapToInterval={cardW + 12}
      decelerationRate="fast"
      snapToAlignment="start"
      renderItem={({ item }) => <ListingCard l={item} width={cardW} source={source} note={note?.(item)} />}
      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      initialNumToRender={3}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  flex: { flex: 1, gap: 2 },
  action: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 36 },
  rail: { paddingHorizontal: 16 },
  skelRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, overflow: "hidden" },
});
