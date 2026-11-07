import { Calendar, Cog, Crown, Fuel, Gauge, Minus, TrendingDown, TrendingUp, Zap } from "lucide-react-native";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { FUELS, TRANSMISSIONS, label } from "@shared/constants";
import { formatKmShort, formatLKRCompact, formatNumber } from "@shared/format";
import type { ListingCard } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { useColors } from "@/lib/theme";

export const NO_GEARBOX = ["motorbike", "three-wheeler"];

/** "Rs" small, amount large — the way listing portals show prices. */
export function PriceTag({ price, size = "md", tone }: { price: number; size?: "md" | "lg" | "xl"; tone?: "inverse" }) {
  const big = size === "xl" ? 30 : size === "lg" ? 22 : 18;
  return (
    <Text
      numeric
      weight="800"
      style={{ fontSize: big, lineHeight: big * 1.2, letterSpacing: -0.3 }}
      tone={tone ?? "default"}
      accessibilityLabel={`Rs ${formatNumber(Math.round(price))}`}
    >
      <Text weight="700" tone={tone ?? "muted"} style={{ fontSize: size === "xl" ? 16 : 12 }}>
        Rs{" "}
      </Text>
      {formatNumber(Math.round(price))}
    </Text>
  );
}

export function dealText(rating: string | null | undefined, price: number, median: number | null | undefined, peers?: number | null) {
  if (!rating || !median) return null;
  const diff = price - median;
  const pct = Math.round((Math.abs(diff) / median) * 100);
  const vs = `the ${formatLKRCompact(median)} median${peers ? ` of ${peers} similar ads` : ""}`;
  if (Math.abs(diff) < median * 0.005) return `Right at ${vs}`;
  return `${formatLKRCompact(Math.abs(diff))} (${pct}%) ${diff < 0 ? "below" : "above"} ${vs}`;
}

export function DealBadge({ rating }: { rating: string | null | undefined }) {
  const c = useColors();
  if (!rating) return null;
  if (rating === "good")
    return (
      <Badge tone="good" icon={<TrendingDown size={13} color={c.good} />}>
        Good price
      </Badge>
    );
  if (rating === "high")
    return (
      <Badge tone="high" icon={<TrendingUp size={13} color={c.high} />}>
        Above market
      </Badge>
    );
  return (
    <Badge tone="neutral" icon={<Minus size={13} color={c.fgMuted} />}>
      Fair price
    </Badge>
  );
}

type SpecSource = Pick<ListingCard, "year_manufactured" | "mileage_km" | "fuel" | "transmission" | "condition" | "vehicle_type">;

export function specItems(l: SpecSource) {
  const items: { key: string; Icon: typeof Calendar; text: string; label: string }[] = [{ key: "year", Icon: Calendar, text: String(l.year_manufactured), label: "Year" }];
  if (l.condition === "brand_new") items.push({ key: "km", Icon: Gauge, text: "Brand new", label: "Mileage" });
  else if (l.mileage_km != null) items.push({ key: "km", Icon: Gauge, text: formatKmShort(l.mileage_km), label: "Mileage" });
  if (l.fuel) items.push({ key: "fuel", Icon: Fuel, text: label(FUELS, l.fuel), label: "Fuel" });
  if (l.transmission && !NO_GEARBOX.includes(l.vehicle_type))
    items.push({ key: "gear", Icon: Cog, text: l.transmission === "automatic" ? "Auto" : label(TRANSMISSIONS, l.transmission), label: "Transmission" });
  return items;
}

/** Year, mileage, fuel and gearbox with small icons. */
export function SpecIcons({ l, max = 4, style }: { l: SpecSource; max?: number; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const items = specItems(l).slice(0, max);
  return (
    <View style={[styles.specs, style]} accessible accessibilityLabel={items.map((i) => `${i.label} ${i.text}`).join(", ")}>
      {items.map(({ key, Icon, text }) => (
        <View key={key} style={styles.spec}>
          <Icon size={14} color={c.fgSubtle} />
          <Text variant="small" tone="muted" numberOfLines={1}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Top ad / Urgent flags over a photo. */
export function Flags({ l }: { l: Pick<ListingCard, "is_top" | "is_urgent"> }) {
  if (!l.is_top && !l.is_urgent) return null;
  return (
    <View style={styles.flags} pointerEvents="none">
      {l.is_top && (
        <Badge tone="solidAccent" icon={<Crown size={12} color="#2a1a00" />}>
          Top ad
        </Badge>
      )}
      {l.is_urgent && (
        <Badge tone="solidDanger" icon={<Zap size={12} color="#ffffff" />}>
          Urgent
        </Badge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  specs: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 4, alignItems: "center" },
  spec: { flexDirection: "row", alignItems: "center", gap: 4 },
  flags: { position: "absolute", left: 10, top: 10, flexDirection: "row", gap: 6 },
});
