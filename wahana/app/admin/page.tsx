import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModerationQueue, type QueueItem } from "./queue";

export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

export default async function AdminPage() {
  await requireUser("/admin");
  const db = await createClient();
  const { data: staff } = await db.rpc("is_staff");
  if (!staff) notFound();
  const { data: reports } = await db
    .from("reports")
    .select("id, listing_id, reason, details, created_at, status")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(300);
  const ids = [...new Set((reports ?? []).map((r) => r.listing_id))];
  const { data: listings } = await db
    .from("listings")
    .select("id, slug, title, status, price_lkr, cover_thumb, vehicle_type, report_count, seller_id")
    .or(`status.eq.under_review${ids.length ? `,id.in.(${ids.join(",")})` : ""}`)
    .order("report_count", { ascending: false })
    .limit(200);
  const items: QueueItem[] = (listings ?? []).map((l) => ({ ...l, reports: (reports ?? []).filter((r) => r.listing_id === l.id) }));
  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Moderation</h1>
      <p className="mb-6 mt-1 text-fg-muted">Ads with 3 or more reports are hidden automatically until you restore or remove them.</p>
      <ModerationQueue items={items} />
    </div>
  );
}
