import { router, Stack, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BODY_TYPES, CONDITIONS, FUELS, MAX_YEAR, MILEAGE_STEPS, PRICE_STEPS, TRANSMISSIONS, VEHICLE_TYPES } from "@shared/constants";
import { formatKmShort, formatLKRCompact, formatNumber } from "@shared/format";
import { countActive, withFilter, type Filters } from "@shared/search";
import { NO_GEARBOX } from "@/components/listing/bits";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SelectField, type Option } from "@/components/ui/select";
import { SwitchRow } from "@/components/ui/switch-row";
import { Text } from "@/components/ui/text";
import { track } from "@/lib/analytics";
import { useCatalog, useCities, useSearchCount } from "@/lib/api";
import { paramsToFilters, searchStore } from "@/lib/search-store";
import { useColors } from "@/lib/theme";

const YEARS = Array.from({ length: MAX_YEAR - 1979 }, (_, i) => String(MAX_YEAR - i));

export default function FiltersScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Record<string, string>>();
  const initial = useMemo(() => paramsToFilters(params), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState<Filters>(initial);
  const set = (patch: Partial<Filters>) => setF((cur) => withFilter(cur, patch));
  const toggle = (key: keyof Filters, value: string) => set({ [key]: f[key] === value ? undefined : value });
  const cat = useCatalog();
  const count = useSearchCount(f);
  const district = cat.data?.districts.find((d) => d.slug === f.district);
  const cities = useCities(district?.id);

  const makeOptions = useMemo<Option[]>(
    () =>
      (cat.data?.makes ?? [])
        .filter((m) => !f.type || m.vehicle_types.includes(f.type))
        .map((m) => ({ value: m.slug, label: m.name, group: m.is_popular ? "Popular" : "All makes" }))
        .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1)),
    [cat.data, f.type],
  );
  const modelOptions = useMemo<Option[]>(() => {
    const make = cat.data?.makes.find((m) => m.slug === f.make);
    if (!make) return [];
    const seen = new Set<string>();
    return (cat.data?.models ?? [])
      .filter((m) => m.make_id === make.id && (!f.type || m.vehicle_type === f.type))
      .filter((m) => (seen.has(m.slug) ? false : (seen.add(m.slug), true)))
      .map((m) => ({ value: m.slug, label: m.name }));
  }, [cat.data, f.make, f.type]);
  const priceOptions = (other?: string, side?: "min" | "max"): Option[] =>
    PRICE_STEPS.filter((p) => !other || (side === "min" ? p < Number(other) : p > Number(other))).map((p) => ({ value: String(p), label: formatLKRCompact(p) }));
  const yearOptions = (other?: string, side?: "min" | "max"): Option[] =>
    YEARS.filter((y) => !other || (side === "min" ? y <= other : y >= other)).map((y) => ({ value: y, label: y }));
  const bodies = f.type ? BODY_TYPES[f.type] ?? [] : [];
  const showGearbox = !f.type || !NO_GEARBOX.includes(f.type);

  const apply = () => {
    track("filter_applied", { how: "sheet", active: countActive(f) });
    searchStore.set(f);
    router.back();
  };

  const n = count.data;
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close filters" hitSlop={10} style={styles.headerBtn}>
              <X size={24} color={c.fg} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => setF(f.q ? { q: f.q } : {})} accessibilityRole="button" hitSlop={10} style={styles.headerBtn}>
              <Text weight="700" tone="brand">
                Reset
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Group title="Vehicle type">
          <View style={styles.wrap}>
            <Chip label="All" selected={!f.type} onPress={() => set({ type: undefined })} />
            {VEHICLE_TYPES.map((t) => (
              <Chip key={t.slug} label={t.short} selected={f.type === t.slug} onPress={() => toggle("type", t.slug)} />
            ))}
          </View>
        </Group>

        <Group title="Make and model">
          <SelectField label="Make" value={f.make ?? null} options={makeOptions} anyLabel="Any make" placeholder="Any make" onChange={(v) => set({ make: v ?? undefined })} />
          <SelectField
            label="Model"
            value={f.model ?? null}
            options={modelOptions}
            anyLabel="Any model"
            placeholder={f.make ? "Any model" : "Choose a make first"}
            disabled={!f.make}
            onChange={(v) => set({ model: v ?? undefined })}
          />
        </Group>

        <Group title="Price">
          <View style={styles.pair}>
            <View style={styles.flex}>
              <SelectField label="Min" value={f.price_min ?? null} options={priceOptions(f.price_max, "min")} anyLabel="No min" placeholder="No min" onChange={(v) => set({ price_min: v ?? undefined })} />
            </View>
            <View style={styles.flex}>
              <SelectField label="Max" value={f.price_max ?? null} options={priceOptions(f.price_min, "max")} anyLabel="No max" placeholder="No max" onChange={(v) => set({ price_max: v ?? undefined })} />
            </View>
          </View>
        </Group>

        <Group title="Year">
          <View style={styles.pair}>
            <View style={styles.flex}>
              <SelectField label="From" value={f.year_min ?? null} options={yearOptions(f.year_max, "min")} anyLabel="Any" placeholder="Any" onChange={(v) => set({ year_min: v ?? undefined })} />
            </View>
            <View style={styles.flex}>
              <SelectField label="To" value={f.year_max ?? null} options={yearOptions(f.year_min, "max")} anyLabel="Any" placeholder="Any" onChange={(v) => set({ year_max: v ?? undefined })} />
            </View>
          </View>
        </Group>

        <Group title="Condition">
          <View style={styles.wrap}>
            {CONDITIONS.map((o) => (
              <Chip key={o.value} label={o.label} selected={f.condition === o.value} onPress={() => toggle("condition", o.value)} />
            ))}
          </View>
        </Group>

        <Group title="Mileage">
          <View style={styles.wrap}>
            {MILEAGE_STEPS.map((m) => (
              <Chip key={m} label={`Under ${formatKmShort(m)}`} selected={f.mileage_max === String(m)} onPress={() => toggle("mileage_max", String(m))} />
            ))}
          </View>
        </Group>

        <Group title="Fuel">
          <View style={styles.wrap}>
            {FUELS.filter((o) => o.value !== "other").map((o) => (
              <Chip key={o.value} label={o.label} selected={f.fuel === o.value} onPress={() => toggle("fuel", o.value)} />
            ))}
          </View>
        </Group>

        {showGearbox && (
          <Group title="Transmission">
            <View style={styles.wrap}>
              {TRANSMISSIONS.filter((o) => o.value !== "other").map((o) => (
                <Chip key={o.value} label={o.label} selected={f.transmission === o.value} onPress={() => toggle("transmission", o.value)} />
              ))}
            </View>
          </Group>
        )}

        {bodies.length > 1 && (
          <Group title="Body">
            <View style={styles.wrap}>
              {bodies.map((o) => (
                <Chip key={o.value} label={o.label} selected={f.body === o.value} onPress={() => toggle("body", o.value)} />
              ))}
            </View>
          </Group>
        )}

        <Group title="Location">
          <SelectField
            label="District"
            value={f.district ?? null}
            options={(cat.data?.districts ?? []).map((d) => ({ value: d.slug, label: d.name }))}
            anyLabel="All of Sri Lanka"
            placeholder="All of Sri Lanka"
            onChange={(v) => set({ district: v ?? undefined })}
          />
          {!!f.district && (
            <SelectField
              label="Town"
              value={f.city ?? null}
              options={(cities.data ?? []).map((ct) => ({ value: ct.slug, label: ct.name, group: ct.is_major ? "Main towns" : "Other towns" }))}
              anyLabel={`All of ${district?.name ?? "the district"}`}
              placeholder={`All of ${district?.name ?? "the district"}`}
              onChange={(v) => set({ city: v ?? undefined })}
            />
          )}
        </Group>

        <Group title="Seller">
          <View style={styles.wrap}>
            <Chip label="Anyone" selected={!f.seller_type} onPress={() => set({ seller_type: undefined })} />
            <Chip label="Private sellers" selected={f.seller_type === "private"} onPress={() => toggle("seller_type", "private")} />
            <Chip label="Dealers" selected={f.seller_type === "dealer"} onPress={() => toggle("seller_type", "dealer")} />
          </View>
        </Group>

        <Group title="More">
          <SwitchRow label="Good price only" hint="At least 5% below similar ads" value={f.deal === "good"} onChange={(v) => set({ deal: v ? "good" : undefined })} />
          <SwitchRow label="With photos" value={f.photos === "true"} onChange={(v) => set({ photos: v ? "true" : undefined })} />
          <SwitchRow label="Leasing available" value={f.leasing === "true"} onChange={(v) => set({ leasing: v ? "true" : undefined })} />
        </Group>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title="Clear" variant="secondary" size="lg" onPress={() => setF({})} />
        <Button
          title={n == null ? "Show ads" : n === 0 ? "No ads match" : `Show ${formatNumber(n)} ${n === 1 ? "ad" : "ads"}`}
          size="lg"
          style={styles.flex}
          loading={count.isFetching && n == null}
          onPress={apply}
        />
      </View>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.group, { borderBottomColor: c.border }]}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  headerBtn: { minHeight: 40, minWidth: 40, justifyContent: "center", paddingHorizontal: 4 },
  group: { paddingVertical: 18, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pair: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
