// URL <-> filter model for browse pages.
// Path carries the hierarchy that people search by (type, make, model) so the
// pages are linkable and indexable: /cars/toyota/aqua?district=colombo
import { ALL_PATH, CONDITIONS, FUELS, TRANSMISSIONS, ALL_BODY_LABELS, typeByPath, typeBySlug, label, SORTS } from "./constants";
import { formatLKRCompact, formatKmShort } from "./format";

export type Filters = {
  type?: string;
  make?: string;
  model?: string;
  district?: string;
  city?: string;
  condition?: string;
  fuel?: string;
  transmission?: string;
  body?: string;
  price_min?: string;
  price_max?: string;
  year_min?: string;
  year_max?: string;
  mileage_max?: string;
  deal?: string;
  photos?: string;
  leasing?: string;
  seller_type?: string;
  q?: string;
  sort?: string;
  page?: string;
};

export const QUERY_KEYS = [
  "district",
  "city",
  "condition",
  "fuel",
  "transmission",
  "body",
  "price_min",
  "price_max",
  "year_min",
  "year_max",
  "mileage_max",
  "deal",
  "photos",
  "leasing",
  "seller_type",
  "q",
  "sort",
  "page",
] as const satisfies readonly (keyof Filters)[];

const SLUG = /^[a-z0-9-]{1,60}$/;

const VALIDATORS: Partial<Record<keyof Filters, (v: string) => boolean>> = {
  district: (v) => SLUG.test(v),
  city: (v) => SLUG.test(v),
  condition: (v) => CONDITIONS.some((c) => c.value === v),
  fuel: (v) => FUELS.some((c) => c.value === v),
  transmission: (v) => TRANSMISSIONS.some((c) => c.value === v),
  body: (v) => SLUG.test(v),
  price_min: (v) => /^\d{1,10}$/.test(v),
  price_max: (v) => /^\d{1,10}$/.test(v),
  year_min: (v) => /^\d{4}$/.test(v),
  year_max: (v) => /^\d{4}$/.test(v),
  mileage_max: (v) => /^\d{1,7}$/.test(v),
  deal: (v) => v === "good",
  photos: (v) => v === "true",
  leasing: (v) => v === "true",
  seller_type: (v) => v === "private" || v === "dealer",
  q: (v) => v.trim().length > 0 && v.length <= 80,
  sort: (v) => SORTS.some((s) => s.value === v),
  page: (v) => /^\d{1,3}$/.test(v) && Number(v) > 1 && Number(v) <= 200,
};

type SP = Record<string, string | string[] | undefined> | URLSearchParams;

function getParam(sp: SP, key: string): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

/** Returns null when the path isn't a valid browse path. */
export function parseFilters(typePath: string, rest: string[] = [], sp: SP = {}): Filters | null {
  const f: Filters = {};
  if (typePath !== ALL_PATH) {
    const t = typeByPath(typePath);
    if (!t) return null;
    f.type = t.slug;
  }
  if (rest.length > 2) return null;
  const [make, model] = rest;
  if (make) {
    if (!SLUG.test(make)) return null;
    f.make = make;
  }
  if (model) {
    if (!SLUG.test(model)) return null;
    f.model = model;
  }
  for (const key of QUERY_KEYS) {
    const v = getParam(sp, key);
    if (v != null && v !== "" && VALIDATORS[key]?.(v)) f[key] = v.trim();
  }
  return f;
}

