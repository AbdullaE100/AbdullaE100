import { useLocalSearchParams } from "expo-router";
import { Crown, ExternalLink, RefreshCw, Zap } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { formatLKR } from "@shared/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useListing, usePromotionProducts } from "@/lib/api";
import { openWeb } from "@/lib/links";
import { radius, useColors } from "@/lib/theme";

const ICON = { top: Crown, urgent: Zap, bump: RefreshCw } as const;

/**
 * Boost options. Payment happens on the website (PayHere card checkout), so
 * the app shows what each option does and hands over with the ad preselected.
 */
export default function PromoteScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ad = useListing(Number(id));
  const products = usePromotionProducts();
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content}>
      {ad.data && (
        <Text variant="title" numberOfLines={2}>
          {ad.data.title}
        </Text>
      )}
      <Text tone="muted">Boosted ads appear above others in search and on the home screen, so more buyers see them first.</Text>
      {products.isLoading && <Skeleton h={120} r={radius.xl} />}
      {(products.data ?? []).map((p) => {
        const I = ICON[p.kind] ?? Crown;
        return (
          <View key={p.slug} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.icon, { backgroundColor: p.kind === "urgent" ? c.dangerSoft : c.accentSoft }]}>
              <I size={22} color={p.kind === "urgent" ? c.danger : c.accentFg} />
            </View>
            <View style={styles.flex}>
              <Text variant="body" weight="700">
                {p.name}
              </Text>
              <Text variant="small" tone="muted">
                {p.description}
              </Text>
            </View>
            <View style={styles.price}>
              <Text variant="body" weight="800" numeric>
                {formatLKR(p.price_lkr)}
              </Text>
              {p.days > 0 && (
                <Text variant="caption" tone="subtle">
                  {p.days} days
                </Text>
              )}
            </View>
          </View>
        );
      })}
      <Button title="Choose and pay on wahana.lk" size="lg" icon={<ExternalLink size={18} color="#fff" />} onPress={() => openWeb(`/account/promote/${id}`)} />
      <Text variant="small" tone="subtle" style={styles.center}>
        Secure card payment by PayHere. Your boost starts as soon as the payment goes through.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  card: { flexDirection: "row", gap: 12, alignItems: "center", borderWidth: 1, borderRadius: radius.xl, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1, gap: 2 },
  price: { alignItems: "flex-end" },
  center: { textAlign: "center" },
});
