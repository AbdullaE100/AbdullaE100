import { keepPreviousData, QueryClient, focusManager, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import type { Json } from "@shared/database.types";
import { filtersToRpc, parseFilters, type Filters, type Names } from "@shared/search";
import type { City, District, Facets, HomeSummary, ListingCard, Make, Model, PriceSpread, PromotionProduct, SearchResult } from "@shared/types";
import { supabase } from "./supabase";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 10 * 60_000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
});

// Refetch stale queries when the app returns to the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (s) => focusManager.setFocused(s === "active"));
}

export const PAGE_SIZE = 20;
const EMPTY: SearchResult = { total: 0, page: 1, page_size: PAGE_SIZE, items: [], top: [] };

async function rpcSearch(p: Record<string, unknown>): Promise<SearchResult> {
  const { data, error } = await supabase.rpc("search_listings", { p: p as Json });
  if (error) throw error;
  return (data as unknown as SearchResult) ?? EMPTY;
}

export function useHomeSummary() {
  return useQuery({
    queryKey: ["home"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("home_summary");
      if (error) throw error;
      return data as unknown as HomeSummary;
    },
  });
}

/** A fixed set of cards, e.g. "Good deals" on the home screen. */
export function useRail(key: string, p: Record<string, unknown>) {
  return useQuery({ queryKey: ["rail", key, p], queryFn: () => rpcSearch({ page_size: 12, ...p }).then((r) => r.items) });
}

const clean = (f: Filters) => {
  const out: Filters = {};
  for (const [k, v] of Object.entries(f)) if (v) out[k as keyof Filters] = v;
  delete out.page;
  return out;
};

/** Paged results. Top ads come back with page 1 only. */
export function useSearch(f: Filters, extra: Record<string, unknown> = {}) {
  const base = clean(f);
  return useInfiniteQuery({
    queryKey: ["search", base, extra],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => rpcSearch({ ...filtersToRpc(base, extra), page: pageParam, page_size: PAGE_SIZE }),
    getNextPageParam: (last) => (last.page * last.page_size < last.total && last.page < 200 ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

/** Just the count, for "Show 1,234 results" while filters are being edited. */
export function useSearchCount(f: Filters) {
  const base = clean(f);
  return useQuery({
    queryKey: ["count", base],
    queryFn: () => rpcSearch({ ...filtersToRpc(base), page_size: 1 }).then((r) => r.total),
    placeholderData: keepPreviousData,
  });
}

export function useFacets(f: Filters, enabled = true) {
  const base = clean(f);
  return useQuery({
    queryKey: ["facets", base],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_facets", { p: filtersToRpc(base) as Json });
      if (error) throw error;
      return data as unknown as Facets;
    },
    placeholderData: keepPreviousData,
  });
}

export type Catalog = { makes: Make[]; models: Model[]; districts: District[] };

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    staleTime: 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    queryFn: async (): Promise<Catalog> => {
      const [makes, models, districts] = await Promise.all([
        supabase.from("makes").select("id, slug, name, vehicle_types, is_popular, sort").order("sort").order("name"),
        supabase.from("models").select("id, make_id, slug, name, vehicle_type, body_type, is_popular, sort").order("sort").order("name"),
        supabase.from("districts").select("id, slug, name, name_si, name_ta, province_id").order("name"),
      ]);
      const err = makes.error || models.error || districts.error;
      if (err) throw err;
      return { makes: makes.data as Make[], models: models.data as Model[], districts: districts.data as District[] };
    },
  });
}

export function useCities(districtId: number | null | undefined) {
  return useQuery({
    queryKey: ["cities", districtId],
    enabled: !!districtId,
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, district_id, slug, name, name_si, name_ta, is_major")
        .eq("district_id", districtId!)
        .order("is_major", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as City[];
    },
  });
}

