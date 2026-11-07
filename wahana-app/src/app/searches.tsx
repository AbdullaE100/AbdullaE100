import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { Bookmark, ChevronRight, Trash2 } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { formatDate, formatNumber } from "@shared/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { parseSavedQuery, useSavedSearchStats, useSavedSearches, type SavedSearch } from "@/lib/api";
import { openWeb } from "@/lib/links";
import { openSearch } from "@/lib/search-store";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

export default function SearchesScreen() {
  const c = useColors();
  const { userId, ready } = useSession();
  const q = useSavedSearches(userId ?? undefined);
  if (ready && !userId) return <Redirect href={{ pathname: "/signin", params: { reason: "save_search" } }} />;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={q.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          (q.data?.length ?? 0) > 0 ? (
            <Text tone="muted" style={styles.head}>
              See what’s new since you last looked.
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          q.isLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton h={76} r={radius.xl} />
              <Skeleton h={76} r={radius.xl} />
            </View>
          ) : (
            <EmptyState icon={<Bookmark size={30} color={c.brandSoftFg} />} title="No saved searches" body="Run a search, then tap Save search to come back to it and see new ads.">
              <Button title="Start a search" onPress={() => openSearch({})} />
            </EmptyState>
          )
        }
        renderItem={({ item }) => <Row s={item} />}
      />
    </View>
  );
}

function Row({ s }: { s: SavedSearch }) {
  const c = useColors();
  const qc = useQueryClient();
  const { toast } = useToast();
  const stats = useSavedSearchStats(s);
  const st = stats.data;

  const open = () => {
    const parsed = parseSavedQuery(s.query);
    supabase
      .from("saved_searches")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", s.id)
      .then(() => qc.invalidateQueries({ queryKey: ["saved-searches"] }));
    if (!parsed) return;
    if (parsed.dealerSlug) return openWeb(s.query);
    openSearch(parsed.filters);
  };

  const remove = async () => {
    const { error } = await supabase.from("saved_searches").delete().eq("id", s.id);
    if (error) return toast({ tone: "error", title: "Couldn't delete that search" });
    qc.invalidateQueries({ queryKey: ["saved-searches"] });
    toast({ title: "Search deleted" });
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`Open search: ${s.label}`} style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}>
        <View style={[styles.icon, { backgroundColor: c.brandSoft }]}>
          <Bookmark size={20} color={c.brandSoftFg} />
        </View>
        <View style={styles.flex}>
          <Text variant="body" weight="700" numberOfLines={2}>
            {s.label}
          </Text>
          <Text variant="small" tone="muted">
            {st === "unavailable" ? "No longer available" : st ? `${formatNumber(st.total)} ads` : "Checking…"} · saved {formatDate(s.created_at)}
          </Text>
        </View>
        {st && st !== "unavailable" && st.fresh > 0 && (
          <View style={[styles.fresh, { backgroundColor: c.goodSoft }]}>
            <Text variant="caption" weight="800" tone="good">
              {st.fresh >= 48 ? "48+" : st.fresh} new
            </Text>
          </View>
        )}
        <ChevronRight size={18} color={c.fgSubtle} />
      </Pressable>
      <Pressable
        onPress={remove}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${s.label}`}
        hitSlop={6}
        style={({ pressed }) => [styles.del, pressed && { backgroundColor: c.dangerSoft }]}
      >
        <Trash2 size={18} color={c.fgSubtle} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  head: { marginBottom: 12 },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.xl, paddingLeft: 12 },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  icon: { width: 42, height: 42, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1, gap: 2 },
  fresh: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  del: { width: 48, alignSelf: "stretch", alignItems: "center", justifyContent: "center", borderTopRightRadius: radius.xl, borderBottomRightRadius: radius.xl },
});