export function filtersToHref(f: Filters): string {
  const typePath = typeBySlug(f.type)?.path ?? ALL_PATH;
  let path = `/${typePath}`;
  if (f.make) {
    path += `/${f.make}`;
    if (f.model) path += `/${f.model}`;
  }
  const qs = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const v = f[key];
    if (v) qs.set(key, v);
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Apply a change and reset pagination (and dependent fields). */
export function withFilter(f: Filters, patch: Partial<Filters>): Filters {
  const next: Filters = { ...f, ...patch };
  if ("type" in patch && patch.type !== f.type) {
    delete next.make;
    delete next.model;
    delete next.body;
  }
  if ("make" in patch && patch.make !== f.make) delete next.model;
  if ("district" in patch && patch.district !== f.district) delete next.city;
  if (!("page" in patch)) delete next.page;
  for (const k of Object.keys(next) as (keyof Filters)[]) if (!next[k]) delete next[k];
  return next;
}

export function filtersToRpc(f: Filters, extra: Record<string, unknown> = {}) {
  const p: Record<string, unknown> = { ...f, ...extra };
  if (f.page) p.page = Number(f.page);
  return p;
}

export type Names = {
  make?: string;
  model?: string;
  district?: string;
  city?: string;
};

export type Chip = { key: keyof Filters; label: string; clear: Partial<Filters> };

export function activeChips(f: Filters, names: Names): Chip[] {
  const chips: Chip[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, clear: { q: undefined } });
  if (f.make) chips.push({ key: "make", label: names.make ?? f.make, clear: { make: undefined, model: undefined } });
  if (f.model) chips.push({ key: "model", label: names.model ?? f.model, clear: { model: undefined } });
  if (f.district) chips.push({ key: "district", label: names.district ?? f.district, clear: { district: undefined, city: undefined } });
  if (f.city) chips.push({ key: "city", label: names.city ?? f.city, clear: { city: undefined } });
  if (f.condition) chips.push({ key: "condition", label: label(CONDITIONS, f.condition), clear: { condition: undefined } });
  if (f.price_min || f.price_max) {
    const lo = f.price_min ? formatLKRCompact(Number(f.price_min)) : null;
    const hi = f.price_max ? formatLKRCompact(Number(f.price_max)) : null;
    chips.push({
      key: "price_min",
      label: lo && hi ? `${lo} – ${hi}` : lo ? `From ${lo}` : `Up to ${hi}`,
      clear: { price_min: undefined, price_max: undefined },
    });
  }
  if (f.year_min || f.year_max) {
    chips.push({
      key: "year_min",
      label: f.year_min && f.year_max ? `${f.year_min} – ${f.year_max}` : f.year_min ? `${f.year_min} or newer` : `${f.year_max} or older`,
      clear: { year_min: undefined, year_max: undefined },
    });
  }
  if (f.mileage_max) chips.push({ key: "mileage_max", label: `Under ${formatKmShort(Number(f.mileage_max))}`, clear: { mileage_max: undefined } });
  if (f.fuel) chips.push({ key: "fuel", label: label(FUELS, f.fuel), clear: { fuel: undefined } });
  if (f.transmission) chips.push({ key: "transmission", label: label(TRANSMISSIONS, f.transmission), clear: { transmission: undefined } });
  if (f.body) chips.push({ key: "body", label: ALL_BODY_LABELS[f.body] ?? f.body, clear: { body: undefined } });
  if (f.deal) chips.push({ key: "deal", label: "Good price", clear: { deal: undefined } });
  if (f.photos) chips.push({ key: "photos", label: "With photos", clear: { photos: undefined } });
  if (f.leasing) chips.push({ key: "leasing", label: "Leasing available", clear: { leasing: undefined } });
  if (f.seller_type) chips.push({ key: "seller_type", label: f.seller_type === "dealer" ? "Dealers" : "Private sellers", clear: { seller_type: undefined } });
  return chips;
}

/** Human heading, e.g. "Toyota Aqua for sale in Colombo". */
export function describeSearch(f: Filters, names: Names) {
  const t = typeBySlug(f.type);
  const subject = [names.make, names.model].filter(Boolean).join(" ") || (f.q && !t ? `“${f.q}”` : t?.plural) || "Vehicles";
  const where = names.city ?? names.district;
  const cond = f.condition === "brand_new" ? "Brand new " : f.condition === "reconditioned" ? "Reconditioned " : "";
  const s = `${cond}${cond ? subject.replace(/^./, (c) => c.toLowerCase()) : subject}`;
  return { title: `${s} for sale${where ? ` in ${where}` : " in Sri Lanka"}`, subject, where };
}

export function countActive(f: Filters) {
  return QUERY_KEYS.filter((k) => k !== "sort" && k !== "page" && k !== "q" && f[k]).length + (f.make ? 1 : 0);
}