/** Human names for the slugs in a filter set, from the cached catalog. */
export function resolveNames(f: Filters, cat: Catalog | undefined, cities?: City[]): Names & { makeId?: number; districtId?: number } {
  if (!cat) return {};
  const make = f.make ? cat.makes.find((m) => m.slug === f.make) : undefined;
  const model =
    f.model && make
      ? (cat.models.find((m) => m.slug === f.model && m.make_id === make.id && (!f.type || m.vehicle_type === f.type)) ??
        cat.models.find((m) => m.slug === f.model && m.make_id === make.id))
      : undefined;
  const district = f.district ? cat.districts.find((d) => d.slug === f.district) : undefined;
  const city = f.city ? cities?.find((c) => c.slug === f.city) : undefined;
  return { make: make?.name, model: model?.name, district: district?.name, city: city?.name, makeId: make?.id, districtId: district?.id };
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

async function fetchListing(id: number) {
  const { data, error } = await supabase.from("listings").select(DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const photos = [...(data.photos ?? [])].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  const price_changes = [...(data.price_changes ?? [])].sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  return { ...data, photos, price_changes };
}
export type ListingDetail = NonNullable<Awaited<ReturnType<typeof fetchListing>>>;

export function useListing(id: number) {
  return useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id), enabled: Number.isInteger(id) && id > 0 });
}

export function useSimilar(id: number, enabled = true) {
  return useQuery({
    queryKey: ["similar", id],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.rpc("similar_listings", { p_listing_id: id, p_limit: 10 });
      return (data as unknown as ListingCard[]) ?? [];
    },
  });
}

export function useSellerAds(sellerId: string | undefined, exclude?: number) {
  return useQuery({
    queryKey: ["seller-ads", sellerId],
    enabled: !!sellerId,
    queryFn: () => rpcSearch({ seller: sellerId, page_size: 10 }),
    select: (r) => ({ total: r.total, items: r.items.filter((i) => i.id !== exclude) }),
  });
}

export function usePriceSpread(modelId: number | null | undefined, condition: string | null | undefined, year: number | null | undefined, exclude?: number) {
  return useQuery({
    queryKey: ["spread", modelId, condition, year, exclude],
    enabled: !!modelId && !!condition && !!year,
    queryFn: async () => {
      const { data } = await supabase.rpc("price_spread", {
        p_model_id: modelId!,
        p_condition: condition!,
        p_year: year!,
        ...(exclude ? { p_exclude: exclude } : {}),
      });
      const s = data as unknown as PriceSpread | null;
      return s && s.peer_count > 0 ? s : null;
    },
  });
}

export function useCardsByIds(ids: number[], enabled = true) {
  return useQuery({
    queryKey: ["by-ids", ids],
    enabled: enabled && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_listings_by_ids", { p_ids: ids });
      if (error) throw error;
      return (data as unknown as ListingCard[]) ?? [];
    },
    placeholderData: keepPreviousData,
  });
}

export type MyAd = {
  id: number;
  slug: string;
  title: string;
  vehicle_type: string;
  price_lkr: number;
  status: string;
  cover_thumb: string | null;
  photo_count: number;
  view_count: number;
  contact_reveal_count: number;
  expires_at: string;
  published_at: string;
  sold_at: string | null;
  promoted_until: string | null;
  urgent_until: string | null;
  price_rating: string | null;
  market_median_lkr: number | null;
  created_at: string;
  chats: number;
};

export function useMyAds(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-ads", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyAd[]> => {
      const [ads, convs] = await Promise.all([
        supabase
          .from("listings")
          .select(
            "id, slug, title, vehicle_type, price_lkr, status, cover_thumb, photo_count, view_count, contact_reveal_count, expires_at, published_at, sold_at, promoted_until, urgent_until, price_rating, market_median_lkr, created_at",
          )
          .eq("seller_id", userId!)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("conversations").select("listing_id").eq("seller_id", userId!).limit(1000),
      ]);
      if (ads.error) throw ads.error;
      const chats = new Map<number, number>();
      for (const c of convs.data ?? []) chats.set(c.listing_id, (chats.get(c.listing_id) ?? 0) + 1);
      return (ads.data ?? []).map((a) => ({ ...a, chats: chats.get(a.id) ?? 0 }));
    },
  });
}

