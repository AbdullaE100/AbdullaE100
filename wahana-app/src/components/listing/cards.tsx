import { Image } from "expo-image";
import { router } from "expo-router";
import { BadgeCheck, Camera, MapPin, MessageCircle, Phone } from "lucide-react-native";
import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { timeAgo } from "@shared/format";
import type { ListingCard as Card } from "@shared/types";
import { WhatsAppIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VehiclePlaceholder } from "@/components/vehicle-art";
import { photoUrl } from "@/lib/env";
import { radius, useColors } from "@/lib/theme";
import { useContact } from "@/providers/contact";
import { DealBadge, Flags, PriceTag, SpecIcons } from "./bits";
import { FavButton } from "./fav-button";

export const openAd = (id: number) => router.push(`/ad/${id}`);
const place = (l: Pick<Card, "city" | "district">) => (l.city ? `${l.city}, ${l.district}` : l.district);

function Cover({ l, height, priority }: { l: Card; height: number; priority?: boolean }) {
  const src = photoUrl(l.cover_thumb ?? l.cover_photo);
  return src ? (
    <Image source={{ uri: src }} style={{ width: "100%", height }} contentFit="cover" transition={180} recyclingKey={String(l.id)} priority={priority ? "high" : "normal"} accessibilityIgnoresInvertColors />
  ) : (
    <VehiclePlaceholder type={l.vehicle_type} seed={l.id} style={{ width: "100%", height }} artWidth={height * 0.9} />
  );
}

function PhotoCount({ n }: { n: number }) {
  if (n < 1) return null;
  return (
    <View style={styles.count} pointerEvents="none">
      <Camera size={12} color="#fff" />
      <Text variant="caption" weight="700" tone="inverse">
        {n}
      </Text>
    </View>
  );
}

