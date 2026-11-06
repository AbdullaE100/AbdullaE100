// Generated from the Supabase schema (project: projectX), lightly condensed.
// Regenerate with: npx supabase gen types typescript --project-id foscdnhzmpuvtydqvkmz
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      cities: {
        Row: { district_id: number; id: number; is_major: boolean; lat: number | null; lng: number | null; name: string; name_si: string | null; name_ta: string | null; slug: string };
        Insert: { district_id: number; is_major?: boolean; lat?: number | null; lng?: number | null; name: string; name_si?: string | null; name_ta?: string | null; slug: string };
        Update: { district_id?: number; is_major?: boolean; lat?: number | null; lng?: number | null; name?: string; name_si?: string | null; name_ta?: string | null; slug?: string };
        Relationships: [
          { foreignKeyName: "cities_district_id_fkey"; columns: ["district_id"]; isOneToOne: false; referencedRelation: "districts"; referencedColumns: ["id"] },
        ];
      };
      contact_reveals: {
        Row: { created_at: string; id: number; listing_id: number; viewer_id: string | null; viewer_key: string };
        Insert: { created_at?: string; listing_id: number; viewer_id?: string | null; viewer_key: string };
        Update: { created_at?: string; listing_id?: number; viewer_id?: string | null; viewer_key?: string };
        Relationships: [
          { foreignKeyName: "contact_reveals_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
        ];
      };
      conversations: {
        Row: { buyer_id: string; buyer_last_read_at: string; created_at: string; id: string; last_message_at: string; last_message_preview: string | null; last_sender_id: string | null; listing_id: number; seller_id: string; seller_last_read_at: string };
        Insert: { buyer_id: string; buyer_last_read_at?: string; created_at?: string; id?: string; last_message_at?: string; last_message_preview?: string | null; last_sender_id?: string | null; listing_id: number; seller_id: string; seller_last_read_at?: string };
        Update: { buyer_id?: string; buyer_last_read_at?: string; created_at?: string; id?: string; last_message_at?: string; last_message_preview?: string | null; last_sender_id?: string | null; listing_id?: number; seller_id?: string; seller_last_read_at?: string };
        Relationships: [
          { foreignKeyName: "conversations_buyer_id_fkey"; columns: ["buyer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "conversations_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
          { foreignKeyName: "conversations_seller_id_fkey"; columns: ["seller_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      districts: {
        Row: { id: number; name: string; name_si: string | null; name_ta: string | null; province_id: number; slug: string };
        Insert: { id: number; name: string; name_si?: string | null; name_ta?: string | null; province_id: number; slug: string };
        Update: { id?: number; name?: string; name_si?: string | null; name_ta?: string | null; province_id?: number; slug?: string };
        Relationships: [
          { foreignKeyName: "districts_province_id_fkey"; columns: ["province_id"]; isOneToOne: false; referencedRelation: "provinces"; referencedColumns: ["id"] },
        ];
      };
      favourites: {
        Row: { created_at: string; listing_id: number; user_id: string };
        Insert: { created_at?: string; listing_id: number; user_id: string };
        Update: { created_at?: string; listing_id?: number; user_id?: string };
        Relationships: [
          { foreignKeyName: "favourites_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
        ];
      };
      listing_contacts: {
        Row: { listing_id: number; phone: string; seller_name: string | null; whatsapp: string | null };
        Insert: { listing_id: number; phone: string; seller_name?: string | null; whatsapp?: string | null };
        Update: { listing_id?: number; phone?: string; seller_name?: string | null; whatsapp?: string | null };
        Relationships: [
          { foreignKeyName: "listing_contacts_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: true; referencedRelation: "listings"; referencedColumns: ["id"] },
        ];
      };
      listing_photos: {
        Row: { created_at: string; height: number | null; id: string; listing_id: number; path: string; position: number; thumb_path: string | null; width: number | null };
        Insert: { created_at?: string; height?: number | null; id?: string; listing_id: number; path: string; position?: number; thumb_path?: string | null; width?: number | null };
        Update: { created_at?: string; height?: number | null; id?: string; listing_id?: number; path?: string; position?: number; thumb_path?: string | null; width?: number | null };
        Relationships: [
          { foreignKeyName: "listing_photos_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
        ];
      };
      listing_price_changes: {
        Row: { changed_at: string; id: number; listing_id: number; new_price_lkr: number; old_price_lkr: number };
        Insert: { changed_at?: string; listing_id: number; new_price_lkr: number; old_price_lkr: number };
        Update: { changed_at?: string; listing_id?: number; new_price_lkr?: number; old_price_lkr?: number };
        Relationships: [
          { foreignKeyName: "listing_price_changes_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
        ];
      };
      listings: {
        Row: ListingRow;
        Insert: Partial<Omit<ListingRow, "id" | "seller_id" | "condition" | "district_id" | "price_lkr" | "vehicle_type" | "year_manufactured">> &
          Pick<ListingRow, "seller_id" | "condition" | "district_id" | "price_lkr" | "vehicle_type" | "year_manufactured">;
        Update: Partial<Omit<ListingRow, "id">>;
        Relationships: [
          { foreignKeyName: "listings_city_id_fkey"; columns: ["city_id"]; isOneToOne: false; referencedRelation: "cities"; referencedColumns: ["id"] },
          { foreignKeyName: "listings_district_id_fkey"; columns: ["district_id"]; isOneToOne: false; referencedRelation: "districts"; referencedColumns: ["id"] },
          { foreignKeyName: "listings_make_id_fkey"; columns: ["make_id"]; isOneToOne: false; referencedRelation: "makes"; referencedColumns: ["id"] },
          { foreignKeyName: "listings_model_id_fkey"; columns: ["model_id"]; isOneToOne: false; referencedRelation: "models"; referencedColumns: ["id"] },
          { foreignKeyName: "listings_seller_id_fkey"; columns: ["seller_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "listings_vehicle_type_fkey"; columns: ["vehicle_type"]; isOneToOne: false; referencedRelation: "vehicle_types"; referencedColumns: ["slug"] },
        ];
      };
      makes: {
        Row: { id: number; is_popular: boolean; name: string; slug: string; sort: number; vehicle_types: string[] };
        Insert: { is_popular?: boolean; name: string; slug: string; sort?: number; vehicle_types?: string[] };
        Update: { is_popular?: boolean; name?: string; slug?: string; sort?: number; vehicle_types?: string[] };
        Relationships: [];
      };
      messages: {
        Row: { body: string; conversation_id: string; created_at: string; id: number; sender_id: string };
        Insert: { body: string; conversation_id: string; created_at?: string; sender_id: string };
        Update: { body?: string; conversation_id?: string; created_at?: string; sender_id?: string };
        Relationships: [
          { foreignKeyName: "messages_conversation_id_fkey"; columns: ["conversation_id"]; isOneToOne: false; referencedRelation: "conversations"; referencedColumns: ["id"] },
          { foreignKeyName: "messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      models: {
        Row: { aliases: string[]; body_type: string | null; id: number; is_popular: boolean; make_id: number; name: string; slug: string; sort: number; vehicle_type: string };
        Insert: { aliases?: string[]; body_type?: string | null; is_popular?: boolean; make_id: number; name: string; slug: string; sort?: number; vehicle_type: string };
        Update: { aliases?: string[]; body_type?: string | null; is_popular?: boolean; make_id?: number; name?: string; slug?: string; sort?: number; vehicle_type?: string };
        Relationships: [
          { foreignKeyName: "models_make_id_fkey"; columns: ["make_id"]; isOneToOne: false; referencedRelation: "makes"; referencedColumns: ["id"] },
          { foreignKeyName: "models_vehicle_type_fkey"; columns: ["vehicle_type"]; isOneToOne: false; referencedRelation: "vehicle_types"; referencedColumns: ["slug"] },
        ];
      };
      profile_contacts: {
        Row: { id: string; phone: string | null; updated_at: string; whatsapp: string | null };
        Insert: { id: string; phone?: string | null; updated_at?: string; whatsapp?: string | null };
        Update: { id?: string; phone?: string | null; updated_at?: string; whatsapp?: string | null };
        Relationships: [
          { foreignKeyName: "profile_contacts_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [
          { foreignKeyName: "profiles_city_id_fkey"; columns: ["city_id"]; isOneToOne: false; referencedRelation: "cities"; referencedColumns: ["id"] },
          { foreignKeyName: "profiles_district_id_fkey"; columns: ["district_id"]; isOneToOne: false; referencedRelation: "districts"; referencedColumns: ["id"] },
        ];
      };
      promotion_products: {
        Row: { active: boolean; days: number; description: string; kind: string; name: string; price_lkr: number; slug: string; sort: number };
        Insert: { active?: boolean; days?: number; description: string; kind: string; name: string; price_lkr: number; slug: string; sort?: number };
        Update: { active?: boolean; days?: number; description?: string; kind?: string; name?: string; price_lkr?: number; slug?: string; sort?: number };
        Relationships: [];
      };
      promotions: {
        Row: { amount_lkr: number; created_at: string; id: string; listing_id: number; paid_at: string | null; product_slug: string; provider: string; provider_payment_id: string | null; provider_status_code: string | null; status: string; user_id: string };
        Insert: { amount_lkr: number; created_at?: string; id?: string; listing_id: number; paid_at?: string | null; product_slug: string; provider?: string; provider_payment_id?: string | null; provider_status_code?: string | null; status?: string; user_id: string };
        Update: { amount_lkr?: number; created_at?: string; id?: string; listing_id?: number; paid_at?: string | null; product_slug?: string; provider?: string; provider_payment_id?: string | null; provider_status_code?: string | null; status?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "promotions_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
          { foreignKeyName: "promotions_product_slug_fkey"; columns: ["product_slug"]; isOneToOne: false; referencedRelation: "promotion_products"; referencedColumns: ["slug"] },
        ];
      };
      provinces: {
        Row: { id: number; name: string; name_si: string | null; name_ta: string | null; slug: string };
        Insert: { id: number; name: string; name_si?: string | null; name_ta?: string | null; slug: string };
        Update: { id?: number; name?: string; name_si?: string | null; name_ta?: string | null; slug?: string };
        Relationships: [];
      };
      reports: {
        Row: { created_at: string; details: string | null; id: number; listing_id: number; reason: string; reporter_id: string; resolved_at: string | null; resolved_by: string | null; status: string };
        Insert: { created_at?: string; details?: string | null; listing_id: number; reason: string; reporter_id: string; resolved_at?: string | null; resolved_by?: string | null; status?: string };
        Update: { created_at?: string; details?: string | null; listing_id?: number; reason?: string; reporter_id?: string; resolved_at?: string | null; resolved_by?: string | null; status?: string };
        Relationships: [
          { foreignKeyName: "reports_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "listings"; referencedColumns: ["id"] },
        ];
      };
      saved_searches: {
        Row: { alerts: boolean; created_at: string; id: string; label: string; last_checked_at: string; query: string; user_id: string };
        Insert: { alerts?: boolean; created_at?: string; id?: string; label: string; last_checked_at?: string; query: string; user_id: string };
        Update: { alerts?: boolean; created_at?: string; id?: string; label?: string; last_checked_at?: string; query?: string; user_id?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { created_at: string; role: string; user_id: string };
        Insert: { created_at?: string; role: string; user_id: string };
        Update: { created_at?: string; role?: string; user_id?: string };
        Relationships: [];
      };
      vehicle_types: {
        Row: { name: string; name_plural: string; path_slug: string; slug: string; sort: number };
        Insert: { name: string; name_plural: string; path_slug: string; slug: string; sort?: number };
        Update: { name?: string; name_plural?: string; path_slug?: string; slug?: string; sort?: number };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_promotion: { Args: { p_listing_id: number; p_product: string }; Returns: string };
      home_summary: { Args: never; Returns: Json };
      is_staff: { Args: never; Returns: boolean };
      landing_pages: { Args: never; Returns: { ads: number; make_slug: string; model_slug: string | null; vehicle_type: string }[] };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined };
      moderate_listing: { Args: { p_action: string; p_listing_id: number }; Returns: undefined };
      price_spread: { Args: { p_condition: string; p_exclude?: number; p_model_id: number; p_year: number }; Returns: Json };
      record_view: { Args: { p_listing_id: number }; Returns: undefined };
      reveal_contact: { Args: { p_listing_id: number }; Returns: { phone: string; seller_name: string | null; whatsapp: string | null }[] };
      search_facets: { Args: { p: Json }; Returns: Json };
      search_listings: { Args: { p: Json }; Returns: Json };
      search_listings_by_ids: { Args: { p_ids: number[] }; Returns: Json };
      similar_listings: { Args: { p_limit?: number; p_listing_id: number }; Returns: Json };
      start_conversation: { Args: { p_body: string; p_listing_id: number }; Returns: string };
      unread_conversation_count: { Args: never; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type ListingRow = {
  body_type: string | null;
  bumped_at: string;
  city_id: number | null;
  colour: string | null;
  condition: string;
  contact_reveal_count: number;
  cover_photo: string | null;
  cover_thumb: string | null;
  created_at: string;
  description: string;
  district_id: number;
  engine_cc: number | null;
  expires_at: string;
  features: string[];
  fuel: string | null;
  id: number;
  is_demo: boolean;
  leasing_available: boolean;
  make_id: number | null;
  make_other: string | null;
  market_median_lkr: number | null;
  market_peer_count: number | null;
  mileage_km: number | null;
  model_id: number | null;
  model_other: string | null;
  negotiable: boolean;
  photo_count: number;
  previous_owners: number | null;
  price_lkr: number;
  price_rating: string | null;
  promoted_until: string | null;
  published_at: string;
  report_count: number;
  seller_id: string;
  slug: string;
  sold_at: string | null;
  status: string;
  title: string;
  transmission: string | null;
  trim_level: string | null;
  updated_at: string;
  urgent_until: string | null;
  vehicle_type: string;
  view_count: number;
  year_manufactured: number;
  year_registered: number | null;
};

export type ProfileRow = {
  account_type: string;
  city_id: number | null;
  created_at: string;
  dealer_about: string | null;
  dealer_address: string | null;
  dealer_name: string | null;
  dealer_slug: string | null;
  display_name: string | null;
  district_id: number | null;
  id: string;
  updated_at: string;
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type _Rel = Rel;