const CONV_SELECT = `id, listing_id, buyer_id, seller_id, last_message_at, last_message_preview, last_sender_id, buyer_last_read_at, seller_last_read_at, created_at,
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

function shapeConversation(c: any, me: string): ConversationSummary {
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

export function useConversations(me: string | undefined) {
  return useQuery({
    queryKey: ["conversations", me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select(CONV_SELECT).order("last_message_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map((c) => shapeConversation(c, me!));
    },
  });
}

export type Message = { id: number; sender_id: string; body: string; created_at: string; pending?: boolean; failed?: boolean };

export function useConversation(id: string, me: string | undefined) {
  return useQuery({
    queryKey: ["conversation", id, me],
    enabled: !!me && !!id,
    queryFn: async () => {
      const [{ data: c, error }, { data: msgs, error: msgErr }] = await Promise.all([
        supabase.from("conversations").select(CONV_SELECT).eq("id", id).maybeSingle(),
        supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", id).order("created_at", { ascending: false }).limit(300),
      ]);
      if (error || msgErr) throw error ?? msgErr;
      if (!c) return null;
      return { ...shapeConversation(c, me!), messages: ((msgs ?? []) as Message[]).reverse() };
    },
  });
}

export type SavedSearch = { id: string; label: string; query: string; alerts: boolean; created_at: string; last_checked_at: string };

export function useSavedSearches(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-searches", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_searches").select("id, label, query, alerts, created_at, last_checked_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedSearch[];
    },
  });
}

/**
 * Saved searches store the web URL (e.g. /cars/toyota/aqua?district=colombo)
 * so they work on both. Dealer pages (/dealers/<slug>) carry a seller.
 */
export function parseSavedQuery(query: string): { filters: Filters; dealerSlug?: string } | null {
  let url: URL;
  try {
    url = new URL(query, "https://x.local");
  } catch {
    return null;
  }
  const [first, ...rest] = url.pathname.split("/").filter(Boolean);
  if (first === "dealers" && rest[0]) {
    const f = parseFilters("vehicles", [], url.searchParams);
    if (!f) return null;
    for (const k of ["type", "make", "model"] as const) {
      const v = url.searchParams.get(k);
      if (v && /^[a-z0-9-]{1,60}$/.test(v)) f[k] = v;
    }
    return { filters: f, dealerSlug: rest[0] };
  }
  const f = parseFilters(first ?? "vehicles", rest, url.searchParams);
  return f ? { filters: f } : null;
}

/** Total ads and how many arrived since the search was last opened. */
export function useSavedSearchStats(s: SavedSearch) {
  return useQuery({
    queryKey: ["saved-search-stats", s.id, s.query, s.last_checked_at],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<{ total: number; fresh: number } | "unavailable"> => {
      const parsed = parseSavedQuery(s.query);
      if (!parsed) return "unavailable";
      let seller: string | undefined;
      if (parsed.dealerSlug) {
        const { data } = await supabase.from("profiles").select("id").eq("dealer_slug", parsed.dealerSlug).maybeSingle();
        if (!data) return "unavailable";
        seller = data.id;
      }
      const r = await rpcSearch(filtersToRpc({ ...parsed.filters, sort: undefined, page: undefined }, { page_size: 48, ...(seller ? { seller } : {}) }));
      const fresh = r.items.filter((i) => new Date(i.published_at) > new Date(s.last_checked_at)).length;
      return { total: r.total, fresh };
    },
  });
}

export function usePromotionProducts() {
  return useQuery({
    queryKey: ["promos"],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("promotion_products").select("slug, name, description, price_lkr, days, kind, sort").eq("active", true).order("sort");
      if (error) throw error;
      return data as PromotionProduct[];
    },
  });
}

export { rpcSearch };
