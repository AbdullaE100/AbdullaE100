import { useQuery } from "@tanstack/react-query";
import { Gauge, Info } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CONDITIONS, MAX_YEAR, VEHICLE_TYPES } from "@shared/constants";
import { formatKm, formatLKR, formatLKRCompact } from "@shared/format";
import type { PriceSpread } from "@shared/types";
import { Rail } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SelectField } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { rpcSearch, useCatalog } from "@/lib/api";
import { openSearch } from "@/lib/search-store";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";

const YEARS = Array.from({ length: MAX_YEAR - 1979 }, (_, i) => String(MAX_YEAR - i));

export default function ValueScreen() {
  const c = useColors();
  const cat = useCatalog();
  const [type, setType] = useState("car");
  const [makeId, setMakeId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [condition, setCondition] = useState("used");
  const [asked, setAsked] = useState<{ modelId: number; year: number; condition: string } | null>(null);

  const makes = useMemo(
    () =>
      (cat.data?.makes ?? [])
        .filter((m) => m.vehicle_types.includes(type))
        .map((m) => ({ value: m.id, label: m.name, group: m.is_popular ? "Popular" : "All makes" }))
        .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1)),
    [cat.data, type],
  );
  const models = useMemo(
    () => (cat.data?.models ?? []).filter((m) => m.make_id === makeId && m.vehicle_type === type).map((m) => ({ value: m.id, label: m.name })),
    [cat.data, makeId, type],
  );
  const make = cat.data?.makes.find((m) => m.id === makeId);
  const model = cat.data?.models.find((m) => m.id === asked?.modelId);

  const result = useQuery({
    queryKey: ["value", asked],
    enabled: !!asked && !!model,
    queryFn: async () => {
      const y = asked!.year;
      const mk = cat.data!.makes.find((m) => m.id === model!.make_id)!;
      const filters = { type, make: mk.slug, model: model!.slug, condition: asked!.condition, year_min: String(y - 1), year_max: String(y + 1) };
      const [{ data: s }, r] = await Promise.all([
        supabase.rpc("price_spread", { p_model_id: asked!.modelId, p_condition: asked!.condition, p_year: y }),
        rpcSearch({ ...filters, page_size: 6, sort: "price_asc" }),
      ]);
      const spread = s as unknown as PriceSpread | null;
      return { spread: spread && spread.peer_count > 0 ? spread : null, examples: r.items, filters };
    },
  });

  const s = result.data?.spread;
  const lo = s?.min ?? 0;
  const hi = s?.max ?? 0;
  const span = hi - lo || 1;
  const x = (v: number) => `${((v - lo) / span) * 100}%` as const;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text tone="muted">See what vehicles like yours are listed for right now, from live ads of the same model, condition and year (±1).</Text>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.wrap}>
          {VEHICLE_TYPES.slice(0, 6).map((t) => (
            <Chip
              key={t.slug}
              label={t.short}
              selected={type === t.slug}
              onPress={() => {
                setType(t.slug);
                setMakeId(null);
                setModelId(null);
              }}
            />
          ))}
        </View>
        <SelectField<number>
          label="Make"
          value={makeId}
          options={makes}
          placeholder="Choose the make"
          onChange={(v) => {
            setMakeId(v);
            setModelId(null);
          }}
        />
        <SelectField<number>
          label="Model"
          value={modelId}
          options={models}
          disabled={!makeId}
          placeholder={makeId ? "Choose the model" : "Choose a make first"}
          onChange={setModelId}
        />
        <SelectField label="Year made" value={year} options={YEARS.map((y) => ({ value: y, label: y }))} placeholder="Year" onChange={setYear} />
        <View style={styles.wrap}>
          {CONDITIONS.map((o) => (
            <Chip key={o.value} label={o.label} selected={condition === o.value} onPress={() => setCondition(o.value)} />
          ))}
        </View>
        <Button
          title="Check value"
          size="lg"
          icon={<Gauge size={18} color="#fff" />}
          disabled={!modelId || !year}
          loading={result.isFetching}
          onPress={() => modelId && year && setAsked({ modelId, year: Number(year), condition })}
        />
      </View>

      {asked && result.data && (
        <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text variant="title">
            {make?.name} {model?.name} {asked.year}
          </Text>
          {s && s.median != null && s.min != null && s.max != null ? (
            <>
              <Text variant="small" tone="muted">
                Typical asking price, from {s.peer_count} live {s.peer_count === 1 ? "ad" : "ads"}
              </Text>
              <Text weight="800" numeric style={styles.big}>
                {formatLKR(s.median)}
              </Text>
              <View style={[styles.track, { backgroundColor: c.surface3 }]}>
                {s.p25 != null && s.p75 != null && (
                  <View style={[styles.band, { left: x(s.p25), width: `${((s.p75 - s.p25) / span) * 100}%`, backgroundColor: c.brandSoft, borderColor: c.brand }]} />
                )}
                <View style={[styles.median, { left: x(s.median), backgroundColor: c.brand }]} />
              </View>
              <View style={styles.scale}>
                <Text variant="caption" tone="subtle" numeric>
                  {formatLKRCompact(s.min)}
                </Text>
                <Text variant="caption" weight="700" tone="brand" numeric>
                  Middle half {formatLKRCompact(s.p25)} – {formatLKRCompact(s.p75)}
                </Text>
                <Text variant="caption" tone="subtle" numeric>
                  {formatLKRCompact(s.max)}
                </Text>
              </View>
              {s.median_mileage != null && (
                <Text variant="small" tone="muted">
                  Median mileage of these ads: {formatKm(s.median_mileage)}. Lower mileage and a full service history push the price up.
                </Text>
              )}
            </>
          ) : (
            <View style={[styles.note, { backgroundColor: c.surface2 }]}>
              <Info size={18} color={c.fgMuted} />
              <Text variant="small" tone="muted" style={styles.flex}>
                No live ads match this model, condition and year closely enough yet. Try a nearby year or another condition.
              </Text>
            </View>
          )}
          {result.data.examples.length > 0 && <Button title="See these ads" variant="outline" onPress={() => openSearch(result.data!.filters)} />}
        </View>
      )}
      {asked && (result.data?.examples.length ?? 0) > 0 && (
        <View style={styles.examples}>
          <Text variant="title" style={styles.pad}>
            Cheapest similar ads
          </Text>
          <Rail items={result.data!.examples} source="value" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  form: { borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 14 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  big: { fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
  track: { height: 10, borderRadius: 5, marginTop: 12 },
  band: { position: "absolute", top: 0, bottom: 0, borderRadius: 5, borderWidth: 1 },
  median: { position: "absolute", top: -4, width: 3, height: 18, borderRadius: 2, marginLeft: -1 },
  scale: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  note: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg },
  flex: { flex: 1 },
  examples: { marginHorizontal: -16, gap: 10 },
  pad: { paddingHorizontal: 16 },
});
