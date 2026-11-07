import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Check, Copy, MessageCircle, Phone, ShieldAlert } from "lucide-react-native";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { displayLkPhone, formatLakhs } from "@shared/format";
import { formatOffer } from "@shared/offer";
import { WhatsAppIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { pendingAction } from "@/lib/pending";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useInbox } from "./inbox";
import { useSession } from "./session";

export type ContactTarget = { listingId: number; title: string; price?: number; sellerName: string; source: string };
type Contact = { phone: string; whatsapp: string | null; seller_name: string | null } | "none" | null;

type Ctx = {
  /** Show the seller's number with Call / WhatsApp. */
  call: (t: ContactTarget, focus?: "call" | "whatsapp") => void;
  /** Start a chat (sends signed-out users to sign in first). */
  chat: (t: ContactTarget) => void;
};
const ContactContext = createContext<Ctx>({ call: () => {}, chat: () => {} });
export const useContact = () => use(ContactContext);

// Revealed numbers are cached for the session so reopening is instant and doesn't burn the rate limit.
const revealed = new Map<number, Contact>();

export function waLink(num: string, title: string) {
  const text = encodeURIComponent(`Hi, I saw your ${title} on Wahana. Is it still available?`);
  return `https://wa.me/${num.replace(/^\+/, "")}?text=${text}`;
}

/** One pair of sheets for the whole app, so long result lists don't mount a modal per card. */
export function ContactProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  const [callTarget, setCallTarget] = useState<(ContactTarget & { focus: "call" | "whatsapp" }) | null>(null);
  const [chatTarget, setChatTarget] = useState<ContactTarget | null>(null);

  const call = useCallback((t: ContactTarget, focus: "call" | "whatsapp" = "call") => {
    track("contact_opened", { listing_id: t.listingId, method: focus, source: t.source });
    setCallTarget({ ...t, focus });
  }, []);

  const chat = useCallback(
    (t: ContactTarget) => {
      track("contact_opened", { listing_id: t.listingId, method: "chat", source: t.source, signed_in: !!userId });
      if (!userId) {
        pendingAction.set({ kind: "chat", ...t });
        router.push({ pathname: "/signin", params: { reason: "chat" } });
        return;
      }
      setChatTarget(t);
    },
    [userId],
  );

  // Finish a chat that was started before signing in.
  useEffect(() => {
    if (!userId) return;
    const p = pendingAction.take("chat");
    if (p) setTimeout(() => setChatTarget({ listingId: p.listingId, title: p.title, price: p.price, sellerName: p.sellerName, source: p.source }), 400);
  }, [userId]);

  const value = useMemo(() => ({ call, chat }), [call, chat]);
  return (
    <ContactContext value={value}>
      {children}
      <CallSheet
        target={callTarget}
        onClose={() => setCallTarget(null)}
        onChat={(t) => {
          setCallTarget(null);
          setTimeout(() => chat(t), 250);
        }}
      />
      <ChatSheet target={chatTarget} onClose={() => setChatTarget(null)} />
    </ContactContext>
  );
}

function CallSheet({ target, onClose, onChat }: { target: (ContactTarget & { focus: "call" | "whatsapp" }) | null; onClose: () => void; onChat: (t: ContactTarget) => void }) {
  const c = useColors();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact>(null);
  const [copied, setCopied] = useState(false);
  const id = target?.listingId;

  useEffect(() => {
    if (!id) return;
    setCopied(false);
    const hit = revealed.get(id);
    if (hit) return setContact(hit);
    setContact(null);
    let alive = true;
    supabase.rpc("reveal_contact", { p_listing_id: id }).then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        toast({ tone: "error", title: error.message || "Couldn't show the number" });
        onClose();
        return;
      }
      const row = data?.[0];
      const value: Contact = row?.phone ? { phone: row.phone, whatsapp: row.whatsapp, seller_name: row.seller_name } : "none";
      revealed.set(id, value);
      setContact(value);
      if (value !== "none") track("phone_revealed", { listing_id: id });
    });
    return () => {
      alive = false;
    };
  }, [id, toast, onClose]);

  const ct = contact && contact !== "none" ? contact : null;
  const focus = target?.focus ?? "call";

  return (
    <Sheet open={!!target} onClose={onClose} title={focus === "whatsapp" ? "WhatsApp the seller" : "Call the seller"}>
      <View style={styles.pad}>
        {!!target && (
          <Text variant="small" tone="muted" numberOfLines={1}>
            {target.title}
          </Text>
        )}
        {contact === null ? (
          <View style={styles.loading}>
            <ActivityIndicator color={c.brand} />
            <Text tone="muted">Getting the number…</Text>
          </View>
        ) : ct ? (
          <>
            <View style={[styles.numberBox, { backgroundColor: c.surface2, borderColor: c.border }]}>
              <Text variant="small" weight="700" tone="muted">
                {ct.seller_name || target?.sellerName}
              </Text>
              <View style={styles.numberRow}>
                <Text numeric weight="800" style={styles.number} selectable>
                  {displayLkPhone(ct.phone)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copied ? "Copied" : "Copy number"}
                  hitSlop={8}
                  onPress={async () => {
                    await Clipboard.setStringAsync(ct.phone);
                    setCopied(true);
                  }}
                  style={({ pressed }) => [styles.copy, pressed && { backgroundColor: c.surface3 }]}
                >
                  {copied ? <Check size={20} color={c.good} /> : <Copy size={20} color={c.fgMuted} />}
                </Pressable>
              </View>
              <Text variant="small" tone="muted">
                Ad reference {target?.listingId}. Mention Wahana when you call.
              </Text>
            </View>
            <View style={styles.row}>
              <Button
                title="Call now"
                size="lg"
                style={styles.flex}
                variant={focus === "call" || !ct.whatsapp ? "primary" : "outline"}
                icon={<Phone size={18} color={focus === "call" || !ct.whatsapp ? "#fff" : c.brandText} />}
                onPress={() => {
                  track("call_tapped", { listing_id: target?.listingId, source: target?.source });
                  Linking.openURL(`tel:${ct.phone}`).catch(() => toast({ tone: "error", title: "This device can't make calls", body: displayLkPhone(ct.phone) }));
                }}
              />
              {!!ct.whatsapp && (
                <Button
                  title="WhatsApp"
                  size="lg"
                  style={styles.flex}
                  variant={focus === "whatsapp" ? "primary" : "outline"}
                  icon={<WhatsAppIcon color={focus === "whatsapp" ? "#fff" : c.brandText} />}
                  onPress={() => {
                    track("whatsapp_tapped", { listing_id: target?.listingId, source: target?.source });
                    Linking.openURL(waLink(ct.whatsapp!, target?.title ?? "vehicle")).catch(() => toast({ tone: "error", title: "Couldn't open WhatsApp" }));
                  }}
                />
              )}
            </View>
            {!ct.whatsapp && focus === "whatsapp" && <Text tone="muted">This seller hasn't added a WhatsApp number. Call or chat instead.</Text>}
            <Button title="Message on Wahana instead" variant="ghost" icon={<MessageCircle size={18} color={c.fgMuted} />} onPress={() => target && onChat(target)} />
            <View style={[styles.warn, { backgroundColor: c.accentSoft }]}>
              <ShieldAlert size={18} color={c.accentFg} />
              <Text variant="small" style={[styles.flex, { color: c.accentFg }]}>
                Never pay an advance before you've seen the vehicle and its papers.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text tone="muted">This seller hasn't shared a phone number. Send them a message instead; they'll get it straight away.</Text>
            <Button title="Message the seller" size="lg" icon={<MessageCircle size={18} color="#fff" />} onPress={() => target && onChat(target)} />
          </>
        )}
      </View>
    </Sheet>
  );
}

