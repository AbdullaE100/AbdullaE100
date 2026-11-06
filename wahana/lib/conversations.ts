import "server-only";
import { createClient } from "@/lib/supabase/server";

const SELECT = `id, listing_id, buyer_id, seller_id, last_message_at, last_message_preview, last_sender_id, buyer_last_read_at, seller_last_read_at, created_at,
  listing:listings(id, slug, title, price_lkr, cover_thumb, vehicle_type, status),
  buyer:profiles!conversations_buyer_id_fkey(display_name, dealer_name, account_type),
  seller:profiles!conversations_seller_id_fkey(display_name, dealer_name, account_type)`;

type P = { display_name: string | null; dealer_name: string | null; account_type: string } | null;
const nameOf = (p: P, fallback: string) => (p?.account_type === "dealer" && p.dealer_name) || p?.display_name || fallback;

export type ConversationSummary = {
  id: string;
  role: "buyer" | "seller";
  other: string;
  listing: { id: number; slug: string; title: string; price_lkr: number; cover_thumb: string | null; vehicle_type: string; status: string } | null;
  preview: string | null;
  lastAt: string;
  unread: boolean;
  mineLast: boolean;
};

function shape(c: any, me: string): ConversationSummary {
  const role = c.buyer_id === me ? "buyer" : "seller";
  const lastRead = role === "buyer" ? c.buyer_last_read_at : c.seller_last_read_at;
  return {
    id: c.id,
    role,
    other: role === "buyer" ? nameOf(c.seller, "Seller") : nameOf(c.buyer, "Buyer"),
    listing: c.listing ?? null,
    preview: c.last_message_preview,
    lastAt: c.last_message_at,
    unread: c.last_sender_id !== me && new Date(c.last_message_at) > new Date(lastRead),
    mineLast: c.last_sender_id === me,
  };
}

export async function getConversations(me: string): Promise<ConversationSummary[]> {
  const db = await createClient();
  const { data } = await db.from("conversations").select(SELECT).order("last_message_at", { ascending: false }).limit(100);
  return (data ?? []).map((c) => shape(c, me));
}

export async function getConversation(me: string, id: string) {
  const db = await createClient();
  const [{ data: c }, { data: msgs }] = await Promise.all([
    db.from("conversations").select(SELECT).eq("id", id).maybeSingle(),
    db.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", id).order("created_at", { ascending: false }).limit(300),
  ]);
  if (!c) return null;
  return { ...shape(c, me), messages: (msgs ?? []).reverse() };
}
