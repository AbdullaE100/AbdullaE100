import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { Camera, ChevronRight, MessageCircle, PencilLine, Tag, TrendingUp } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatLKR } from "@shared/format";
import { draftKey } from "@/components/sell/wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VehicleArt } from "@/components/vehicle-art";
import { useCatalog, useMyAds } from "@/lib/api";
import { photoUrl } from "@/lib/env";
import { draftTitle, type Draft } from "@/lib/sell/draft";
import { radius, useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

const STEPS = [
  { Icon: Tag, title: "Describe your vehicle", body: "Make, model, year and condition. About two minutes." },
  { Icon: Camera, title: "Add photos", body: "Six or more clear daylight photos get the most calls." },
  { Icon: TrendingUp, title: "Price it right", body: "We show what similar vehicles are listed for, live." },
  { Icon: MessageCircle, title: "Talk to buyers", body: "Calls, WhatsApp or private chat. Your number stays hidden until they tap." },
];

export default function SellTab() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useSession();
  const ads = useMyAds(userId ?? undefined);
  const cat = useCatalog();
  const [draft, setDraft] = useState<{ title: string; step: number } | null>(null);

  // Re-check for an unfinished draft whenever the tab comes into view.
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(draftKey(userId ?? "anon"))
        .then((raw) => {
          const saved = raw ? (JSON.parse(raw) as { draft: Draft; step: number }) : null;
          if (!saved?.draft?.vehicle_type) return setDraft(null);
          const t = draftTitle(saved.draft, cat.data?.makes ?? [], cat.data?.models ?? []);
          setDraft({ title: t || "Your unfinished ad", step: saved.step ?? 0 });
        })
        .catch(() => setDraft(null));
    }, [userId, cat.data]),
  );

  const start = () => router.push("/post");
  const live = (ads.data ?? []).filter((a) => a.status === "active");

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} collapsable={false}>
      <View style={{ height: insets.top, backgroundColor: c.bg }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 12 }]}>
        <Text variant="h1" accessibilityRole="header">
          Sell
        </Text>

        <View style={[styles.hero, { backgroundColor: c.brand }]}>
          <View style={styles.heroArt}>
            <VehicleArt type="car" width={150} color="#ffffff" bg={c.brand} />
          </View>
          <Text variant="h2" tone="inverse">
            Sell your vehicle for free
          </Text>
          <Text variant="body" tone="inverse">
            Reach buyers across Sri Lanka. No fees to post, edit or mark as sold.
          </Text>
          <Button title={draft ? "Start a new ad" : "Post an ad"} variant="secondary" size="lg" onPress={start} style={styles.heroBtn} />
        </View>

        {draft && (
          <Pressable
            onPress={() => router.push("/post")}
            accessibilityRole="button"
            accessibilityLabel={`Continue your draft: ${draft.title}`}
            style={({ pressed }) => [styles.draft, { borderColor: c.brand, backgroundColor: pressed ? c.brandSoft : c.surface }]}
          >
            <View style={[styles.draftIcon, { backgroundColor: c.brandSoft }]}>
              <PencilLine size={22} color={c.brandSoftFg} />
            </View>
            <View style={styles.flex}>
              <Text variant="body" weight="700">
                Continue your draft
              </Text>
              <Text variant="small" tone="muted" numberOfLines={1}>
                {draft.title} · step {draft.step + 1} of 6
              </Text>
            </View>
            <ChevronRight size={20} color={c.brandText} />
          </Pressable>
        )}

        {live.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text variant="h3">Your live ads</Text>
              <Pressable onPress={() => router.push("/my-ads")} accessibilityRole="link" hitSlop={8}>
                <Text weight="700" tone="brand">
                  Manage
                </Text>
              </Pressable>
            </View>
            {live.slice(0, 3).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/ad/${a.id}`)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.ad, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
              >
                <View style={[styles.thumb, { backgroundColor: c.surface2 }]}>
                  {a.cover_thumb ? <Image source={{ uri: photoUrl(a.cover_thumb)! }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <VehicleArt type={a.vehicle_type} width={56} />}
                </View>
                <View style={styles.flex}>
                  <Text variant="body" weight="700" numberOfLines={1}>
                    {a.title}
                  </Text>
                  <Text variant="small" tone="muted" numeric>
                    {formatLKR(a.price_lkr)}
                  </Text>
                  <View style={styles.adStats}>
                    <Badge tone="neutral">{`${a.view_count} views`}</Badge>
                    {a.chats > 0 && <Badge tone="brand">{`${a.chats} ${a.chats === 1 ? "chat" : "chats"}`}</Badge>}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text variant="h3">How it works</Text>
          {STEPS.map(({ Icon, title, body }, i) => (
            <View key={title} style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: c.brandSoft }]}>
                <Icon size={20} color={c.brandSoftFg} />
              </View>
              <View style={styles.flex}>
                <Text variant="body" weight="700">
                  {i + 1}. {title}
                </Text>
                <Text variant="small" tone="muted">
                  {body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Button title="Value my vehicle first" variant="outline" size="lg" onPress={() => router.push("/value")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  hero: { borderRadius: radius.xxl, padding: 20, gap: 8, overflow: "hidden" },
  heroArt: { position: "absolute", right: -24, bottom: -6, opacity: 0.18 },
  heroBtn: { alignSelf: "flex-start", marginTop: 8, borderColor: "transparent" },
  draft: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.xl, borderWidth: 1.5 },
  draftIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ad: { flexDirection: "row", gap: 12, padding: 10, borderRadius: radius.xl, borderWidth: 1, alignItems: "center" },
  thumb: { width: 84, height: 64, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  adStats: { flexDirection: "row", gap: 6, marginTop: 4 },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
});
