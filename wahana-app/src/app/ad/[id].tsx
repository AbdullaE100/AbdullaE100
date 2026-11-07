import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  BadgeCheck,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cog,
  Crown,
  Flag,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  PartyPopper,
  Pencil,
  Phone,
  Share2,
  ShieldCheck,
  TrendingDown,
  Wrench,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, Share, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALL_BODY_LABELS, CONDITIONS, FUELS, TRANSMISSIONS, label, typeBySlug } from "@shared/constants";
import { formatDate, formatKm, formatLakhs, formatLKR, formatLKRCompact, formatNumber, timeAgo } from "@shared/format";
import { leaseEstimate } from "@shared/finance";
import { WhatsAppIcon } from "@/components/icons";
import { DealBadge, PriceTag } from "@/components/listing/bits";
import { FavButton } from "@/components/listing/fav-button";
import { Gallery } from "@/components/listing/gallery";
import { PriceCheck } from "@/components/listing/price-check";
import { ReportSheet } from "@/components/listing/report-sheet";
import { Rail, SectionHeader } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { SITE_URL } from "@/lib/env";
import { usePriceSpread, useListing, useSellerAds, useSimilar } from "@/lib/api";
import { openSearch } from "@/lib/search-store";
import { recordRecent } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { cardShadow, radius, useColors } from "@/lib/theme";
import { useContact } from "@/providers/contact";
import { useSession } from "@/providers/session";

const viewed = new Set<number>();

