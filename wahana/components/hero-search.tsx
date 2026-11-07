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
    <div className="mx-auto w-full max-w-5xl text-left">
      <div role="tablist" aria-label="Vehicle type" className="no-scrollbar mb-3 flex justify-start gap-2 overflow-x-auto sm:justify-center">
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
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-[15px] font-bold transition-colors",
                on ? "bg-surface text-brand-text shadow-sm" : "bg-black/35 text-white backdrop-blur-sm hover:bg-black/50",
              )}
            >
              {t.short}
              {counts[slug] ? <span className={cn("tabular text-xs font-bold", on ? "text-fg-muted" : "text-white")}>{formatNumber(counts[slug])}</span> : null}
            </button>
          );
        })}
      </div>
      <form
        className="grid gap-2 rounded-2xl bg-surface p-2.5 shadow-lg sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] lg:gap-0 lg:divide-x lg:divide-border lg:p-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="lg:px-1">
          <label className="mb-0.5 hidden px-3 pt-1 text-xs font-bold uppercase tracking-wide text-fg-subtle lg:block" htmlFor="hero-make">
            Make
          </label>
          <label className="sr-only lg:hidden" htmlFor="hero-make">
            Make
          </label>
          <Combobox id="hero-make" options={makeOptions} value={make} onChange={(v) => { setMake(v); setModel(null); }} placeholder="Any make" className="lg:[&_input]:h-11 lg:[&_input]:border-0 lg:[&_input]:shadow-none" />
        </div>
        <div className="lg:px-1">
          <label className="mb-0.5 hidden px-3 pt-1 text-xs font-bold uppercase tracking-wide text-fg-subtle lg:block" htmlFor="hero-model">
            Model
          </label>
          <label className="sr-only lg:hidden" htmlFor="hero-model">
            Model
          </label>
          <Combobox id="hero-model" options={modelOptions} value={model} onChange={setModel} placeholder={make ? "Any model" : "Pick a make first"} disabled={!make} className="lg:[&_input]:h-11 lg:[&_input]:border-0 lg:[&_input]:shadow-none" />
        </div>
        <div className="lg:px-1">
          <label className="mb-0.5 hidden px-3 pt-1 text-xs font-bold uppercase tracking-wide text-fg-subtle lg:block" htmlFor="hero-district">
            Location
          </label>
          <label className="sr-only lg:hidden" htmlFor="hero-district">
            District
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-fg-subtle" />
            <Select id="hero-district" value={district} onChange={(e) => setDistrict(e.target.value)} className="pl-10 lg:h-11 lg:border-0 lg:shadow-none">
              <option value="">All of Sri Lanka</option>
              {ref?.districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="lg:px-1">
          <label className="mb-0.5 hidden px-3 pt-1 text-xs font-bold uppercase tracking-wide text-fg-subtle lg:block" htmlFor="hero-price">
            Max price
          </label>
          <label className="sr-only lg:hidden" htmlFor="hero-price">
            Maximum price
          </label>
          <Select id="hero-price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="lg:h-11 lg:border-0 lg:shadow-none">
            <option value="">Any price</option>
            {PRICE_STEPS.filter((p) => p >= 500_000).map((p) => (
              <option key={p} value={p}>
                Up to {formatLKRCompact(p)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-stretch sm:col-span-2 lg:col-span-1 lg:border-l-0 lg:pl-2">
          <Button type="submit" size="lg" loading={busy} className="h-12 w-full lg:h-full lg:min-h-14 lg:px-8">
            {!busy && <Search className="size-[18px]" strokeWidth={2.5} />} Find
          </Button>
        </div>
      </form>
    </div>
  );
}
