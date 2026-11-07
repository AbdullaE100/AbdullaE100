import { router, useLocalSearchParams } from "expo-router";
import { Bookmark, BookmarkCheck, Crown, SearchX, Search as SearchIcon, WifiOff, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { describeSearch, filtersToHref } from "@shared/search";
import { formatNumber } from "@shared/format";
import type { ListingCard } from "@shared/types";
import { ResultCard, ResultCardSkeleton } from "@/components/listing/cards";
import { applyFilter, SearchToolbar } from "@/components/search/toolbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { queryClient, resolveNames, useCatalog, useCities, useSavedSearches, useSearch } from "@/lib/api";
import { pendingAction } from "@/lib/pending";
import { paramsToFilters, searchStore, useFilters } from "@/lib/search-store";
import { recentQueriesStore, recordQuery } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { radius, type as typeScale, useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

type Row = { kind: "top-head" } | { kind: "card"; l: ListingCard; top?: boolean; i: number };

export default function SearchScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Record<string, string>>();
  const f = useFilters();
  const { userId } = useSession();
  const { toast } = useToast();
  const cat = useCatalog();
  const districtId = cat.data?.districts.find((d) => d.slug === f.district)?.id;
  const cities = useCities(f.city ? districtId : null);
  const names = resolveNames(f, cat.data, cities.data);
  const { title } = describeSearch(f, names);
  const q = useSearch(f);
  const saved = useSavedSearches(userId ?? undefined);
  const [text, setText] = useState(f.q ?? "");
  const [focused, setFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const recentQueries = recentQueriesStore.use();
  const listRef = useRef<FlatList<Row>>(null);

  // Deep links and pushes with params seed the store once per distinct param set.
  const paramKey = JSON.stringify(params);
  useEffect(() => {
    const fromParams = paramsToFilters(params);
    if (Object.keys(fromParams).length) searchStore.set(fromParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  // Keep the box in step when the query changes elsewhere (chips, deep links).
  const [shownQ, setShownQ] = useState(f.q);
  if (shownQ !== f.q) {
    setShownQ(f.q);
    setText(f.q ?? "");
  }

  const pages = q.data?.pages;
  const total = pages?.[0]?.total ?? 0;
  const key = JSON.stringify(f);
  useEffect(() => {
    if (pages?.[0]) {
      track("results_viewed", { total: pages[0].total, filters: Object.keys(f).length, has_q: !!f.q });
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
    // Only when the filter set changes, not on every page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, !!pages?.[0]]);

  const rows = useMemo<Row[]>(() => {
    if (!pages) return [];
    const top = pages[0]?.top ?? [];
    const topIds = new Set(top.map((t) => t.id));
    const seen = new Set<number>();
    const out: Row[] = [];
    if (top.length) {
      out.push({ kind: "top-head" });
      top.forEach((l, i) => {
        seen.add(l.id);
        out.push({ kind: "card", l, top: true, i });
      });
    }
    let i = 0;
    for (const p of pages)
      for (const l of p.items) {
        if (topIds.has(l.id) || seen.has(l.id)) continue;
        seen.add(l.id);
        out.push({ kind: "card", l, i: i++ });
      }
    return out;
  }, [pages]);

  const href = filtersToHref({ ...f, page: undefined });
  const savedRow = saved.data?.find((s) => s.query === href);

  const submit = (value = text) => {
    const v = value.trim();
    recordQuery(v);
    track("search_submitted", { source: "search_tab", q: v || null });
    applyFilter(f, { q: v || undefined }, "query");
    setFocused(false);
  };

  const save = async () => {
    if (!userId) {
      pendingAction.set({ kind: "save_search" });
      router.push({ pathname: "/signin", params: { reason: "save_search" } });
      return;
    }
    if (savedRow) {
      router.push("/searches");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("saved_searches").insert({ user_id: userId, label: title, query: href });
    setSaving(false);
    if (error) return toast({ tone: "error", title: "Couldn't save this search" });
    track("search_saved", { filters: Object.keys(f).length });
    queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    toast({ tone: "success", title: "Search saved", body: "We'll show you what's new each time you open it.", action: { label: "View", onPress: () => router.push("/searches") } });
  };

  // Finish "Save search" started before signing in, once saved searches have loaded.
  useEffect(() => {
    if (userId && saved.data && pendingAction.take("save_search")) void Promise.resolve().then(save);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, !!saved.data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await q.refetch();
    setRefreshing(false);
  };

  const header = (
    <View style={styles.listHead}>
      <Text variant="h3" accessibilityRole="header" numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.countRow}>
        <Text variant="body" tone="muted" style={styles.flex}>
          {q.isLoading ? (
            "Searching…"
          ) : (
            <>
              <Text variant="body" weight="800" numeric>
                {formatNumber(total)}
              </Text>{" "}
              {total === 1 ? "ad" : "ads"}
            </>
          )}
        </Text>
        <Pressable
          onPress={save}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={savedRow ? "Saved, open saved searches" : "Save search"}
          style={({ pressed }) => [styles.save, { borderColor: savedRow ? c.brand : c.borderStrong, backgroundColor: savedRow ? c.brandSoft : pressed ? c.surface2 : c.surface }]}
        >
          {savedRow ? <BookmarkCheck size={16} color={c.brandSoftFg} /> : <Bookmark size={16} color={c.fg} />}
          <Text variant="small" weight="700" style={{ color: savedRow ? c.brandSoftFg : c.fg }}>
            {savedRow ? "Saved" : "Save search"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} collapsable={false}>
      <View style={[styles.top, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={[styles.searchBox, { backgroundColor: c.surface2, borderColor: focused ? c.brand : "transparent" }]}>
          <SearchIcon size={19} color={c.fgMuted} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit()}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search make, model or keyword"
            placeholderTextColor={c.fgSubtle}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search vehicles"
            style={[styles.searchInput, { color: c.fg }]}
          />
          {!!text && (
            <Pressable
              onPress={() => {
                setText("");
                if (f.q) applyFilter(f, { q: undefined }, "query_clear");
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
              hitSlop={8}
            >
              <X size={18} color={c.fgMuted} />
            </Pressable>
          )}
        </View>
        {focused && !text && recentQueries.length > 0 && (
          <View style={styles.recent}>
            {recentQueries.map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  setText(r);
                  submit(r);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.recentChip, { backgroundColor: pressed ? c.surface3 : c.surface2 }]}
              >
                <Text variant="small" weight="600">
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.toolbarWrap}>
          <SearchToolbar f={f} names={names} />
        </View>
      </View>

      {q.isError && !pages ? (
        <EmptyState icon={<WifiOff size={30} color={c.brandSoftFg} />} title="Couldn't load ads" body="Check your connection and try again.">
          <Button title="Try again" onPress={() => q.refetch()} />
        </EmptyState>
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(r, i) => (r.kind === "card" ? `${r.top ? "t" : "n"}${r.l.id}` : `h${i}`)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) =>
            item.kind === "top-head" ? (
              <View style={styles.topHead}>
                <Crown size={16} color={c.accentFg} />
                <Text variant="small" weight="700" tone="accent">
                  Top ads
                </Text>
              </View>
            ) : (
              <ResultCard l={item.l} source={item.top ? "results_top" : "results"} priority={item.i < 2} />
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} colors={[c.brand]} />}
          ListEmptyComponent={
            q.isLoading ? (
              <View style={{ gap: 14 }}>
                <ResultCardSkeleton />
                <ResultCardSkeleton />
              </View>
            ) : (
              <EmptyState
                icon={<SearchX size={30} color={c.brandSoftFg} />}
                title="No ads match all of that"
                body="Try removing a filter or widening the price range. Save the search to check back later."
              >
                <Button title="Clear all filters" onPress={() => searchStore.set({})} />
                <Button title={savedRow ? "Saved" : "Save this search"} variant="secondary" onPress={save} />
              </EmptyState>
            )
          }
          ListFooterComponent={
            q.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={c.brand} />
            ) : rows.length > 0 && !q.hasNextPage ? (
              <Text variant="small" tone="subtle" style={styles.end}>
                You’ve seen all {formatNumber(total)} {total === 1 ? "ad" : "ads"}.
              </Text>
            ) : undefined
          }
          initialNumToRender={4}
          maxToRenderPerBatch={6}
          windowSize={9}
          removeClippedSubviews
        />
      )}
      {q.isFetching && !q.isLoading && !q.isFetchingNextPage && !refreshing && (
        <View style={[styles.updating, { backgroundColor: c.fg }]} pointerEvents="none">
          <ActivityIndicator size="small" color={c.bg} />
          <Text variant="small" weight="700" style={{ color: c.bg }}>
            Updating
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { borderBottomWidth: StyleSheet.hairlineWidth },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, paddingHorizontal: 12, borderRadius: radius.xl, minHeight: 46, borderWidth: 1.5 },
  searchInput: { flex: 1, minWidth: 0, ...typeScale.bodyLg, paddingVertical: 10, outlineStyle: "none" } as object,
  recent: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  recentChip: { borderRadius: 999, paddingHorizontal: 12, minHeight: 34, justifyContent: "center" },
  toolbarWrap: { marginTop: 2 },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  listHead: { marginBottom: 14, gap: 6 },
  countRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  flex: { flex: 1 },
  save: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  topHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: -4 },
  footer: { paddingVertical: 24 },
  end: { textAlign: "center", paddingVertical: 24 },
  updating: {
    position: "absolute",
    alignSelf: "center",
    bottom: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
