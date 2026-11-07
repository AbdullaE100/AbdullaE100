import { useHeaderHeight } from "expo-router/react-navigation";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AlertCircle, ChevronRight, HandCoins, MessagesSquare, SendHorizontal, ShieldAlert, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dayKey, formatDate, formatLakhs, formatLKR, formatTime } from "@shared/format";
import { formatOffer, parseOffer } from "@shared/offer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { VehicleArt } from "@/components/vehicle-art";
import { track } from "@/lib/analytics";
import { queryClient, useConversation, type Message } from "@/lib/api";
import { photoUrl } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { radius, type as typeScale, useColors } from "@/lib/theme";
import { useInbox } from "@/providers/inbox";
import { useSession } from "@/providers/session";

function dayLabel(d: string) {
  const k = dayKey(d);
  if (k === dayKey(Date.now())) return "Today";
  if (k === dayKey(Date.now() - 86_400_000)) return "Yesterday";
  return formatDate(d);
}

type Row = { kind: "msg"; m: Message; mine: boolean; tail: boolean } | { kind: "day"; key: string; label: string };

export default function ThreadScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const headerH = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId: me } = useSession();
  const { refresh } = useInbox();
  const q = useConversation(id, me ?? undefined);
  const conv = q.data;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState("");
  const tempId = useRef(-1);
  const latest = useRef<Message[]>([]);
  const offerAmount = Number(offer.replace(/\D/g, "")) || 0;

  useEffect(() => {
    latest.current = msgs;
  }, [msgs]);

  // Seed from the first load of each conversation; realtime keeps it current after that.
  const [seeded, setSeeded] = useState<string | null>(null);
  if (conv && seeded !== conv.id) {
    setSeeded(conv.id);
    setMsgs(conv.messages);
  }

  const markRead = useCallback(() => {
    supabase.rpc("mark_conversation_read", { p_conversation_id: id }).then(() => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [id, refresh]);

  useEffect(() => {
    if (conv) markRead();
  }, [conv?.id, markRead]); // eslint-disable-line react-hooks/exhaustive-deps

  const merge = useCallback(
    (incoming: Message[]) => {
      if (!incoming.length) return;
      setMsgs((all) => {
        let next = all;
        for (const m of incoming) {
          if (next.some((x) => x.id === m.id)) continue;
          const i = next.findIndex((x) => x.pending && x.sender_id === m.sender_id && x.body === m.body);
          next = i >= 0 ? next.map((x, j) => (j === i ? m : x)) : [...next, m];
        }
        return next;
      });
      if (incoming.some((m) => m.sender_id !== me)) markRead();
    },
    [me, markRead],
  );

  // Catch up on anything sent while the socket was connecting or the phone slept.
  const catchUp = useCallback(async () => {
    // Before the first load there's nothing to catch up from; the load itself is current.
    if (!latest.current.length) return;
    const lastId = latest.current.reduce((max, m) => (m.id > max ? m.id : max), 0);
    const { data } = await supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", id).gt("id", lastId).order("id").limit(200);
    merge((data ?? []) as Message[]);
  }, [id, merge]);

  // Anything sent between the first load and the subscription going live.
  useEffect(() => {
    if (seeded) void catchUp();
  }, [seeded, catchUp]);

  useEffect(() => {
    if (!me || !id) return;
    const ch = supabase
      .channel(`thread:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (payload) => merge([payload.new as Message]))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") catchUp();
      });
    const sub = AppState.addEventListener("change", (s) => s === "active" && catchUp());
    return () => {
      sub.remove();
      supabase.removeChannel(ch);
    };
  }, [id, me, merge, catchUp]);

  const send = async (text: string, retryId?: number) => {
    const clean = text.trim();
    if (!clean || !me) return;
    const tid = retryId ?? tempId.current--;
    const optimistic: Message = { id: tid, sender_id: me, body: clean, created_at: new Date().toISOString(), pending: true };
    setMsgs((all) => (retryId ? all.map((m) => (m.id === retryId ? optimistic : m)) : [...all, optimistic]));
    if (!retryId) setBody("");
    const isOffer = !!parseOffer(clean);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: me, body: clean.slice(0, 2000) })
      .select("id, sender_id, body, created_at")
      .single();
    setMsgs((all) => {
      if (error || !data) return all.map((m) => (m.id === tid ? { ...m, pending: false, failed: true } : m));
      if (all.some((m) => m.id === data.id)) return all.filter((m) => m.id !== tid);
      return all.map((m) => (m.id === tid ? (data as Message) : m));
    });
    if (!error) {
      track(isOffer ? "offer_sent" : "message_sent", { conversation_id: id, role: conv?.role });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  const sendOffer = () => {
    if (offerAmount < 10_000) return;
    send(formatOffer(offerAmount, body));
    setOffer("");
    setOfferOpen(false);
  };

  // Newest first for the inverted list, with day separators.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      const newer = msgs[i + 1];
      const older = msgs[i - 1];
      out.push({ kind: "msg", m, mine: m.sender_id === me, tail: !newer || newer.sender_id !== m.sender_id || dayKey(newer.created_at) !== dayKey(m.created_at) });
      if (!older || dayKey(older.created_at) !== dayKey(m.created_at)) out.push({ kind: "day", key: `d${dayKey(m.created_at)}`, label: dayLabel(m.created_at) });
    }
    return out;
  }, [msgs, me]);

  if (q.isLoading || (!conv && q.isFetching)) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }
  if (!conv) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <EmptyState icon={<MessagesSquare size={30} color={c.brandSoftFg} />} title="Chat not found" body="It may have been removed, or you're signed in with a different account.">
          <Button title="Back to chats" onPress={() => router.navigate("/chats")} />
        </EmptyState>
      </View>
    );
  }

  const l = conv.listing;
  const thumb = photoUrl(l?.cover_thumb);
  const live = l?.status === "active";
  const price = l?.price_lkr;
  const offerPct = price && offerAmount ? Math.round(((price - offerAmount) / price) * 100) : null;

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={headerH}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Text variant="title" numberOfLines={1}>
                {conv.other}
              </Text>
              <Text variant="caption" tone="muted">
                {conv.role === "buyer" ? "Seller" : "Interested buyer"}
              </Text>
            </View>
          ),
        }}
      />
      {l && (
        <Pressable
          onPress={() => router.push(`/ad/${l.id}`)}
          accessibilityRole="link"
          accessibilityLabel={`Open ad: ${l.title}`}
          style={({ pressed }) => [styles.ad, { backgroundColor: pressed ? c.surface2 : c.surface, borderBottomColor: c.border }]}
        >
          <View style={[styles.adThumb, { backgroundColor: c.surface2 }]}>
            {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <VehicleArt type={l.vehicle_type} width={48} />}
          </View>
          <View style={styles.flex}>
            <Text variant="body" weight="700" numberOfLines={1}>
              {l.title}
            </Text>
            <View style={styles.inline}>
              <Text variant="small" tone="muted" numeric>
                {formatLKR(l.price_lkr)}
              </Text>
              {!live && <Badge tone={l.status === "sold" ? "good" : "neutral"}>{l.status === "sold" ? "Sold" : "No longer listed"}</Badge>}
            </View>
          </View>
          <ChevronRight size={18} color={c.fgSubtle} />
        </Pressable>
      )}

      <FlatList
        inverted
        data={rows}
        keyExtractor={(r) => (r.kind === "day" ? r.key : String(r.m.id))}
        contentContainerStyle={styles.list}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <View style={[styles.safety, { backgroundColor: c.accentSoft }]}>
            <ShieldAlert size={18} color={c.accentFg} />
            <Text variant="small" style={[styles.flex, { color: c.accentFg }]}>
              Keep the chat here until you meet. Never pay an advance or share bank OTPs.
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          item.kind === "day" ? <DaySep label={item.label} /> : <Bubble m={item.m} mine={item.mine} tail={item.tail} onRetry={() => send(item.m.body, item.m.id)} />
        }
      />

      {offerOpen && (
        <View style={[styles.offer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <View style={styles.inline}>
            <HandCoins size={18} color={c.accentFg} />
            <Text variant="body" weight="700" style={styles.flex}>
              Make an offer
            </Text>
            <Pressable onPress={() => setOfferOpen(false)} accessibilityRole="button" accessibilityLabel="Close offer" hitSlop={8}>
              <X size={20} color={c.fgMuted} />
            </Pressable>
          </View>
          <View style={styles.inline}>
            <View style={[styles.offerField, { borderColor: c.borderStrong }]}>
              <Text weight="700" tone="muted">
                Rs
              </Text>
              <TextInput
                value={offerAmount ? offerAmount.toLocaleString("en-LK") : ""}
                onChangeText={setOffer}
                keyboardType="number-pad"
                placeholder={price ? Math.round(price * 0.95).toLocaleString("en-LK") : "Your price"}
                placeholderTextColor={c.fgSubtle}
                accessibilityLabel="Offer amount in rupees"
                style={[styles.offerInput, { color: c.fg }]}
                autoFocus
              />
            </View>
            <Button title="Send offer" variant="accent" disabled={offerAmount < 10_000} onPress={sendOffer} />
          </View>
          {offerAmount > 0 && (
            <Text variant="small" tone="muted">
              {[formatLakhs(offerAmount), offerPct != null && offerPct !== 0 ? `${Math.abs(offerPct)}% ${offerPct > 0 ? "below" : "above"} the asking price` : null]
                .filter(Boolean)
                .join(" · ")}
              {body.trim() ? " · your message is sent with it" : ""}
            </Text>
          )}
        </View>
      )}

      <View style={[styles.composer, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        {conv.role === "buyer" && live && !offerOpen && (
          <Pressable
            onPress={() => setOfferOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Make an offer"
            style={({ pressed }) => [styles.roundBtn, { backgroundColor: pressed ? c.surface3 : c.accentSoft }]}
          >
            <HandCoins size={20} color={c.accentFg} />
          </Pressable>
        )}
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write a message"
          placeholderTextColor={c.fgSubtle}
          multiline
          maxLength={2000}
          accessibilityLabel="Message"
          style={[styles.input, { color: c.fg, backgroundColor: c.surface2 }]}
        />
        <Pressable
          onPress={() => send(body)}
          disabled={!body.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={({ pressed }) => [styles.roundBtn, { backgroundColor: body.trim() ? (pressed ? c.brandPressed : c.brand) : c.surface3 }]}
        >
          <SendHorizontal size={20} color={body.trim() ? "#fff" : c.fgSubtle} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function DaySep({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={styles.day}>
      <View style={[styles.dayPill, { backgroundColor: c.surface2 }]}>
        <Text variant="caption" weight="700" tone="muted">
          {label}
        </Text>
      </View>
    </View>
  );
}

function Bubble({ m, mine, tail, onRetry }: { m: Message; mine: boolean; tail: boolean; onRetry: () => void }) {
  const c = useColors();
  const offer = parseOffer(m.body);
  const bg = offer ? c.accentSoft : mine ? c.brand : c.surface;
  const fg = offer ? c.accentFg : mine ? "#ffffff" : c.fg;
  return (
    <View style={[styles.msgRow, mine ? styles.right : styles.left, !tail && { marginBottom: 2 }]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: bg, borderColor: offer ? c.accent : c.border, borderWidth: mine && !offer ? 0 : 1 },
          mine ? { borderBottomRightRadius: tail ? 4 : 18 } : { borderBottomLeftRadius: tail ? 4 : 18 },
          m.pending && { opacity: 0.7 },
        ]}
      >
        {offer ? (
          <>
            <View style={styles.inline}>
              <HandCoins size={16} color={fg} />
              <Text variant="small" weight="700" style={{ color: fg }}>
                {mine ? "Your offer" : "Offer"}
              </Text>
            </View>
            <Text weight="800" numeric style={{ color: fg, fontSize: 22, lineHeight: 28 }}>
              {formatLKR(offer.amount)}
            </Text>
            {!!offer.note && (
              <Text variant="bodyLg" style={{ color: fg }}>
                {offer.note}
              </Text>
            )}
          </>
        ) : (
          <Text variant="bodyLg" style={{ color: fg }} selectable>
            {m.body}
          </Text>
        )}
      </View>
      {tail && (
        <View style={[styles.meta, mine && styles.metaRight]}>
          {m.failed ? (
            <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Not sent. Tap to retry" style={styles.inline}>
              <AlertCircle size={14} color={c.danger} />
              <Text variant="caption" tone="danger" weight="700">
                Not sent · Tap to retry
              </Text>
            </Pressable>
          ) : (
            <Text variant="caption" tone="subtle">
              {m.pending ? "Sending…" : formatTime(m.created_at)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { alignItems: Platform.OS === "ios" ? "center" : "flex-start", maxWidth: 240 },
  ad: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  adThumb: { width: 56, height: 44, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 12, paddingVertical: 12 },
  safety: { flexDirection: "row", gap: 8, padding: 12, borderRadius: radius.lg, marginBottom: 12, alignItems: "flex-start" },
  day: { alignItems: "center", marginVertical: 12 },
  dayPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  msgRow: { marginBottom: 10, maxWidth: "82%" },
  left: { alignSelf: "flex-start" },
  right: { alignSelf: "flex-end" },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, gap: 2 },
  meta: { marginTop: 3, paddingHorizontal: 4 },
  metaRight: { alignItems: "flex-end" },
  offer: { padding: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  offerField: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 12, minHeight: 44 },
  offerInput: { flex: 1, minWidth: 0, ...typeScale.bodyLg, paddingVertical: 8, outlineStyle: "none" } as object,
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  input: {
    flex: 1,
    minWidth: 0,
    ...typeScale.bodyLg,
    minHeight: 44,
    maxHeight: 140,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    outlineStyle: "none",
  } as object,
  roundBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