/** Compact card for horizontal rails. */
export const ListingCard = memo(function ListingCard({ l, width, source, style, note }: { l: Card; width: number; source: string; style?: StyleProp<ViewStyle>; note?: ReactNode }) {
  const c = useColors();
  const photoH = Math.round(width * 0.72);
  return (
    <Pressable
      onPress={() => openAd(l.id)}
      accessibilityRole="link"
      accessibilityLabel={`${l.title}, Rs ${l.price_lkr.toLocaleString("en-LK")}, ${place(l)}`}
      style={({ pressed }) => [styles.card, { width, backgroundColor: c.surface, borderColor: l.is_top ? c.accent : c.border }, pressed && styles.pressed, style]}
    >
      <View style={[styles.photo, { height: photoH, backgroundColor: c.surface2 }]}>
        <Cover l={l} height={photoH} />
        <Flags l={l} />
        <PhotoCount n={l.photo_count} />
        <FavButton id={l.id} source={source} size={36} style={styles.fav} />
      </View>
      <View style={styles.cardBody}>
        <PriceTag price={l.price_lkr} />
        <View style={styles.minBadge}>
          <DealBadge rating={l.price_rating} />
        </View>
        <Text variant="body" weight="700" numberOfLines={1}>
          {l.title}
        </Text>
        <SpecIcons l={l} max={3} />
        {note}
        <View style={styles.loc}>
          <MapPin size={13} color={c.fgSubtle} />
          <Text variant="small" tone="muted" numberOfLines={1} style={styles.flex}>
            {place(l)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

/** Full-width search result with photo, details and contact buttons. */
export const ResultCard = memo(function ResultCard({ l, source, priority, note, hideContact }: { l: Card; source: string; priority?: boolean; note?: ReactNode; hideContact?: boolean }) {
  const c = useColors();
  const contact = useContact();
  const seller = l.is_dealer ? l.dealer_name ?? "Dealer" : "Private seller";
  const target = { listingId: l.id, title: l.title, price: l.price_lkr, sellerName: seller, source, isDemo: l.is_demo };
  return (
    <View style={[styles.result, { backgroundColor: c.surface, borderColor: l.is_top ? c.accent : c.border }]}>
      <Pressable
        onPress={() => openAd(l.id)}
        accessibilityRole="link"
        accessibilityLabel={`${l.title}, Rs ${l.price_lkr.toLocaleString("en-LK")}, ${place(l)}`}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.photo, { height: 210, backgroundColor: c.surface2 }]}>
          <Cover l={l} height={210} priority={priority} />
          <Flags l={l} />
          <PhotoCount n={l.photo_count} />
          <FavButton id={l.id} source={source} style={styles.fav} />
        </View>
        <View style={styles.resultBody}>
          <View style={styles.priceRow}>
            <PriceTag price={l.price_lkr} size="lg" />
            {l.negotiable && (
              <Text variant="caption" weight="700" tone="subtle">
                Negotiable
              </Text>
            )}
            <View style={styles.flex} />
            <DealBadge rating={l.price_rating} />
          </View>
          <Text variant="title" numberOfLines={1}>
            {l.title}
          </Text>
          <SpecIcons l={l} />
          <View style={styles.loc}>
            <MapPin size={14} color={c.fgSubtle} />
            <Text variant="small" tone="muted" numberOfLines={1} style={styles.flex}>
              {place(l)}
            </Text>
          </View>
          {note}
          <View style={styles.meta}>
            <Text variant="caption" tone="subtle">
              {timeAgo(l.bumped_at)}
              {l.is_demo ? " · Sample ad" : ""}
            </Text>
            {l.is_dealer && (
              <View style={styles.dealer}>
                <BadgeCheck size={13} color={c.brandText} />
                <Text variant="caption" weight="700" tone="brand" numberOfLines={1}>
                  {l.dealer_name ?? "Dealer"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
      {!hideContact && (
        <View style={[styles.actions, { borderTopColor: c.border }]}>
          <ActionButton label="Call" flex={1} icon={<Phone size={17} color={c.brandSoftFg} />} onPress={() => contact.call(target, "call")} />
          <ActionButton label="WhatsApp" flex={1.35} icon={<WhatsAppIcon size={17} color={c.brandSoftFg} />} onPress={() => contact.call(target, "whatsapp")} />
          <ActionButton label="Chat" flex={1} icon={<MessageCircle size={17} color={c.brandSoftFg} />} onPress={() => contact.chat(target)} />
        </View>
      )}
    </View>
  );
});

function ActionButton({ label, icon, onPress, flex }: { label: string; icon: ReactNode; onPress: () => void; flex: number }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, { flex, backgroundColor: pressed ? c.surface3 : c.brandSoft }]}
    >
      {icon}
      <Text variant="small" weight="700" style={{ color: c.brandSoftFg }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ResultCardSkeleton() {
  const c = useColors();
  return (
    <View style={[styles.result, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Skeleton h={210} r={0} />
      <View style={[styles.resultBody, { gap: 10 }]}>
        <Skeleton w="45%" h={22} />
        <Skeleton w="75%" h={18} />
        <Skeleton w="60%" h={14} />
        <Skeleton w="40%" h={14} />
      </View>
    </View>
  );
}

export function ListingCardSkeleton({ width }: { width: number }) {
  const c = useColors();
  return (
    <View style={[styles.card, { width, backgroundColor: c.surface, borderColor: c.border }]}>
      <Skeleton h={Math.round(width * 0.72)} r={0} />
      <View style={[styles.cardBody, { gap: 8 }]}>
        <Skeleton w="55%" h={18} />
        <Skeleton w="85%" h={14} />
        <Skeleton w="65%" h={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xxl, borderWidth: 1, overflow: "hidden" },
  pressed: { opacity: 0.92 },
  photo: { width: "100%", overflow: "hidden" },
  fav: { position: "absolute", right: 8, top: 8 },
  count: { position: "absolute", left: 10, bottom: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  cardBody: { padding: 12, gap: 5 },
  minBadge: { minHeight: 22, justifyContent: "center" },
  loc: { flexDirection: "row", alignItems: "center", gap: 4 },
  flex: { flex: 1 },
  result: { borderRadius: radius.xxl, borderWidth: 1, overflow: "hidden" },
  resultBody: { padding: 14, gap: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  dealer: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 1 },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 0 },
  action: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 44, borderRadius: radius.lg, paddingHorizontal: 6 },
});