export default function AdScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; posted?: string }>();
  const id = Number(params.id);
  const q = useListing(id);
  const l = q.data;
  const { userId } = useSession();
  const contact = useContact();
  const { toast } = useToast();
  const similar = useSimilar(id, !!l);
  const sellerAds = useSellerAds(l?.seller_id, id);
  const spread = usePriceSpread(l?.model_id, l?.condition, l?.year_manufactured, id);
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const galleryH = Math.round(Math.min(width, 900) * 0.75);

  const isOwner = !!l && userId === l.seller_id;
  const live = l?.status === "active";
  const seller = l?.seller;
  const isDealer = seller?.account_type === "dealer";
  const sellerName = (isDealer && seller?.dealer_name) || seller?.display_name || "Private seller";
  const target = l ? { listingId: l.id, title: l.title, price: l.price_lkr, sellerName, source: "ad_page", isDemo: l.is_demo } : null;

  useEffect(() => {
    if (!l) return;
    track("ad_viewed", { listing_id: l.id, rating: l.price_rating, owner: isOwner, live });
    if (isOwner || !live) return;
    recordRecent(l.id);
    if (!viewed.has(l.id)) {
      viewed.add(l.id);
      supabase.rpc("record_view", { p_listing_id: l.id }).then(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l?.id]);

  const headerBg = scrollY.interpolate({ inputRange: [galleryH - 120, galleryH - 40], outputRange: [0, 1], extrapolate: "clamp" });

  const share = async () => {
    if (!l) return;
    const where = [l.city?.name, l.district?.name].filter(Boolean).join(", ");
    const url = `${SITE_URL}/ad/${l.id}/${l.slug}`;
    try {
      await Share.share({ message: `${l.title} for ${formatLKR(l.price_lkr)}${where ? ` in ${where}` : ""} on Wahana: ${url}`, url, title: l.title });
    } catch {}
  };

  const derived = useMemo(() => {
    if (!l) return null;
    const t = typeBySlug(l.vehicle_type);
    const where = [l.city?.name, l.district?.name].filter(Boolean).join(", ");
    const regLabel = l.year_registered != null ? String(l.year_registered) : l.condition !== "used" ? "Not registered yet" : null;
    const facts = [
      { Icon: Calendar, k: "Year", v: String(l.year_manufactured) },
      { Icon: Gauge, k: "Mileage", v: l.condition === "brand_new" ? "Brand new" : l.mileage_km != null ? formatKm(l.mileage_km) : null },
      { Icon: Fuel, k: "Fuel", v: l.fuel ? label(FUELS, l.fuel) : null },
      { Icon: Cog, k: "Gearbox", v: l.transmission ? label(TRANSMISSIONS, l.transmission) : null },
      { Icon: Wrench, k: "Engine", v: l.engine_cc ? `${formatNumber(l.engine_cc)} cc` : null },
    ].filter((f) => f.v);
    const info: [string, string][] = (
      [
        ["Make", l.make?.name ?? l.make_other],
        ["Model", l.model?.name ?? l.model_other],
        ["Edition", l.trim_level],
        ["Condition", label(CONDITIONS, l.condition)],
        ["Year made", String(l.year_manufactured)],
        ["Registered", regLabel],
        ["Mileage", l.mileage_km != null ? formatKm(l.mileage_km) : null],
        ["Engine", l.engine_cc ? `${formatNumber(l.engine_cc)} cc` : null],
        ["Fuel", l.fuel ? label(FUELS, l.fuel) : null],
        ["Transmission", l.transmission ? label(TRANSMISSIONS, l.transmission) : null],
        ["Body", l.body_type ? ALL_BODY_LABELS[l.body_type] ?? l.body_type : t?.name ?? null],
        ["Colour", l.colour],
        ["Previous owners", l.previous_owners != null ? (l.previous_owners === 0 ? "None" : String(l.previous_owners)) : null],
        ["Leasing", l.leasing_available ? "Available" : null],
        ["Location", where],
        ["Ad reference", String(l.id)],
        ["Posted", formatDate(l.published_at)],
      ] as [string, string | null][]
    ).filter((r): r is [string, string] => r[1] != null && r[1] !== "");
    const lastDrop = l.price_changes.find((p) => p.new_price_lkr < p.old_price_lkr);
    const isTop = !!l.promoted_until && new Date(l.promoted_until) > new Date();
    const isUrgent = !!l.urgent_until && new Date(l.urgent_until) > new Date();
    const subject = [l.make?.name, l.model?.name].filter(Boolean).join(" ");
    return { t, where, facts, info, lastDrop, isTop, isUrgent, subject };
  }, [l]);

  if (q.isLoading) return <AdSkeleton galleryH={galleryH} />;
  if (!l || !derived) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <View style={styles.floatBar}>
          <IconButton tone="outline" label="Back" icon={<ChevronLeft size={24} color={c.fg} />} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
        </View>
        <EmptyState
          icon={<AlertTriangle size={30} color={c.brandSoftFg} />}
          title={q.isError ? "Couldn't load this ad" : "This ad isn't available"}
          body={q.isError ? "Check your connection and try again." : "It may have been removed by the seller."}
        >
          {q.isError ? <Button title="Try again" onPress={() => q.refetch()} /> : <Button title="Browse vehicles" onPress={() => openSearch({})} />}
        </EmptyState>
      </View>
    );
  }

  const { t, where, facts, info, lastDrop, isTop, isUrgent, subject } = derived;
  const lakhs = formatLakhs(l.price_lkr);
  const monthly = leaseEstimate(l.price_lkr);
  const more = (sellerAds.data?.items ?? []).filter((a) => !(similar.data ?? []).some((s) => s.id === a.id)).slice(0, 8);
  const longDesc = (l.description?.length ?? 0) > 280 || (l.description?.split("\n").length ?? 0) > 6;
  const memberSince = seller?.created_at ? new Date(seller.created_at).getFullYear() : null;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View style={{ height: galleryH, backgroundColor: c.surface2 }}>
          <Gallery photos={l.photos} title={l.title} type={l.vehicle_type} seed={l.id} height={galleryH} />
        </View>

        <View style={styles.body}>
          {params.posted === "1" && isOwner && (
            <Banner tone="good" icon={<PartyPopper size={22} color={c.good} />} title="Your ad is live" body={`Share it with friends, or boost it to appear above other ${subject || "similar"} ads.`}>
              <View style={styles.row}>
                <Button title="Share" variant="secondary" size="sm" icon={<Share2 size={16} color={c.fg} />} onPress={share} />
                <Button title="Boost ad" variant="accent" size="sm" onPress={() => router.push(`/promote/${l.id}`)} />
              </View>
            </Banner>
          )}
          {!live && (
            <Banner
              tone={l.status === "sold" ? "good" : "high"}
              icon={l.status === "sold" ? <CheckCircle2 size={22} color={c.good} /> : l.status === "expired" ? <Clock size={22} color={c.high} /> : <AlertTriangle size={22} color={c.high} />}
              title={
                l.status === "sold"
                  ? `This vehicle was sold${l.sold_at ? ` on ${formatDate(l.sold_at)}` : ""}`
                  : l.status === "expired"
                    ? "This ad has expired"
                    : l.status === "under_review"
                      ? "This ad is being reviewed"
                      : "This ad is no longer available"
              }
              body={isOwner ? (l.status === "under_review" ? "Several people reported it, so it's hidden until a moderator checks it." : "Only you can see it now.") : "Similar vehicles that are still for sale are below."}
            />
          )}

          <View style={styles.priceRow}>
            <PriceTag price={l.price_lkr} size="xl" />
            {!!lakhs && (
              <Text variant="body" tone="muted">
                ({lakhs})
              </Text>
            )}
          </View>
          <View style={styles.badges}>
            {l.negotiable && <Badge tone="neutral">Negotiable</Badge>}
            <DealBadge rating={l.price_rating} />
            {isTop && (
              <Badge tone="solidAccent" icon={<Crown size={12} color="#2a1a00" />}>
                Top ad
              </Badge>
            )}
            {isUrgent && (
              <Badge tone="solidDanger" icon={<Zap size={12} color="#fff" />}>
                Urgent sale
              </Badge>
            )}
            {l.is_demo && <Badge tone="neutral">Sample ad</Badge>}
          </View>

          <Text variant="h2" style={styles.title}>
            {l.title}
          </Text>
          <View style={styles.metaRow}>
            <MapPin size={15} color={c.fgSubtle} />
            <Text variant="body" tone="muted" style={styles.flex} numberOfLines={1}>
              {where}
            </Text>
            <Text variant="small" tone="subtle">
              {timeAgo(l.published_at)}
            </Text>
          </View>

          {live && (
            <Pressable onPress={() => router.push({ pathname: "/leasing", params: { price: String(l.price_lkr) } })} accessibilityRole="link" style={({ pressed }) => [styles.lease, { backgroundColor: c.brandSoft }, pressed && { opacity: 0.8 }]}>
              <Calculator size={18} color={c.brandSoftFg} />
              <Text variant="body" weight="700" style={[styles.flex, { color: c.brandSoftFg }]}>
                Leasing from {formatLKR(monthly)}/month
              </Text>
              <ChevronRight size={18} color={c.brandSoftFg} />
            </Pressable>
          )}

          <View style={[styles.facts, { borderColor: c.border }]}>
            {facts.map(({ Icon, k, v }) => (
              <View key={k} style={styles.fact} accessible accessibilityLabel={`${k}: ${v}`}>
                <Icon size={20} color={c.fgSubtle} />
                <Text variant="caption" tone="subtle">
                  {k}
                </Text>
                <Text variant="body" weight="700" numberOfLines={1}>
                  {v}
                </Text>
              </View>
            ))}
          </View>

          {lastDrop && (
            <View style={[styles.drop, { backgroundColor: c.goodSoft }]}>
              <TrendingDown size={20} color={c.good} />
              <Text variant="small" style={styles.flex}>
                <Text variant="small" weight="700">
                  Price dropped {formatLKRCompact(lastDrop.old_price_lkr - lastDrop.new_price_lkr)}
                </Text>{" "}
                on {formatDate(lastDrop.changed_at)}, from {formatLKR(lastDrop.old_price_lkr)}
              </Text>
            </View>
          )}

          {!!l.description?.trim() && (
            <View style={styles.block}>
              <Text variant="h3" accessibilityRole="header">
                Description
              </Text>
              <Text variant="bodyLg" numberOfLines={expanded ? undefined : 6} selectable>
                {l.description.trim()}
              </Text>
              {longDesc && (
                <Pressable onPress={() => setExpanded((e) => !e)} accessibilityRole="button" hitSlop={8} style={styles.more}>
                  <Text weight="700" tone="brand">
                    {expanded ? "Show less" : "Read more"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {l.features.length > 0 && (
            <View style={styles.block}>
              <Text variant="h3" accessibilityRole="header">
                Features
              </Text>
              <View style={styles.features}>
                {l.features.map((feat) => (
                  <View key={feat} style={[styles.feature, { backgroundColor: c.surface2 }]}>
                    <CheckCircle2 size={14} color={c.good} />
                    <Text variant="small" weight="600">
                      {feat}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.block}>
            <Text variant="h3" accessibilityRole="header">
              Details
            </Text>
            <View style={[styles.table, { borderColor: c.border }]}>
              {info.map(([k, v], i) => (
                <View key={k} style={[styles.tr, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }, i % 2 === 1 && { backgroundColor: c.surface2 }]}>
                  <Text variant="body" tone="muted" style={styles.th}>
                    {k}
                  </Text>
                  <Text variant="body" weight="600" style={styles.td} selectable>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {!!l.model_id && (
            <View style={styles.block}>
              {spread.isLoading ? (
                <Skeleton h={150} r={radius.xxl} />
              ) : (
                <PriceCheck spread={spread.data} price={l.price_lkr} rating={l.price_rating} median={l.market_median_lkr} peers={l.market_peer_count} subject={subject} />
              )}
            </View>
          )}

          <View style={[styles.seller, { borderColor: c.border, backgroundColor: c.surface }]}>
            <View style={[styles.avatar, { backgroundColor: c.brandSoft }]}>
              <Text variant="h3" style={{ color: c.brandSoftFg }}>
                {sellerName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.flex}>
              <View style={styles.rowTight}>
                <Text variant="title" numberOfLines={1} style={styles.shrink}>
                  {sellerName}
                </Text>
                {isDealer && <BadgeCheck size={18} color={c.brandText} />}
              </View>
              <Text variant="small" tone="muted">
                {isDealer ? "Dealer" : "Private seller"}
                {memberSince ? ` · on Wahana since ${memberSince}` : ""}
              </Text>
              {(sellerAds.data?.total ?? 0) > 1 && (
                <Pressable onPress={() => router.push({ pathname: "/seller/[id]", params: { id: l.seller_id, name: sellerName } })} accessibilityRole="link" hitSlop={6} style={styles.sellerLink}>
                  <Text variant="small" weight="700" tone="brand">
                    See all {sellerAds.data!.total} ads
                  </Text>
                  <ChevronRight size={16} color={c.brandText} />
                </Pressable>
              )}
            </View>
          </View>

          <View style={[styles.safety, { backgroundColor: c.surface2 }]}>
            <ShieldCheck size={20} color={c.brandText} />
            <View style={styles.flex}>
              <Text variant="body" weight="700">
                Stay safe
              </Text>
              <Text variant="small" tone="muted">
                Meet in a public place, check the CR book and chassis number, and never pay an advance before you've seen the vehicle.
              </Text>
            </View>
          </View>

          {!isOwner && (
            <Pressable
              onPress={() => (userId ? setReportOpen(true) : router.push({ pathname: "/signin", params: { next: `/ad/${l.id}`, reason: "report" } }))}
              disabled={reported}
              accessibilityRole="button"
              style={styles.report}
            >
              <Flag size={16} color={c.fgMuted} />
              <Text variant="small" weight="600" tone="muted">
                {reported ? "Reported. Thanks." : "Report this ad"}
              </Text>
            </Pressable>
          )}
        </View>

        {(similar.data?.length ?? 0) > 0 && (
          <View style={styles.railBlock}>
            <SectionHeader
              title={live ? "Similar vehicles" : "Still for sale"}
              action="See more"
              onAction={() => openSearch({ type: l.vehicle_type, make: l.make?.slug, model: l.model?.slug })}
            />
            <Rail items={similar.data} source="ad_similar" />
          </View>
        )}
        {more.length > 0 && (
          <View style={styles.railBlock}>
            <SectionHeader title={`More from ${sellerName}`} />
            <Rail items={more} source="ad_seller" />
          </View>
        )}
      </Animated.ScrollView>

      {/* Header that fades in once the photos scroll away. */}
      <Animated.View pointerEvents="none" style={[styles.headerFill, { height: insets.top + 56, backgroundColor: c.surface, opacity: headerBg, borderBottomColor: c.border }]}>
        <Text variant="title" numberOfLines={1} style={[styles.headerTitle, { marginTop: insets.top }]}>
          {l.title}
        </Text>
      </Animated.View>
      <View style={[styles.floatBar, { top: insets.top + 6 }]}>
        <IconButton tone="outline" label="Back" icon={<ChevronLeft size={24} color={c.fg} />} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={cardShadow(c)} />
        <View style={styles.row}>
          <IconButton tone="outline" label="Share" icon={<Share2 size={20} color={c.fg} />} onPress={share} style={cardShadow(c)} />
          <FavButton id={l.id} source="ad_page" size={44} />
        </View>
      </View>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: c.surface, borderTopColor: c.border }]}>
        {isOwner ? (
          <>
            <Button title="Edit ad" icon={<Pencil size={18} color="#fff" />} size="lg" style={styles.flex} onPress={() => router.push(`/post/${l.id}`)} />
            <Button title="My ads" variant="secondary" size="lg" style={styles.flex} onPress={() => router.push("/my-ads")} />
          </>
        ) : live && target ? (
          <>
            <Button title="Call" icon={<Phone size={18} color="#fff" />} compact style={[{ flex: 1 }, styles.barBtn]} onPress={() => contact.call(target, "call")} />
            <Button title="WhatsApp" icon={<WhatsAppIcon color={c.brandText} />} variant="outline" compact style={[{ flex: 1.25 }, styles.barBtn]} onPress={() => contact.call(target, "whatsapp")} />
            <Button title="Chat" icon={<MessageCircle size={18} color={c.brandText} />} variant="outline" compact style={[{ flex: 0.95 }, styles.barBtn]} onPress={() => contact.chat(target)} />
          </>
        ) : (
          <Button
            title={t ? `See similar ${t.plural.toLowerCase()}` : "See similar vehicles"}
            size="lg"
            style={styles.flex}
            onPress={() => openSearch({ type: l.vehicle_type, make: l.make?.slug, model: l.model?.slug })}
          />
        )}
      </View>

      {!!userId && (
        <ReportSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          listingId={l.id}
          userId={userId}
          onDone={() => {
            setReported(true);
            toast({ tone: "success", title: "Thanks, we'll take a look", body: "Ads with several reports are hidden until a moderator reviews them." });
          }}
        />
      )}
    </View>
  );
}

function Banner({ tone, icon, title, body, children }: { tone: "good" | "high"; icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.banner, { backgroundColor: tone === "good" ? c.goodSoft : c.highSoft }]}>
      {icon}
      <View style={[styles.flex, { gap: 4 }]}>
        <Text variant="body" weight="700">
          {title}
        </Text>
        <Text variant="small" tone="muted">
          {body}
        </Text>
        {children}
      </View>
    </View>
  );
}

function AdSkeleton({ galleryH }: { galleryH: number }) {
  const c = useColors();
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Skeleton h={galleryH} r={0} />
      <View style={[styles.body, { gap: 12 }]}>
        <Skeleton w="50%" h={30} />
        <Skeleton w="30%" h={20} />
        <Skeleton w="85%" h={24} />
        <Skeleton w="60%" h={16} />
        <Skeleton h={72} r={radius.xl} />
        <Skeleton h={120} r={radius.xl} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 16, gap: 10, width: "100%", maxWidth: 900, alignSelf: "center" },
  priceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginTop: 4 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  title: { marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  rowTight: { flexDirection: "row", gap: 6, alignItems: "center" },
  lease: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.lg, marginTop: 6 },
  facts: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, rowGap: 14, marginTop: 8 },
  fact: { width: "33.33%", alignItems: "flex-start", gap: 2, paddingRight: 8 },
  drop: { flexDirection: "row", gap: 10, alignItems: "center", padding: 12, borderRadius: radius.lg },
  block: { marginTop: 18, gap: 10 },
  more: { alignSelf: "flex-start", minHeight: 32, justifyContent: "center" },
  features: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  feature: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  table: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  tr: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 11, gap: 12 },
  th: { width: "42%" },
  td: { flex: 1 },
  seller: { flexDirection: "row", gap: 14, padding: 16, borderWidth: 1, borderRadius: radius.xxl, marginTop: 22, alignItems: "center" },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  sellerLink: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4, minHeight: 28 },
  safety: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.xl, marginTop: 12 },
  report: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 44, marginTop: 4 },
  railBlock: { marginTop: 24 },
  banner: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.xl, alignItems: "flex-start", marginBottom: 4 },
  headerFill: { position: "absolute", left: 0, right: 0, top: 0, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: "center", paddingHorizontal: 110 },
  headerTitle: { textAlign: "center" },
  floatBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  barBtn: { height: 50 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
