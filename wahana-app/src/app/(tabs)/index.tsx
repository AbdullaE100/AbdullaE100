import { router } from "expo-router";
import { Calculator, ChevronRight, Gauge, Heart, Search, Store } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VEHICLE_TYPES, typeBySlug } from "@shared/constants";
import { formatNumber } from "@shared/format";
import { Logo } from "@/components/logo";
import { Rail, SectionHeader } from "@/components/section";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VehicleArt } from "@/components/vehicle-art";
import { track } from "@/lib/analytics";
import { queryClient, useCardsByIds, useFacets, useHomeSummary, useRail } from "@/lib/api";
import { openSearch } from "@/lib/search-store";
import { recentStore, recordQuery } from "@/lib/store";
import { radius, type as typeScale, useColors } from "@/lib/theme";
import { useFavourites } from "@/providers/favourites";

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const summary = useHomeSummary();
  const facets = useFacets({});
  const deals = useRail("deals", { deal: "good" });
  const latest = useRail("latest", {});
  const recentIds = recentStore.use();
  const recent = useCardsByIds(recentIds.slice(0, 12));
  const { ids: savedIds } = useFavourites();
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["home"] }),
      queryClient.invalidateQueries({ queryKey: ["rail"] }),
      queryClient.invalidateQueries({ queryKey: ["facets"] }),
    ]);
    setRefreshing(false);
  }, []);

  const submit = () => {
    const text = q.trim();
    track("search_submitted", { source: "home", q: text || null });
    recordQuery(text);
    openSearch(text ? { q: text } : {});
    setQ("");
  };

  const s = summary.data;
  const types = VEHICLE_TYPES.filter((t) => !s || s.by_type[t.slug]);
  const makes = (facets.data?.make ?? []).slice(0, 12);
  const districts = (facets.data?.district ?? []).slice(0, 10);
  // Recently viewed keeps the order the person viewed them in.
  const recentItems = recent.data ? recentIds.map((id) => recent.data!.find((r) => r.id === id)).filter((x) => !!x) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} collapsable={false}>
      <View style={{ height: insets.top, backgroundColor: c.surface }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} colors={[c.brand]} />}
      >
        <View style={[styles.topbar, { backgroundColor: c.surface }]}>
          <Logo />
          <IconButton
            label={savedIds.length ? `Saved ads, ${savedIds.length}` : "Saved ads"}
            icon={<Heart size={22} color={c.fg} fill={savedIds.length ? c.fg : "transparent"} />}
            onPress={() => router.push("/saved")}
          />
        </View>

        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <Text variant="h1" style={styles.heroTitle} accessibilityRole="header">
            Find your next vehicle
          </Text>
          {s ? (
            <Text variant="body" tone="muted">
              {formatNumber(s.total)} cars, bikes and three-wheelers, each with a fair-price rating.
            </Text>
          ) : (
            <Skeleton w="80%" h={16} />
          )}
          <View style={[styles.searchBox, { borderColor: c.borderStrong, backgroundColor: c.surface }]}>
            <Search size={20} color={c.fgMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              onSubmitEditing={submit}
              placeholder="Make, model or keyword"
              placeholderTextColor={c.fgSubtle}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search vehicles"
              style={[styles.searchInput, { color: c.fg }]}
            />
            <Pressable onPress={submit} accessibilityRole="button" accessibilityLabel="Search" style={({ pressed }) => [styles.searchGo, { backgroundColor: pressed ? c.brandPressed : c.brand }]}>
              <Text weight="700" tone="inverse">
                Search
              </Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types} style={styles.bleed}>
            {types.map((t) => (
              <Pressable
                key={t.slug}
                onPress={() => openSearch({ type: t.slug })}
                accessibilityRole="button"
                accessibilityLabel={`${t.plural}${s?.by_type[t.slug] ? `, ${s.by_type[t.slug]} ads` : ""}`}
                style={({ pressed }) => [styles.typeTile, { backgroundColor: pressed ? c.surface3 : c.surface2 }]}
              >
                <VehicleArt type={t.slug} width={64} color={c.fgMuted} bg={c.surface2} />
                <Text variant="small" weight="700" numberOfLines={1}>
                  {t.short}
                </Text>
                {!!s?.by_type[t.slug] && (
                  <Text variant="caption" tone="subtle" numeric>
                    {formatNumber(s.by_type[t.slug])}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {!!recentItems?.length && (
          <View style={styles.section}>
            <SectionHeader title="Recently viewed" />
            <Rail items={recentItems} source="home_recent" />
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader
            title="Good deals"
            sub="At least 5% below similar ads of the same model, condition and year."
            action={s?.good_deals ? `All ${formatNumber(s.good_deals)}` : "See all"}
            onAction={() => openSearch({ deal: "good" })}
          />
          <Rail items={deals.data} loading={deals.isLoading} source="home_deals" />
        </View>

        {makes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Popular makes" action="All makes" onAction={() => openSearch({})} />
            <View style={styles.grid}>
              {makes.map((m) => (
                <Pressable
                  key={m.slug}
                  onPress={() => openSearch({ make: m.slug })}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.name}, ${m.count} ads`}
                  style={({ pressed }) => [styles.makeTile, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
                >
                  <Text variant="body" weight="700" numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text variant="caption" tone="subtle" numeric>
                    {formatNumber(m.count)} ads
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!!s?.popular_models.length && (
          <View style={styles.section}>
            <SectionHeader title="Popular models" />
            <View style={[styles.list, { borderColor: c.border, backgroundColor: c.surface }]}>
              {s.popular_models.slice(0, 8).map((m, i) => (
                <Pressable
                  key={`${m.make_slug}/${m.model_slug}`}
                  onPress={() => openSearch({ type: typeBySlug(m.type)?.slug, make: m.make_slug, model: m.model_slug })}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.listRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }, pressed && { backgroundColor: c.surface2 }]}
                >
                  <Text variant="bodyLg" weight="600" style={styles.flex} numberOfLines={1}>
                    {m.make} {m.model}
                  </Text>
                  <Text variant="small" tone="subtle" numeric>
                    {formatNumber(m.count)}
                  </Text>
                  <ChevronRight size={18} color={c.fgSubtle} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Recently added" sub="The newest ads from private sellers and dealers." action="See all" onAction={() => openSearch({})} />
          <Rail items={latest.data} loading={latest.isLoading} source="home_latest" />
        </View>

        {districts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Browse by district" />
            <View style={styles.chips}>
              {districts.map((d) => (
                <Pressable
                  key={d.slug}
                  onPress={() => openSearch({ district: d.slug })}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.chip, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
                >
                  <Text variant="small" weight="700">
                    {d.name}
                  </Text>
                  <Text variant="caption" tone="subtle" numeric>
                    {formatNumber(d.count)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.section, styles.tools]}>
          <Tool icon={<Gauge size={22} color={c.brandSoftFg} />} title="What's my vehicle worth?" body="See what similar vehicles are listed for." onPress={() => router.push("/value")} />
          <Tool icon={<Calculator size={22} color={c.brandSoftFg} />} title="Leasing calculator" body="Work out a monthly rental." onPress={() => router.push("/leasing")} />
          <Tool icon={<Store size={22} color={c.brandSoftFg} />} title="Dealer stock" body="Only ads from registered dealers." onPress={() => openSearch({ seller_type: "dealer" })} />
        </View>

        <View style={[styles.sell, { backgroundColor: c.brand }]}>
          <Text variant="h2" tone="inverse">
            Selling your vehicle?
          </Text>
          <Text variant="body" tone="inverse">
            Post your ad free in a few minutes. We'll show you what similar vehicles are listed for before you set a price.
          </Text>
          <Button title="Post an ad free" variant="secondary" size="lg" onPress={() => router.navigate("/sell")} style={styles.sellBtn} />
        </View>
      </ScrollView>
    </View>
  );
}

function Tool({ icon, title, body, onPress }: { icon: React.ReactNode; title: string; body: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tool, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
    >
      <View style={[styles.toolIcon, { backgroundColor: c.brandSoft }]}>{icon}</View>
      <View style={styles.flex}>
        <Text variant="body" weight="700">
          {title}
        </Text>
        <Text variant="small" tone="muted">
          {body}
        </Text>
      </View>
      <ChevronRight size={18} color={c.fgSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 32 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, height: 52 },
  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 8 },
  heroTitle: { letterSpacing: -0.4 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, borderWidth: 1.5, borderRadius: radius.xl, paddingLeft: 14, paddingRight: 5, minHeight: 54 },
  searchInput: { flex: 1, minWidth: 0, ...typeScale.bodyLg, paddingVertical: 12, outlineStyle: "none" } as object,
  searchGo: { height: 44, paddingHorizontal: 16, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  types: { gap: 10, paddingTop: 12, paddingHorizontal: 16 },
  bleed: { marginHorizontal: -16 },
  typeTile: { width: 96, borderRadius: radius.xl, paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", gap: 2 },
  section: { marginTop: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  makeTile: { width: "31%", flexGrow: 1, borderWidth: 1, borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 12, gap: 2 },
  list: { marginHorizontal: 16, borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingHorizontal: 16 },
  flex: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  tools: { paddingHorizontal: 16, gap: 10 },
  tool: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderWidth: 1, borderRadius: radius.xl },
  toolIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  sell: { marginTop: 32, marginHorizontal: 16, borderRadius: radius.xxl, padding: 20, gap: 8 },
  sellBtn: { marginTop: 8, alignSelf: "flex-start", borderColor: "transparent" },
});