const QUICK = ["Is it still available?", "What's your best price?", "Can I see it this weekend?", "Is the CR book clear?", "Any accident repairs?"];

function ChatSheet({ target, onClose }: { target: ContactTarget | null; onClose: () => void }) {
  const c = useColors();
  const { toast } = useToast();
  const inbox = useInbox();
  const [body, setBody] = useState("");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setBody(`Hi, is your ${target.title} still available?`);
      setOffer("");
      setErr(null);
    }
  }, [target]);

  const offerAmount = Number(offer.replace(/\D/g, "")) || 0;
  const price = target?.price;
  const offerPct = price && offerAmount ? Math.round(((price - offerAmount) / price) * 100) : null;

  const send = async () => {
    if (!target || !body.trim()) return;
    if (offerAmount > 0 && offerAmount < 10_000) return setErr("Offers start at Rs 10,000.");
    setBusy(true);
    setErr(null);
    const text = offerAmount >= 10_000 ? formatOffer(offerAmount, body) : body.trim();
    const { data, error } = await supabase.rpc("start_conversation", { p_listing_id: target.listingId, p_body: text });
    setBusy(false);
    if (error || !data) {
      setErr(error?.message || "Couldn't send your message. Check your connection and try again.");
      return;
    }
    track("chat_started", { listing_id: target.listingId, with_offer: offerAmount >= 10_000, source: target.source });
    if (offerAmount >= 10_000) track("offer_sent", { listing_id: target.listingId, pct_below: offerPct });
    inbox.refresh();
    onClose();
    toast({ tone: "success", title: "Message sent", body: "You'll see replies in Chats." });
    router.push(`/chat/${data}`);
  };

  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      title="Message the seller"
      footer={<Button title="Send message" size="lg" full style={styles.flex} onPress={send} loading={busy} disabled={!body.trim()} />}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pad}>
        <Text variant="small" tone="muted">
          Your phone number and email stay private until you choose to share them.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick} keyboardShouldPersistTaps="handled">
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => setBody((b) => (b.includes(q) ? b : `${b.trim()} ${q}`.trim()))}
              accessibilityRole="button"
              accessibilityLabel={`Add: ${q}`}
              style={({ pressed }) => [styles.quickChip, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
            >
              <Text variant="small" weight="600">
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Input label="Your message" value={body} onChangeText={setBody} multiline maxLength={1900} />
        <Input
          label="Make an offer"
          optional
          prefix="Rs"
          keyboardType="number-pad"
          value={offerAmount ? offerAmount.toLocaleString("en-LK") : ""}
          onChangeText={setOffer}
          placeholder={price ? Math.round(price * 0.95).toLocaleString("en-LK") : "Your price"}
          hint={
            offerAmount > 0
              ? [formatLakhs(offerAmount), offerPct != null && offerPct !== 0 ? `${Math.abs(offerPct)}% ${offerPct > 0 ? "below" : "above"} the asking price` : null].filter(Boolean).join(" · ")
              : "Sellers see offers highlighted in the chat."
          }
          error={err}
        />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 14 },
  loading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 32 },
  numberBox: { borderRadius: radius.xl, borderWidth: 1, padding: 16, gap: 4 },
  numberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  number: { fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  copy: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  warn: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg, alignItems: "flex-start" },
  quick: { gap: 8, paddingVertical: 2 },
  quickChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, minHeight: 36, justifyContent: "center" },
});
