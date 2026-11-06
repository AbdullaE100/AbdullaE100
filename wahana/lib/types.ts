// Shapes returned by the database's JSON RPCs (see public.listing_card etc).

export type ListingCard = {
  id: number;
  slug: string;
  title: string;
  vehicle_type: string;
  price_lkr: number;
  negotiable: boolean;
  condition: string;
  year_manufactured: number;
  year_registered: number | null;
  mileage_km: number | null;
  fuel: string | null;
  transmission: string | null;
  engine_cc: number | null;
  district: string;
  district_slug: string;
  city: string | null;
  cover_photo: string | null;
  cover_thumb: string | null;
  photo_count: number;
  price_rating: "good" | "fair" | "high" | null;
  market_median_lkr: number | null;
  market_peer_count: number | null;
  bumped_at: string;
  published_at: string;
  is_top: boolean;
  is_urgent: boolean;
  is_dealer: boolean;
  dealer_name: string | null;
  is_demo: boolean;
  status: string;
};

export type SearchResult = {
  total: number;
  page: number;
  page_size: number;
  items: ListingCard[];
  top: ListingCard[];
};

export type FacetCount = { slug: string; name: string; count: number };

export type Facets = {
  type: Record<string, number>;
  make: FacetCount[];
  model?: FacetCount[];
  district: FacetCount[];
  condition: Record<string, number>;
  fuel: Record<string, number>;
  transmission: Record<string, number>;
};

export type HomeSummary = {
  total: number;
  by_type: Record<string, number>;
  good_deals: number;
  popular_models: { make: string; make_slug: string; model: string; model_slug: string; type: string; count: number }[];
};

export type PriceSpread = {
  peer_count: number;
  min: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  max: number | null;
  median_mileage: number | null;
};

export type Make = { id: number; slug: string; name: string; vehicle_types: string[]; is_popular: boolean; sort: number };
export type Model = { id: number; make_id: number; slug: string; name: string; vehicle_type: string; body_type: string | null; is_popular: boolean; sort: number };
export type District = { id: number; slug: string; name: string; name_si: string | null; name_ta: string | null; province_id: number };
export type City = { id: number; district_id: number; slug: string; name: string; name_si: string | null; name_ta: string | null; is_major: boolean };
export type PromotionProduct = { slug: string; name: string; description: string; price_lkr: number; days: number; kind: "top" | "urgent" | "bump"; sort: number };

export type RefData = {
  makes: Make[];
  models: Model[];
  districts: District[];
};
