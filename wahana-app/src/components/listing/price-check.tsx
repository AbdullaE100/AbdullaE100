import { Info } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { formatLKRCompact } from "@shared/format";
import type { PriceSpread } from "@shared/types";
import { Text } from "@/components/ui/text";
import { radius, useColors } from "@/lib/theme";
import { DealBadge, dealText } from "./bits";

/** Where this price sits among similar live ads. Band = middle half, tick = median. */
export function PriceCheck({
  spread,
  price,
  rating,
  median,
  peers,
  subject,
}: {
  spread: PriceSpread | null | undefined;
  price: number;
  rating: string | null;
  median: number | null;
  peers: number | null;
  subject: string;
}) {
  const c = useColors();
  const [w, setW] = useState(0);

  if (!spread || spread.peer_count < 2 || spread.min == null || spread.max == null) {
    return (
      <View style={[styles.card, styles.row, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Info size={20} color={c.fgMuted} />
        <Text tone="muted" style={styles.flex}>
          {spread?.peer_count
            ? `Only ${spread.peer_count} other similar ad is live, so we can't rate this price yet.`
            : "There aren't enough similar ads live right now to rate this price."}
        </Text>
      </View>
    );
  }

  const lo = Math.min(spread.min, price);
  const hi = Math.max(spread.max, price);
  const pad = (hi - lo) * 0.06 || hi * 0.05;
  const a = lo - pad;
  const span = hi + pad - a;
  const x = (v: number) => Math.min(1, Math.max(0, (v - a) / span)) * w;
  const marker = rating === "good" ? c.good : rating === "high" ? c.high : c.fg;
  const text = dealText(rating, price, median, peers);
  const labelW = 132;
  const labelLeft = Math.min(Math.max(x(price) - labelW / 2, 0), Math.max(0, w - labelW));

  return (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Text variant="title" accessibilityRole="header">
          Price check
        </Text>
        <DealBadge rating={rating} />
      </View>
      <Text variant="small" tone="muted">
        {text ?? `Compared with ${spread.peer_count} similar ${subject} ads`}. Similar means the same model and condition, within a year either side.
      </Text>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={styles.chart}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Similar ads range from ${formatLKRCompact(spread.min)} to ${formatLKRCompact(spread.max)}, median ${formatLKRCompact(spread.median)}. This ad is ${formatLKRCompact(price)}.`}
      >
        {w > 0 && (
          <>
            <View style={[styles.tip, { left: labelLeft, width: labelW, backgroundColor: c.fg }]}>
              <Text variant="caption" weight="700" style={{ color: c.bg, textAlign: "center" }} numberOfLines={1}>
                This ad · {formatLKRCompact(price)}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: c.surface3 }]}>
              {spread.p25 != null && spread.p75 != null && (
                <View style={[styles.band, { left: x(spread.p25), width: Math.max(4, x(spread.p75) - x(spread.p25)), backgroundColor: c.brandSoft, borderColor: c.brand }]} />
              )}
            </View>
            {spread.median != null && <View style={[styles.median, { left: x(spread.median) - 1, backgroundColor: c.brand }]} />}
            <View style={[styles.dot, { left: x(price) - 10, backgroundColor: marker, borderColor: c.surface }]} />
          </>
        )}
      </View>
      <View style={styles.scale}>
        <Text variant="caption" tone="subtle" numeric>
          {formatLKRCompact(spread.min)}
        </Text>
        {spread.median != null && (
          <Text variant="caption" weight="700" tone="brand" numeric>
            Median {formatLKRCompact(spread.median)}
          </Text>
        )}
        <Text variant="caption" tone="subtle" numeric>
          {formatLKRCompact(spread.max)}
        </Text>
      </View>
      <Text variant="caption" tone="muted">
        Shaded band: middle half of prices · {spread.peer_count} similar ads
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xxl, padding: 16, gap: 8 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  chart: { height: 64, marginTop: 4, justifyContent: "flex-end" },
  tip: { position: "absolute", top: 0, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 6 },
  track: { height: 10, borderRadius: 5, marginBottom: 12, overflow: "hidden" },
  band: { position: "absolute", top: 0, bottom: 0, borderRadius: 5, borderWidth: 1 },
  median: { position: "absolute", bottom: 9, width: 3, height: 16, borderRadius: 2 },
  dot: { position: "absolute", bottom: 7, width: 20, height: 20, borderRadius: 10, borderWidth: 3 },
  scale: { flexDirection: "row", justifyContent: "space-between" },
});
