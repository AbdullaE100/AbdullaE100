import { useLocalSearchParams } from "expo-router";
import { Info, Minus, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { formatLakhs, formatLKR } from "@shared/format";
import { LEASE_DEFAULTS, monthlyPayment } from "@shared/finance";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { radius, useColors } from "@/lib/theme";

const TERMS = [12, 24, 36, 48, 60, 72];

export default function LeasingScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ price?: string }>();
  const [price, setPrice] = useState(Number(params.price) || 6_000_000);
  const [downPct, setDownPct] = useState(LEASE_DEFAULTS.downPct);
  const [term, setTerm] = useState(LEASE_DEFAULTS.months);
  const [rate, setRate] = useState(String(LEASE_DEFAULTS.rate));

  const { down, loan, monthly, interest } = useMemo(() => {
    const down = Math.round((price * downPct) / 100);
    const loan = Math.max(0, price - down);
    const monthly = monthlyPayment(loan, Number(rate) || 0, term);
    return { down, loan, monthly, interest: Math.max(0, monthly * term - loan) };
  }, [price, downPct, term, rate]);

  const step = (d: number) => setDownPct((p) => Math.min(90, Math.max(10, p + d)));

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.result, { backgroundColor: c.brandSoft }]} accessibilityLiveRegion="polite">
        <Text variant="small" weight="700" style={{ color: c.brandSoftFg }}>
          Estimated monthly rental
        </Text>
        <Text weight="800" numeric style={[styles.big, { color: c.brandSoftFg }]}>
          {formatLKR(monthly)}
        </Text>
        <Text variant="small" style={{ color: c.brandSoftFg }}>
          for {term / 12} {term === 12 ? "year" : "years"} at {Number(rate) || 0}% a year
        </Text>
        <View style={[styles.split, { borderTopColor: c.brand }]}>
          <Row k="Down payment" v={formatLKR(down)} />
          <Row k="Leased amount" v={formatLKR(loan)} />
          <Row k="Total interest" v={formatLKR(interest)} />
        </View>
      </View>

      <Input
        label="Vehicle price"
        prefix="Rs"
        keyboardType="number-pad"
        value={price ? price.toLocaleString("en-LK") : ""}
        onChangeText={(t) => setPrice(Number(t.replace(/\D/g, "").slice(0, 11)) || 0)}
        hint={formatLakhs(price) || undefined}
      />

      <View style={styles.field}>
        <Text variant="small" weight="700">
          Down payment
        </Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => step(-5)}
            disabled={downPct <= 10}
            accessibilityRole="button"
            accessibilityLabel="Decrease down payment"
            style={[styles.stepBtn, { borderColor: c.borderStrong }, downPct <= 10 && styles.off]}
          >
            <Minus size={20} color={c.fg} />
          </Pressable>
          <View
            style={styles.stepVal}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Down payment"
            aria-valuemin={10}
            aria-valuemax={90}
            aria-valuenow={downPct}
            aria-valuetext={`${downPct} percent, ${formatLKR(down)}`}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 5 : -5)}
          >
            <Text variant="h3" numeric>
              {downPct}%
            </Text>
            <Text variant="small" tone="muted" numeric>
              {formatLKR(down)}
            </Text>
          </View>
          <Pressable
            onPress={() => step(5)}
            disabled={downPct >= 90}
            accessibilityRole="button"
            accessibilityLabel="Increase down payment"
            style={[styles.stepBtn, { borderColor: c.borderStrong }, downPct >= 90 && styles.off]}
          >
            <Plus size={20} color={c.fg} />
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text variant="small" weight="700">
          Term
        </Text>
        <View style={styles.wrap}>
          {TERMS.map((t) => (
            <Chip key={t} label={`${t / 12} yr`} selected={term === t} onPress={() => setTerm(t)} />
          ))}
        </View>
      </View>

      <Input label="Interest rate per year" keyboardType="decimal-pad" suffix="%" value={rate} onChangeText={(t) => setRate(t.replace(/[^\d.]/g, "").slice(0, 5))} />

      <View style={[styles.note, { backgroundColor: c.surface2 }]}>
        <Info size={18} color={c.fgMuted} />
        <Text variant="small" tone="muted" style={styles.flex}>
          An estimate on a reducing balance. Leasing companies set their own rates, fees and insurance, so confirm with a lender before you commit.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Text variant="small" style={{ color: c.brandSoftFg }}>
        {k}
      </Text>
      <Text variant="small" weight="700" numeric style={{ color: c.brandSoftFg }}>
        {v}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  result: { borderRadius: radius.xxl, padding: 18, gap: 4 },
  big: { fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  split: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 10, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  field: { gap: 8 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepVal: { flex: 1, alignItems: "center" },
  off: { opacity: 0.4 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg },
  flex: { flex: 1 },
});
