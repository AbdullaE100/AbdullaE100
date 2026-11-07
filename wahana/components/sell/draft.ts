import { MAX_YEAR } from "@/lib/constants";
import { normalizeLkPhone } from "@/lib/format";
import type { Make, Model } from "@/lib/types";

export type DraftPhoto = {
  key: string;
  status: "processing" | "uploading" | "done" | "error";
  preview?: string;
  path?: string;
  thumb_path?: string;
  width?: number;
  height?: number;
  /** listing_photos.id for photos that already exist (edit mode) */
  id?: string;
  error?: string;
};

export type Draft = {
  vehicle_type: string | null;
  make_id: number | null;
  make_other: string;
  model_id: number | null;
  model_other: string;
  trim_level: string;
  condition: "used" | "reconditioned" | "brand_new" | null;
  year_manufactured: string;
  year_registered: string;
  mileage_km: string;
  engine_cc: string;
  fuel: string | null;
  transmission: string | null;
  body_type: string | null;
  colour: string | null;
  previous_owners: string;
  features: string[];
  price_lkr: string;
  negotiable: boolean;
  leasing_available: boolean;
  district_id: number | null;
  city_id: number | null;
  description: string;
  phone: string;
  whatsapp: string;
  whatsapp_mode: "same" | "other" | "none";
  seller_name: string;
  photos: DraftPhoto[];
  folder: string;
};

export const emptyDraft = (): Draft => ({
  vehicle_type: null,
  make_id: null,
  make_other: "",
  model_id: null,
  model_other: "",
  trim_level: "",
  condition: null,
  year_manufactured: "",
  year_registered: "",
  mileage_km: "",
  engine_cc: "",
  fuel: null,
  transmission: null,
  body_type: null,
  colour: null,
  previous_owners: "",
  features: [],
  price_lkr: "",
  negotiable: false,
  leasing_available: false,
  district_id: null,
  city_id: null,
  description: "",
  phone: "",
  whatsapp: "",
  whatsapp_mode: "same",
  seller_name: "",
  photos: [],
  folder: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : String(Date.now()),
});

export const STEPS = [
  { id: "vehicle", title: "Vehicle", heading: "What are you selling?" },
  { id: "details", title: "Details", heading: "Tell buyers about it" },
  { id: "photos", title: "Photos", heading: "Add photos" },
  { id: "price", title: "Price", heading: "Price and location" },
  { id: "contact", title: "Contact", heading: "Description and contact" },
  { id: "review", title: "Review", heading: "Check and publish" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
export type Errors = Partial<Record<keyof Draft | "photos_pending", string>>;

export const NO_TRANSMISSION = ["motorbike", "three-wheeler"];
export const digits = (s: string) => s.replace(/\D/g, "");

export function validate(step: StepId, d: Draft): Errors {
  const e: Errors = {};
  if (step === "vehicle") {
    if (!d.vehicle_type) e.vehicle_type = "Choose the type of vehicle.";
    if (!d.make_id && !d.make_other.trim()) e.make_id = "Choose the make, or pick Other and type it.";
    if (!d.model_id && !d.model_other.trim()) e.model_id = "Choose the model, or pick Other and type it.";
    if (!d.condition) e.condition = "Choose the condition.";
    const y = Number(d.year_manufactured);
    if (!y) e.year_manufactured = "Choose the year it was made.";
    else if (y < 1950 || y > MAX_YEAR) e.year_manufactured = `Use a year between 1950 and ${MAX_YEAR}.`;
    if (d.year_registered && y && Number(d.year_registered) < y) e.year_registered = "It can't be registered before it was made.";
  }
  if (step === "details") {
    if (d.condition !== "brand_new") {
      if (!d.mileage_km) e.mileage_km = "Enter the mileage shown on the odometer.";
      else if (Number(d.mileage_km) > 2_000_000) e.mileage_km = "That mileage looks too high.";
    }
    if (d.engine_cc && Number(d.engine_cc) > 30000) e.engine_cc = "Engine capacity is in cc, e.g. 1500.";
    if (!d.fuel) e.fuel = "Choose the fuel type.";
    if (!d.transmission && !NO_TRANSMISSION.includes(d.vehicle_type ?? "")) e.transmission = "Choose the transmission.";
  }
  if (step === "photos") {
    if (d.photos.some((p) => p.status === "processing" || p.status === "uploading")) e.photos_pending = "Wait for your photos to finish uploading.";
    else if (d.photos.some((p) => p.status === "error")) e.photos_pending = "Some photos didn't upload. Retry or remove them to continue.";
  }
  if (step === "price") {
    const p = Number(d.price_lkr);
    if (!p) e.price_lkr = "Enter your asking price.";
    else if (p < 10_000) e.price_lkr = "The price must be at least Rs 10,000.";
    else if (p > 5_000_000_000) e.price_lkr = "That price looks too high.";
    if (!d.district_id) e.district_id = "Choose where the vehicle is.";
  }
  if (step === "contact") {
    if (!normalizeLkPhone(d.phone)) e.phone = "Enter a Sri Lankan mobile or landline, e.g. 077 123 4567.";
    if (d.whatsapp_mode === "other" && !normalizeLkPhone(d.whatsapp)) e.whatsapp = "Enter the WhatsApp number, e.g. 077 123 4567.";
    if (d.description.length > 5000) e.description = "Keep the description under 5,000 characters.";
  }
  return e;
}

export function firstInvalidStep(d: Draft): StepId | null {
  for (const s of STEPS) if (s.id !== "review" && Object.keys(validate(s.id, d)).length) return s.id;
  return null;
}

export function draftTitle(d: Draft, makes: Make[], models: Model[]) {
  const make = makes.find((m) => m.id === d.make_id)?.name ?? d.make_other.trim();
  const model = models.find((m) => m.id === d.model_id)?.name ?? d.model_other.trim();
  return [make, model, d.trim_level.trim(), d.year_manufactured].filter(Boolean).join(" ");
}

/** Shape the draft into a listings row. */
export function toListingRow(d: Draft) {
  const num = (s: string) => (s ? Number(digits(s)) : null);
  return {
    vehicle_type: d.vehicle_type!,
    make_id: d.make_id,
    make_other: d.make_id ? null : d.make_other.trim() || null,
    model_id: d.model_id,
    model_other: d.model_id ? null : d.model_other.trim() || null,
    trim_level: d.trim_level.trim() || null,
    condition: d.condition!,
    year_manufactured: Number(d.year_manufactured),
    year_registered: d.year_registered ? Number(d.year_registered) : null,
    mileage_km: d.condition === "brand_new" ? num(d.mileage_km) ?? 0 : num(d.mileage_km),
    engine_cc: num(d.engine_cc),
    fuel: d.fuel,
    transmission: NO_TRANSMISSION.includes(d.vehicle_type ?? "") ? d.transmission : d.transmission,
    body_type: d.body_type,
    colour: d.colour,
    previous_owners: d.condition === "used" && d.previous_owners !== "" ? Number(d.previous_owners) : null,
    features: d.features,
    price_lkr: Number(digits(d.price_lkr)),
    negotiable: d.negotiable,
    leasing_available: d.leasing_available,
    district_id: d.district_id!,
    city_id: d.city_id,
    description: d.description.trim(),
  };
}
