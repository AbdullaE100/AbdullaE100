"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { VEHICLE_TYPES, PRICE_STEPS } from "@/lib/constants";
import { filtersToHref, type Filters } from "@/lib/search";
import { formatLKRCompact, formatNumber } from "@/lib/format";
import { Combobox } from "@/components/ui/combobox";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { VehicleArt } from "@/components/vehicle-art";
import { cn } from "@/lib/cn";

const TABS = ["car", "suv", "van", "motorbike", "three-wheeler", "lorry"] as const;

export function HeroSearch({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const ref = useCatalog();
  const [type, setType] = useState<string>("car");
  const [make, setMake] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [district, setDistrict] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const makeOptions = useMemo(() => {
    if (!ref) return [];
    return ref.makes
      .filter((m) => m.vehicle_types.includes(type))
      .map((m) => ({ value: m.slug, label: m.name, group: m.is_popular ? "Popular" : "All makes" }))
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1));
  }, [ref, type]);

  const modelOptions = useMemo(() => {
    if (!ref || !make) return [];
    const mk = ref.makes.find((m) => m.slug === make);
    return ref.models.filter((m) => m.make_id === mk?.id && m.vehicle_type === type).map((m) => ({ value: m.slug, label: m.name }));
  }, [ref, make, type]);

  const submit = () => {
    setBusy(true);
    const f: Filters = { type };
    if (make) f.make = make;
    if (make && model) f.model = model;
    if (district) f.district = district;
    if (priceMax) f.price_max = priceMax;
    router.push(filtersToHref(f));
  };

  return (
    <div className="rounded-3xl border border-border bg-surface p-3 shadow-lg sm:p-4">
      <div role="tablist" aria-label="Vehicle type" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-3">
        {TABS.map((slug) => {
          const t = VEHICLE_TYPES.find((v) => v.slug === slug)!;
          const on = type === slug;
          return (
            <button
              key={slug}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setType(slug);
                setMake(null);
                setModel(null);
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                on ? "bg-brand-soft text-brand-soft-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <VehicleArt type={slug} className={cn("h-4 w-8", on ? "[--art-bg:var(--brand-soft)]" : "[--art-bg:var(--surface)]")} />
              {t.short}
              {counts[slug] ? <span className="tabular text-xs font-medium opacity-70">{formatNumber(counts[slug])}</span> : null}
            </button>
          );
        })}
      </div>
      <form
        className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_1fr_0.9fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <label className="sr-only" htmlFor="hero-make">
            Make
          </label>
          <Combobox id="hero-make" options={makeOptions} value={make} onChange={(v) => { setMake(v); setModel(null); }} placeholder="Any make" />
        </div>
        <div>
          <label className="sr-only" htmlFor="hero-model">
            Model
          </label>
          <Combobox id="hero-model" options={modelOptions} value={model} onChange={setModel} placeholder={make ? "Any model" : "Pick a make first"} disabled={!make} />
        </div>
        <div>
          <label className="sr-only" htmlFor="hero-district">
            District
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-fg-subtle" />
            <Select id="hero-district" value={district} onChange={(e) => setDistrict(e.target.value)} className="pl-10">
              <option value="">All of Sri Lanka</option>
              {ref?.districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="sr-only" htmlFor="hero-price">
            Maximum price
          </label>
          <Select id="hero-price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
            <option value="">Any price</option>
            {PRICE_STEPS.filter((p) => p >= 500_000).map((p) => (
              <option key={p} value={p}>
                Up to {formatLKRCompact(p)}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" size="lg" loading={busy} className="h-12 sm:col-span-2 lg:col-span-1 lg:px-6">
          {!busy && <Search className="size-[18px]" strokeWidth={2.5} />} Search
        </Button>
      </form>
    </div>
  );
}
