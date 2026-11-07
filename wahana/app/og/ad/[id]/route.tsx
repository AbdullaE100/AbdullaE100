import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/env";
import { FUELS, label } from "@/lib/constants";

const fontDir = path.join(process.cwd(), "node_modules/@fontsource/plus-jakarta-sans/files");
let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | null = null;
const loadFonts = () =>
  (fonts ??= Promise.all([
    readFile(path.join(fontDir, "plus-jakarta-sans-latin-500-normal.woff")).then((data) => ({ name: "Jakarta", data, weight: 500 as const, style: "normal" as const })),
    readFile(path.join(fontDir, "plus-jakarta-sans-latin-800-normal.woff")).then((data) => ({ name: "Jakarta", data, weight: 800 as const, style: "normal" as const })),
  ]).catch(() => []));

// Social preview (WhatsApp, Facebook, X) for an ad: photo, price and rating.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) return new Response("Not found", { status: 404 });
  const { data: l } = await createPublicClient()
    .from("listings")
    .select("title, price_lkr, negotiable, condition, year_manufactured, mileage_km, fuel, transmission, price_rating, cover_photo, status, district:districts(name), city:cities(name)")
    .eq("id", Number(id))
    .maybeSingle();
  if (!l) return new Response("Not found", { status: 404 });

  // Satori can't decode WebP (our upload format), so let Next's image optimiser
  // re-encode the cover as JPEG.
  let photo: string | null = null;
  const src = photoUrl(l.cover_photo);
  if (src) {
    const origin = new URL(req.url).origin;
    const r = await fetch(`${origin}/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`, { headers: { Accept: "image/jpeg" } }).catch(() => null);
    const type = r?.headers.get("content-type") ?? "";
    if (r?.ok && /image\/(jpeg|png)/.test(type)) photo = `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  }

  const price = `Rs ${Math.round(l.price_lkr).toLocaleString("en-LK")}`;
  const where = [l.city?.name, l.district?.name].filter(Boolean).join(", ");
  const facts = [
    String(l.year_manufactured),
    l.mileage_km != null && l.condition !== "brand_new" ? `${l.mileage_km.toLocaleString("en-LK")} km` : l.condition === "brand_new" ? "Brand new" : null,
    l.fuel ? label(FUELS, l.fuel) : null,
    l.transmission === "automatic" ? "Auto" : l.transmission === "manual" ? "Manual" : null,
  ].filter(Boolean);
  const rating =
    l.price_rating === "good" ? { text: "Good price", bg: "#e1f5ea", fg: "#077042" } : l.price_rating === "fair" ? { text: "Fair price", bg: "#f0f2f5", fg: "#4d5664" } : l.price_rating === "high" ? { text: "Above market", bg: "#fdede4", fg: "#b03a0a" } : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", fontFamily: "Jakarta, sans-serif" }}>
        <div
          style={{
            width: 620,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: photo ? "#0d1117" : "linear-gradient(135deg, #1f4fe0 0%, #4f7cff 60%, #f5a623 140%)",
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={620} height={630} style={{ width: 620, height: 630, objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
              <svg width="260" height="130" viewBox="0 0 120 60" fill="white">
                <path d="M8 41v-6.5c0-3 1.8-4.6 4.6-5.1L30 26.2 41.6 16.6c1.7-1.4 3.8-2.1 6-2.1h27.2c2.6 0 5 1.1 6.7 3l8.8 9.4 16.6 2.2c3.3.5 5.6 3 5.6 6.4v5.5c0 1.3-1 2.3-2.3 2.3H10.3C9 43.3 8 42.3 8 41Z" opacity="0.9" />
                <circle cx="31" cy="43" r="9" />
                <circle cx="92" cy="43" r="9" />
              </svg>
              <div style={{ marginTop: 18, fontSize: 28, opacity: 0.85 }}>Photos on the ad</div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 52px 48px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1f4fe0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 32, fontWeight: 800 }}>W</div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 800, color: "#0d1117" }}>
              Wahana<span style={{ color: "#636d7c" }}>.lk</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {l.status === "sold" && <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#1f4fe0", marginBottom: 8 }}>SOLD</div>}
            <div style={{ fontSize: 46, fontWeight: 800, color: "#0d1117", lineHeight: 1.1, display: "flex" }}>{l.title}</div>
            <div style={{ fontSize: 58, fontWeight: 800, color: "#0d1117", marginTop: 18, display: "flex" }}>{price}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
              {rating && <div style={{ display: "flex", padding: "6px 16px", borderRadius: 999, background: rating.bg, color: rating.fg, fontSize: 24, fontWeight: 700 }}>{rating.text}</div>}
              {l.negotiable && <div style={{ display: "flex", fontSize: 24, color: "#636d7c" }}>Negotiable</div>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 26, color: "#4d5664" }}>
            <div style={{ display: "flex" }}>{facts.join("  ·  ")}</div>
            {where && <div style={{ display: "flex" }}>{where}</div>}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await loadFonts(), headers: { "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
