import "server-only";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Facets, HomeSummary, ListingCard, PriceSpread, SearchResult } from "@/lib/types";
import type { Json } from "@/lib/database.types";

const EMPTY: SearchResult = { total: 0, page: 1, page_size: 24, items: [], top: [] };

export async function searchListings(p: Record<string, unknown>): Promise<SearchResult> {
  const { data, error } = await createPublicClient().rpc("search_listings", { p: p as Json });
  if (error) {
    console.error("search_listings", error);
    return EMPTY;
  }
  return (data as unknown as SearchResult) ?? EMPTY;
}

export async function searchFacets(p: Record<string, unknown>): Promise<Facets | null> {
  const { data, error } = await createPublicClient().rpc("search_facets", { p: p as Json });
  if (error) {
    console.error("search_facets", error);
    return null;
  }
  return data as unknown as Facets;
}

export async function homeSummary(): Promise<HomeSummary> {
  const { data } = await createPublicClient().rpc("home_summary");
  return (data as unknown as HomeSummary) ?? { total: 0, by_type: {}, good_deals: 0, popular_models: [] };
}

export async function similarListings(id: number, limit = 8): Promise<ListingCard[]> {
  const { data } = await createPublicClient().rpc("similar_listings", { p_listing_id: id, p_limit: limit });
  return (data as unknown as ListingCard[]) ?? [];
}

export async function priceSpread(modelId: number, condition: string, year: number, exclude?: number): Promise<PriceSpread | null> {
  const { data } = await createPublicClient().rpc("price_spread", {
    p_model_id: modelId,
    p_condition: condition,
    p_year: year,
    ...(exclude ? { p_exclude: exclude } : {}),
  });
  const s = data as unknown as PriceSpread | null;
  return s && s.peer_count > 0 ? s : null;
}

const DETAIL_SELECT = `
  id, seller_id, vehicle_type, make_id, model_id, make_other, model_other, trim_level, condition,
  year_manufactured, year_registered, mileage_km, engine_cc, fuel, transmission, body_type, colour,
  previous_owners, features, price_lkr, negotiable, leasing_available, title, slug, description,
  district_id, city_id, status, is_demo, promoted_until, urgent_until, bumped_at, published_at,
  expires_at, sold_at, view_count, contact_reveal_count, market_median_lkr, market_peer_count,
  price_rating, photo_count, cover_photo, created_at, updated_at,
  make:makes(id, name, slug),
  model:models(id, name, slug),
  district:districts(id, name, slug, name_si),
  city:cities(id, name, slug),
  seller:profiles!listings_seller_id_fkey(id, display_name, account_type, dealer_name, dealer_slug, created_at),
  photos:listing_photos(id, path, thumb_path, width, height, position, created_at),
  price_changes:listing_price_changes(id, old_price_lkr, new_price_lkr, changed_at)
`;

export async function getListing(id: number) {
  const db = await createClient();
  const { data, error } = await db.from("listings").select(DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) console.error("getListing", error);
  if (!data) return null;
  const photos = [...(data.photos ?? [])].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  const price_changes = [...(data.price_changes ?? [])].sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  return { ...data, photos, price_changes };
}

export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListing>>>;
