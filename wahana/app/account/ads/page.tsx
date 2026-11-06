import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MyAds, type MyAd } from "./my-ads";

export const metadata: Metadata = { title: "My ads", robots: { index: false } };

export default async function MyAdsPage() {
  const user = await requireUser("/account/ads");
  const db = await createClient();
  const [{ data: ads }, { data: convs }] = await Promise.all([
    db
      .from("listings")
      .select("id, slug, title, vehicle_type, price_lkr, status, cover_thumb, cover_photo, photo_count, view_count, contact_reveal_count, expires_at, published_at, sold_at, promoted_until, urgent_until, price_rating, market_median_lkr, created_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("conversations").select("listing_id").eq("seller_id", user.id).limit(1000),
  ]);
  const chats = new Map<number, number>();
  for (const c of convs ?? []) chats.set(c.listing_id, (chats.get(c.listing_id) ?? 0) + 1);
  const list: MyAd[] = (ads ?? []).map((a) => ({ ...a, chats: chats.get(a.id) ?? 0 }));
  return <MyAds ads={list} />;
}
