import "server-only";
import { createPublicClient } from "@/lib/supabase/server";
import type { City, District, Make, Model, PromotionProduct, RefData } from "@/lib/types";

// Reference tables change rarely; keep them in process memory for 10 minutes.
const TTL = 10 * 60 * 1000;
const memo = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as Promise<T>;
  const value = load().catch((e) => {
    memo.delete(key);
    throw e;
  });
  memo.set(key, { at: Date.now(), value });
  return value;
}

export function getRef(): Promise<RefData> {
  return cached("ref", async () => {
    const db = createPublicClient();
    const [makes, models, districts] = await Promise.all([
      db.from("makes").select("id, slug, name, vehicle_types, is_popular, sort").order("sort").order("name"),
      db.from("models").select("id, make_id, slug, name, vehicle_type, body_type, is_popular, sort").order("sort").order("name"),
      db.from("districts").select("id, slug, name, name_si, name_ta, province_id").order("name"),
    ]);
    if (makes.error || models.error || districts.error) throw makes.error || models.error || districts.error;
    return {
      makes: makes.data as Make[],
      models: models.data as Model[],
      districts: districts.data as District[],
    };
  });
}

export function getCities(districtId: number): Promise<City[]> {
  return cached(`cities:${districtId}`, async () => {
    const { data, error } = await createPublicClient()
      .from("cities")
      .select("id, district_id, slug, name, name_si, name_ta, is_major")
      .eq("district_id", districtId)
      .order("is_major", { ascending: false })
      .order("name");
    if (error) throw error;
    return data as City[];
  });
}

export function getPromotionProducts(): Promise<PromotionProduct[]> {
  return cached("promos", async () => {
    const { data, error } = await createPublicClient()
      .from("promotion_products")
      .select("slug, name, description, price_lkr, days, kind, sort")
      .order("sort");
    if (error) throw error;
    return data as PromotionProduct[];
  });
}

export async function resolveNames(f: { make?: string; model?: string; district?: string; city?: string; type?: string }) {
  const ref = await getRef();
  const make = f.make ? ref.makes.find((m) => m.slug === f.make) : undefined;
  const model =
    f.model && make
      ? ref.models.find((m) => m.slug === f.model && m.make_id === make.id && (!f.type || m.vehicle_type === f.type)) ??
        ref.models.find((m) => m.slug === f.model && m.make_id === make.id)
      : undefined;
  const district = f.district ? ref.districts.find((d) => d.slug === f.district) : undefined;
  let city: City | undefined;
  if (f.city && district) city = (await getCities(district.id)).find((c) => c.slug === f.city);
  return { make, model, district, city };
}
