import { Image } from "expo-image";
import { router } from "expo-router";
import { MessagesSquare, WifiOff } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { timeAgo } from "@shared/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VehicleArt } from "@/components/vehicle-art";
import { useConversations, type ConversationSummary } from "@/lib/api";
import { previewText } from "@/lib/chat";
import { photoUrl } from "@/lib/env";
import { openSearch } from "@/lib/search-store";
import { radius, useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

type Filter = "all" | "buying" | "selling";

export default function ChatsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { userId, ready } = useSession();
  const q = useConversations(userId ?? undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const all = q.data ?? [];
  const rows = filter === "all" ? all : all.filter((r) => (filter === "buying" ? r.role === "buyer" : r.role === "seller"));
  const unread = all.filter((r) => r.unread).length;

  const head = (
    <View style={[styles.head, { paddingTop: 12 }]}>
      <Text variant="h1" accessibilityRole="header">
        Chats
      </Text>
      {userId && all.length > 0 && (
        <View style={[styles.seg, { backgroundColor: c.surface2 }]} role="tablist">
          {(["all", "buying", "selling"] as const).map((f) => (
            <Pressable key={f} role="tab" accessibilityState={{ selected: filter === f }} onPress={() => setFilter(f)} style={[styles.segBtn, filter === f && { backgroundColor: c.surface }]}>
              <Text variant="small" weight="700" tone={filter === f ? "default" : "muted"}>
                {f === "all" ? (unread ? `All · ${unread} new` : "All") : f === "buying" ? "Buying" : "Selling"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  if (ready && !userId) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        {head}
        <EmptyState icon={<MessagesSquare size={30} color={c.brandSoftFg} />} title="Message sellers privately" body="Sign in to chat with sellers and buyers. Your phone number and email stay hidden.">
          <Button title="Sign in" size="lg" onPress={() => router.push("/signin")} />
          <Button title="Create account" variant="ghost" onPress={() => router.push({ pathname: "/signin", params: { mode: "signup" } })} />
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} collapsable={false}>
      <View style={{ height: insets.top, backgroundColor: c.bg }} />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={head}
        contentContainerStyle={styles.list}
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
        renderItem={({ item, index }) => <Row r={item} first={index === 0} />}
        ListEmptyComponent={
          q.isLoading ? (
            <View style={styles.skel}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.skelRow}>
                  <Skeleton w={64} h={52} r={radius.md} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton w="50%" h={14} />
                    <Skeleton w="85%" h={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : q.isError ? (
            <EmptyState icon={<WifiOff size={30} color={c.brandSoftFg} />} title="Couldn't load your chats" body="Check your connection and pull down to try again." />
          ) : (
            <EmptyState
              icon={<MessagesSquare size={30} color={c.brandSoftFg} />}
              title={filter === "all" ? "No chats yet" : filter === "buying" ? "No chats with sellers yet" : "No buyer messages yet"}
              body={filter === "selling" ? "When buyers message you about your ads, you'll see them here." : "Find a vehicle you like and tap Chat to ask the seller a question or make an offer."}
            >
              {filter !== "selling" && <Button title="Browse vehicles" onPress={() => openSearch({})} />}
            </EmptyState>
          )
        }
      />
    </View>
  );
}

function Row({ r, first }: { r: ConversationSummary; first: boolean }) {
  const c = useColors();
  const thumb = photoUrl(r.listing?.cover_thumb);
  const sold = r.listing && r.listing.status !== "active";
  return (
    <Pressable
      onPress={() => router.push(`/chat/${r.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${r.unread ? "Unread. " : ""}${r.other} about ${r.listing?.title ?? "an ad"}. ${previewText(r.preview, r.mineLast)}. ${timeAgo(r.lastAt)}`}
      style={({ pressed }) => [styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }, pressed && { backgroundColor: c.surface2 }]}
    >
      <View style={[styles.thumb, { backgroundColor: c.surface2 }]}>
        {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <VehicleArt type={r.listing?.vehicle_type ?? "car"} width={52} />}
      </View>
      <View style={styles.flex}>
        <View style={styles.line}>
          <Text variant="body" weight={r.unread ? "800" : "700"} numberOfLines={1} style={styles.flex}>
            {r.other}
          </Text>
          <Text variant="caption" tone={r.unread ? "brand" : "subtle"} weight={r.unread ? "700" : "400"}>
            {timeAgo(r.lastAt)}
          </Text>
        </View>
        <Text variant="small" tone="muted" numberOfLines={1}>
          {r.role === "seller" ? "Your ad: " : ""}
          {r.listing?.title ?? "Ad removed"}
          {sold ? " · no longer for sale" : ""}
        </Text>
        <View style={styles.line}>
          <Text variant="small" tone={r.unread ? "default" : "subtle"} weight={r.unread ? "600" : "400"} numberOfLines={1} style={styles.flex}>
            {previewText(r.preview, r.mineLast)}
          </Text>
          {r.unread && <View style={[styles.dot, { backgroundColor: c.brand }]} accessibilityElementsHidden />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  seg: { flexDirection: "row", borderRadius: radius.lg, padding: 3 },
  segBtn: { flex: 1, minHeight: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  list: { paddingBottom: 32, flexGrow: 1 },
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" },
  thumb: { width: 64, height: 52, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  line: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  skel: { padding: 16, gap: 18 },
  skelRow: { flexDirection: "row", gap: 12, alignItems: "center" },
});
