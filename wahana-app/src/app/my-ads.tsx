import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Redirect, router, Stack } from "expo-router";
import { CheckCircle2, Eye, LayoutList, MessageCircle, Pencil, Phone, Plus, RotateCcw, Rocket, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { daysUntil, formatDate, formatLKR, formatNumber } from "@shared/format";
import { DealBadge } from "@/components/listing/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { VehicleArt } from "@/components/vehicle-art";
import { useMyAds, type MyAd } from "@/lib/api";
import { photoUrl } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

const TABS = [
  { id: "active", label: "Live", match: (s: string) => s === "active" },
  { id: "sold", label: "Sold", match: (s: string) => s === "sold" },
  { id: "expired", label: "Expired", match: (s: string) => s === "expired" },
  { id: "other", label: "Hidden", match: (s: string) => ["under_review", "rejected", "removed"].includes(s) },
] as const;

const STATUS: Record<string, { label: string; tone: "good" | "neutral" | "high" | "danger" | "brand" }> = {
  active: { label: "Live", tone: "good" },
  sold: { label: "Sold", tone: "brand" },
  expired: { label: "Expired", tone: "neutral" },
  under_review: { label: "Under review", tone: "high" },
  rejected: { label: "Rejected", tone: "danger" },
  removed: { label: "Removed", tone: "neutral" },
};

export default function MyAdsScreen() {
  const c = useColors();
  const { userId, ready } = useSession();
  const q = useMyAds(userId ?? undefined);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active");
  const [refreshing, setRefreshing] = useState(false);
  if (ready && !userId) return <Redirect href={{ pathname: "/signin", params: { next: "/my-ads" } }} />;

  const ads = q.data ?? [];
  const live = ads.filter((a) => a.status === "active");
  const shown = ads.filter((a) => TABS.find((t) => t.id === tab)!.match(a.status));
  const totals = live.reduce((t, a) => ({ views: t.views + a.view_count, reveals: t.reveals + a.contact_reveal_count, chats: t.chats + a.chats }), {
    views: 0,
    reveals: 0,
    chats: 0,
  });

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push("/post")} accessibilityRole="button" accessibilityLabel="Post an ad" hitSlop={8} style={styles.headerBtn}>
              <Plus size={24} color={c.brandText} strokeWidth={2.6} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={shown}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await q.refetch();
              setRefreshing(false);
            }}
            tintColor={c.brand}
            colors={[c.brand]}
          />
        }
        ListHeaderComponent={
          ads.length ? (
            <View style={styles.head}>
              <View style={styles.stats}>
                {(
                  [
                    ["Live ads", live.length, LayoutList],
                    ["Views", totals.views, Eye],
                    ["Number views", totals.reveals, Phone],
                    ["Chats", totals.chats, MessageCircle],
                  ] as const
                ).map(([k, v, I]) => (
                  <View key={k} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]} accessible accessibilityLabel={`${k}: ${v}`}>
                    <I size={16} color={c.fgSubtle} />
                    <Text variant="h3" numeric>
                      {formatNumber(v)}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {k}
                    </Text>
                  </View>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                {TABS.map((t) => {
                  const n = ads.filter((a) => t.match(a.status)).length;
                  const on = tab === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      role="tab"
                      accessibilityState={{ selected: on }}
                      onPress={() => setTab(t.id)}
                      style={[styles.tab, { borderColor: on ? c.brand : c.border, backgroundColor: on ? c.brandSoft : c.surface }]}
                    >
                      <Text variant="small" weight="700" style={{ color: on ? c.brandSoftFg : c.fg }}>
                        {t.label} {n}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          q.isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton h={150} r={radius.xl} />
              <Skeleton h={150} r={radius.xl} />
            </View>
          ) : ads.length === 0 ? (
            <EmptyState
              icon={<LayoutList size={30} color={c.brandSoftFg} />}
              title="You haven't posted any ads yet"
              body="Selling a vehicle? Post it free in a few minutes and see what similar ones go for."
            >
              <Button title="Post your first ad" onPress={() => router.push("/post")} />
            </EmptyState>
          ) : (
            <Text tone="muted" style={styles.nothing}>
              Nothing here.
            </Text>
          )
        }
        renderItem={({ item }) => <AdRow ad={item} />}
      />
    </View>
  );
}

function AdRow({ ad }: { ad: MyAd }) {
  const c = useColors();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const st = STATUS[ad.status] ?? STATUS.expired;
  const editable = !["removed", "rejected"].includes(ad.status);
  const left = daysUntil(ad.expires_at);
  const thumb = photoUrl(ad.cover_thumb);

  const change = async (status: "sold" | "active" | "removed") => {
    setBusy(status);
    const { error } = await supabase.from("listings").update({ status }).eq("id", ad.id);
    setBusy(null);
    if (error) {
      toast({ tone: "error", title: "Couldn't update the ad", body: error.message });
      return false;
    }
    qc.invalidateQueries({ queryKey: ["my-ads"] });
    qc.invalidateQueries({ queryKey: ["listing", ad.id] });
    toast({ tone: "success", title: status === "sold" ? "Marked as sold. Congratulations!" : status === "active" ? "Your ad is live again" : "Ad removed" });
    return true;
  };

  const confirm = (title: string, body: string, action: string, fn: () => void, destructive?: boolean) => {
    if (Platform.OS === "web") return fn();
    Alert.alert(title, body, [
      { text: "Cancel", style: "cancel" },
      { text: action, style: destructive ? "destructive" : "default", onPress: fn },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Pressable onPress={() => router.push(`/ad/${ad.id}`)} accessibilityRole="link" accessibilityLabel={`${ad.title}, ${st.label}`} style={styles.top}>
        <View style={[styles.thumb, { backgroundColor: c.surface2 }]}>
          {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <VehicleArt type={ad.vehicle_type} width={64} />}
        </View>
        <View style={styles.flex}>
          <View style={styles.badges}>
            <Badge tone={st.tone}>{st.label}</Badge>
            {ad.status === "active" && <DealBadge rating={ad.price_rating} />}
          </View>
          <Text variant="body" weight="700" numberOfLines={2}>
            {ad.title}
          </Text>
          <Text variant="body" weight="800" numeric>
            {formatLKR(ad.price_lkr)}
          </Text>
          <Text variant="caption" tone="muted">
            {ad.status === "active"
              ? `${formatNumber(ad.view_count)} views · ${formatNumber(ad.contact_reveal_count)} number views · ${ad.chats} chats · ${left > 0 ? `${left} days left` : "expires today"}`
              : ad.status === "sold" && ad.sold_at
                ? `Sold ${formatDate(ad.sold_at)}`
                : ad.status === "expired"
                  ? `Expired ${formatDate(ad.expires_at)}`
                  : ad.status === "under_review"
                    ? "Hidden after several reports. A moderator will review it soon."
                    : `Posted ${formatDate(ad.published_at)}`}
          </Text>
        </View>
      </Pressable>
      {editable && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.actions, { borderTopColor: c.border }]}>
          <Button title="Edit" variant="secondary" size="sm" icon={<Pencil size={15} color={c.fg} />} onPress={() => router.push(`/post/${ad.id}`)} />
          {ad.status === "active" && (
            <>
              <Button title="Boost" variant="accent" size="sm" icon={<Rocket size={15} color="#2a1a00" />} onPress={() => router.push(`/promote/${ad.id}`)} />
              <Button
                title="Mark as sold"
                variant="secondary"
                size="sm"
                loading={busy === "sold"}
                icon={<CheckCircle2 size={15} color={c.fg} />}
                onPress={() =>
                  confirm("Mark as sold?", "Buyers will see it as sold and it stops appearing in search. You can relist it later.", "Mark as sold", () => change("sold"))
                }
              />
            </>
          )}
          {(ad.status === "expired" || ad.status === "sold") && (
            <Button title="Relist" variant="soft" size="sm" loading={busy === "active"} icon={<RotateCcw size={15} color={c.brandSoftFg} />} onPress={() => change("active")} />
          )}
          <Button
            title="Remove"
            variant="ghost"
            size="sm"
            loading={busy === "removed"}
            icon={<Trash2 size={15} color={c.danger} />}
            onPress={() => confirm("Remove this ad?", "It will be taken down for good. This can't be undone.", "Remove", () => change("removed"), true)}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  head: { gap: 14, marginBottom: 14 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "47%", flexGrow: 1, borderWidth: 1, borderRadius: radius.xl, padding: 12, gap: 2 },
  tabs: { gap: 8 },
  tab: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 36, justifyContent: "center" },
  nothing: { textAlign: "center", padding: 32 },
  card: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  top: { flexDirection: "row", gap: 12, padding: 12 },
  thumb: { width: 96, height: 76, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  flex: { flex: 1, gap: 3 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  actions: { gap: 8, padding: 10, borderTopWidth: StyleSheet.hairlineWidth },
});
