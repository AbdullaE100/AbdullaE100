import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { VEHICLE_TYPES, typeBySlug } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createPublicClient();
  const [{ data: landings }, { data: ads }] = await Promise.all([
    db.rpc("landing_pages"),
    db.from("listings").select("id, slug, updated_at").eq("status", "active").order("bumped_at", { ascending: false }).limit(20000),
  ]);
  const now = new Date();
  const fixed = ["", "/vehicles", "/value", "/leasing", "/dealers", "/safety", "/about", "/terms", "/privacy", "/refunds", ...VEHICLE_TYPES.map((t) => `/${t.path}`)].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const browse = (landings ?? [])
    .filter((l) => l.ads > 0)
    .map((l) => ({
      url: `${SITE_URL}/${typeBySlug(l.vehicle_type)?.path ?? "vehicles"}/${l.make_slug}${l.model_slug ? `/${l.model_slug}` : ""}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: l.model_slug ? 0.6 : 0.7,
    }));
  const listings = (ads ?? []).map((a) => ({ url: `${SITE_URL}/ad/${a.id}/${a.slug}`, lastModified: new Date(a.updated_at), changeFrequency: "weekly" as const, priority: 0.5 }));
  return [...fixed, ...browse, ...listings];
}
