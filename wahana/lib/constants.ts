// Mirrors the check constraints and reference rows in the database so that
// client components can render labels without a round trip.

export type VehicleTypeSlug =
  | "car"
  | "suv"
  | "van"
  | "pickup"
  | "motorbike"
  | "three-wheeler"
  | "lorry"
  | "bus"
  | "heavy-duty";

export const VEHICLE_TYPES: { slug: VehicleTypeSlug; name: string; plural: string; path: string; short: string }[] = [
  { slug: "car", name: "Car", plural: "Cars", path: "cars", short: "Cars" },
  { slug: "suv", name: "SUV or jeep", plural: "SUVs and jeeps", path: "suvs", short: "SUVs" },
  { slug: "van", name: "Van", plural: "Vans", path: "vans", short: "Vans" },
  { slug: "pickup", name: "Pickup or double cab", plural: "Pickups and double cabs", path: "pickups", short: "Pickups" },
  { slug: "motorbike", name: "Motorbike", plural: "Motorbikes", path: "motorbikes", short: "Bikes" },
  { slug: "three-wheeler", name: "Three-wheeler", plural: "Three-wheelers", path: "three-wheelers", short: "Three-wheelers" },
  { slug: "lorry", name: "Lorry or truck", plural: "Lorries and trucks", path: "lorries", short: "Lorries" },
  { slug: "bus", name: "Bus", plural: "Buses", path: "buses", short: "Buses" },
  { slug: "heavy-duty", name: "Heavy-duty or tractor", plural: "Heavy-duty and tractors", path: "heavy-duty", short: "Heavy-duty" },
];

export const ALL_PATH = "vehicles";

export const typeBySlug = (slug?: string | null) => VEHICLE_TYPES.find((t) => t.slug === slug);
export const typeByPath = (path?: string | null) => VEHICLE_TYPES.find((t) => t.path === path);

export const CONDITIONS = [
  { value: "used", label: "Used", hint: "Registered and driven in Sri Lanka" },
  { value: "reconditioned", label: "Reconditioned", hint: "Imported, not yet registered here" },
  { value: "brand_new", label: "Brand new", hint: "Zero mileage, from an agent or dealer" },
] as const;

export const FUELS = [
  { value: "petrol", label: "Petrol" },
  { value: "hybrid", label: "Hybrid" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "plugin_hybrid", label: "Plug-in hybrid" },
  { value: "gas", label: "Gas" },
  { value: "other", label: "Other" },
] as const;

export const TRANSMISSIONS = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
  { value: "tiptronic", label: "Tiptronic" },
  { value: "other", label: "Other" },
] as const;

export const BODY_TYPES: Record<string, { value: string; label: string }[]> = {
  car: [
    { value: "hatchback", label: "Hatchback" },
    { value: "saloon", label: "Saloon" },
    { value: "station-wagon", label: "Station wagon" },
    { value: "mpv", label: "MPV" },
  ],
  suv: [{ value: "suv", label: "SUV" }],
  van: [
    { value: "van", label: "Van" },
    { value: "mpv", label: "MPV" },
  ],
  pickup: [
    { value: "double-cab", label: "Double cab" },
    { value: "single-cab", label: "Single cab" },
  ],
  motorbike: [
    { value: "motorbike", label: "Motorbike" },
    { value: "scooter", label: "Scooter" },
    { value: "moped", label: "Moped" },
  ],
  "three-wheeler": [
    { value: "passenger", label: "Passenger" },
    { value: "cargo", label: "Cargo" },
  ],
  lorry: [
    { value: "lorry", label: "Lorry" },
    { value: "cargo", label: "Cargo" },
  ],
  bus: [{ value: "bus", label: "Bus" }],
  "heavy-duty": [
    { value: "tractor", label: "Tractor" },
    { value: "backhoe", label: "Backhoe" },
    { value: "excavator", label: "Excavator" },
  ],
};

export const ALL_BODY_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(BODY_TYPES).flat().map((b) => [b.value, b.label]),
);

export const FEATURES = [
  "Air conditioning",
  "Power steering",
  "Power windows",
  "Power mirrors",
  "ABS",
  "Airbags",
  "Reverse camera",
  "Parking sensors",
  "Android screen",
  "Multi-function steering",
  "Keyless entry",
  "Push start",
  "Cruise control",
  "Alloy wheels",
  "Sunroof",
  "Leather seats",
  "Climate control",
  "Fog lights",
] as const;

export const COLOURS = [
  { name: "White", hex: "#F4F4F2" },
  { name: "Pearl White", hex: "#EEEBE3" },
  { name: "Silver", hex: "#C3C7CC" },
  { name: "Grey", hex: "#7C828A" },
  { name: "Black", hex: "#1C1E21" },
  { name: "Blue", hex: "#2F5DAA" },
  { name: "Red", hex: "#C8312B" },
  { name: "Wine Red", hex: "#7A1F2B" },
  { name: "Maroon", hex: "#5E1A24" },
  { name: "Green", hex: "#2F6B45" },
  { name: "Brown", hex: "#6B4A33" },
  { name: "Beige", hex: "#D8C7A6" },
  { name: "Yellow", hex: "#E7C23A" },
  { name: "Orange", hex: "#E07A2E" },
  { name: "Gold", hex: "#BFA05A" },
] as const;

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "year_desc", label: "Newest year" },
  { value: "mileage_asc", label: "Lowest mileage" },
] as const;

export const REPORT_REASONS = [
  { value: "scam", label: "Looks like a scam" },
  { value: "sold", label: "Vehicle is already sold" },
  { value: "wrong_details", label: "Wrong price or details" },
  { value: "duplicate", label: "Duplicate ad" },
  { value: "offensive", label: "Offensive content" },
  { value: "other", label: "Something else" },
] as const;

export const label = <T extends readonly { value: string; label: string }[]>(list: T, v?: string | null) =>
  list.find((x) => x.value === v)?.label ?? (v ? v.replace(/_/g, " ") : "");

// Price presets used by filters (LKR).
export const PRICE_STEPS = [
  250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000,
  6_000_000, 7_500_000, 10_000_000, 12_500_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000, 40_000_000,
  50_000_000, 75_000_000, 100_000_000,
];

export const MILEAGE_STEPS = [10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000];

export const MIN_YEAR = 1970;
export const MAX_YEAR = new Date().getFullYear() + 1;
