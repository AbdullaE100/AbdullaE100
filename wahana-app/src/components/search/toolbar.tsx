import { router } from "expo-router";
import { ArrowUpDown, ChevronDown, SlidersHorizontal, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SORTS, VEHICLE_TYPES, label } from "@shared/constants";
import { activeChips, countActive, withFilter, type Filters, type Names } from "@shared/search";
import { OptionSheet, type Option } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { track } from "@/lib/analytics";
import { useCatalog, useFacets } from "@/lib/api";
import { filtersToParams, searchStore } from "@/lib/search-store";
import { useColors } from "@/lib/theme";

type Picker = null | "type" | "make" | "model" | "sort";

export function applyFilter(f: Filters, patch: Partial<Filters>, how: string) {
  const next = withFilter(f, patch);
  track("filter_applied", { how, keys: Object.keys(patch) });
  searchStore.set(next);
}

/** Quick filters under the search bar: the four people change most, plus sort. */
export function SearchToolbar({ f, names }: { f: Filters; names: Names }) {
  const c = useColors();
  const [picker, setPicker] = useState<Picker>(null);
  const cat = useCatalog();
  const typeFacets = useFacets({ ...f, type: undefined, make: undefined, model: undefined }, picker === "type");
  const makeFacets = useFacets({ ...f, make: undefined, model: undefined }, picker === "make");
  const n = countActive(f);

  const typeOptions: Option[] = VEHICLE_TYPES.map((t) => ({ value: t.slug, label: t.plural, count: typeFacets.data?.type?.[t.slug] }));
  const makeOptions = useMemo<Option[]>(() => {
    const counts = new Map((makeFacets.data?.make ?? []).map((m) => [m.slug, m.count]));
    return (cat.data?.makes ?? [])
      .filter((m) => !f.type || m.vehicle_types.includes(f.type))
      .map((m) => ({ value: m.slug, label: m.name, count: counts.get(m.slug), group: m.is_popular ? "Popular" : "All makes" }))
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1));
  }, [cat.data, f.type, makeFacets.data]);
  const modelOptions = useMemo<Option[]>(() => {
    const make = cat.data?.makes.find((m) => m.slug === f.make);
    if (!make) return [];
    const seen = new Set<string>();
    return (cat.data?.models ?? [])
      .filter((m) => m.make_id === make.id && (!f.type || m.vehicle_type === f.type))
      .filter((m) => (seen.has(m.slug) ? false : (seen.add(m.slug), true)))
      .map((m) => ({ value: m.slug, label: m.name }));
  }, [cat.data, f.make, f.type]);

  const chips = activeChips(f, names).filter((ch) => ch.key !== "make" && ch.key !== "model" && ch.key !== "q");

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
        <ToolChip
          label={n ? `Filters · ${n}` : "Filters"}
          active={n > 0}
          icon={<SlidersHorizontal size={16} color={n ? c.brandSoftFg : c.fg} />}
          onPress={() => router.push({ pathname: "/filters", params: filtersToParams(f) })}
        />
        <ToolChip label={f.type ? VEHICLE_TYPES.find((t) => t.slug === f.type)?.short ?? "Type" : "Type"} active={!!f.type} caret onPress={() => setPicker("type")} />
        <ToolChip label={names.make ?? "Make"} active={!!f.make} caret onPress={() => setPicker("make")} />
        {!!f.make && <ToolChip label={names.model ?? "Model"} active={!!f.model} caret onPress={() => setPicker("model")} />}
        <ToolChip
          label={f.sort ? label(SORTS, f.sort) : "Sort"}
          active={!!f.sort && f.sort !== "newest"}
          icon={<ArrowUpDown size={15} color={f.sort && f.sort !== "newest" ? c.brandSoftFg : c.fg} />}
          onPress={() => setPicker("sort")}
        />
        {!f.deal && <ToolChip label="Good price" onPress={() => applyFilter(f, { deal: "good" }, "quick")} />}
        {chips.map((ch) => (
          <ToolChip key={ch.key} label={ch.label} active removable onPress={() => applyFilter(f, ch.clear, "chip_remove")} />
        ))}
      </ScrollView>

      <OptionSheet title="Vehicle type" open={picker === "type"} onClose={() => setPicker(null)} options={typeOptions} value={f.type} anyLabel="All vehicles" onChange={(v) => applyFilter(f, { type: v ?? undefined }, "quick_type")} />
      <OptionSheet
        title="Make"
        open={picker === "make"}
        onClose={() => setPicker(null)}
        options={makeOptions}
        value={f.make}
        anyLabel="Any make"
        searchable
        placeholder="Search makes"
        onChange={(v) => applyFilter(f, { make: v ?? undefined }, "quick_make")}
      />
      <OptionSheet
        title={names.make ? `${names.make} model` : "Model"}
        open={picker === "model"}
        onClose={() => setPicker(null)}
        options={modelOptions}
        value={f.model}
        anyLabel="Any model"
        placeholder="Search models"
        onChange={(v) => applyFilter(f, { model: v ?? undefined }, "quick_model")}
      />
      <OptionSheet
        title="Sort by"
        open={picker === "sort"}
        onClose={() => setPicker(null)}
        options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
        value={f.sort ?? "newest"}
        searchable={false}
        onChange={(v) => applyFilter(f, { sort: v && v !== "newest" ? v : undefined }, "sort")}
      />
    </>
  );
}

function ToolChip({ label: text, active, caret, removable, icon, onPress }: { label: string; active?: boolean; caret?: boolean; removable?: boolean; icon?: React.ReactNode; onPress: () => void }) {
  const c = useColors();
  const fg = active ? c.brandSoftFg : c.fg;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={removable ? `Remove filter ${text}` : text}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.chip, { borderColor: active ? c.brand : c.borderStrong, backgroundColor: active ? c.brandSoft : pressed ? c.surface2 : c.surface }]}
    >
      {icon}
      <Text variant="small" weight="700" style={{ color: fg }} numberOfLines={1}>
        {text}
      </Text>
      {caret && <ChevronDown size={15} color={fg} />}
      {removable && (
        <View style={[styles.x, { backgroundColor: c.brand }]}>
          <X size={11} color="#fff" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, maxWidth: 220 },
  x: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
