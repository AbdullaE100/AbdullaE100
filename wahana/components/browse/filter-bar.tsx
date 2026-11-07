"use client";
import { useEffect, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { useSearch } from "./search-context";
import { MobileFilters, SaveSearchButton, SortSelect } from "./toolbar";
import type { Facets } from "@/lib/types";
import type { Names } from "@/lib/search";
import { useCatalog, useCities } from "@/lib/catalog";
import { MAX_YEAR, PRICE_STEPS, VEHICLE_TYPES } from "@/lib/constants";
import { formatLKRCompact, formatNumber } from "@/lib/format";
import { Popover } from "@/components/ui/popover";
import { Combobox } from "@/components/ui/combobox";
import { Label, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/choice";
import { cn } from "@/lib/cn";

const YEARS = Array.from({ length: MAX_YEAR - 1979 }, (_, i) => MAX_YEAR - i);
const titleCase = (slug?: string) => (slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

function KeywordBox({ className }: { className?: string }) {
  const { filters: f, apply } = useSearch();
  const [q, setQ] = useState(f.q ?? "");
  useEffect(() => setQ(f.q ?? ""), [f.q]);
  return (
    <form
      role="search"
      className={cn("relative min-w-0", className)}
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q: q.trim() || undefined });
      }}
    >
      <label htmlFor="bar-q" className="sr-only">
        Search within results
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-subtle" />
      <input
        id="bar-q"
        type="search"
        enterKeyHint="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Make, model or keyword"
        className="h-11 w-full rounded-lg border border-border bg-surface pl-11 pr-3 text-[15px] placeholder:text-fg-subtle hover:border-border-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-[var(--ring)] [&::-webkit-search-cancel-button]:hidden"
      />
    </form>
  );
}

function OptionList({ options, value, onPick }: { options: { value: string; label: string; count?: number }[]; value?: string; onPick: (v: string | undefined) => void }) {
  return (
    <ul className="-mx-2 max-h-80 overflow-y-auto">
      {options.map((o) => {
        const on = o.value === (value ?? "");
        return (
          <li key={o.value || "any"}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onPick(o.value || undefined)}
              className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[15px] hover:bg-surface-2", on && "font-bold text-brand-text")}
            >
              <span className="flex-1">{o.label}</span>
              {o.count != null && <span className="tabular text-sm text-fg-subtle">{formatNumber(o.count)}</span>}
              <Check className={cn("size-4", on ? "opacity-100" : "opacity-0")} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function FilterBar({ facets, names, total, hideType, hideSeller, saveLabel }: { facets: Facets | null; names: Names; total: number; hideType?: boolean; hideSeller?: boolean; saveLabel: string }) {
  const { filters: f, apply } = useSearch();
  const ref = useCatalog();
  const district = ref?.districts.find((d) => d.slug === f.district);
  const cities = useCities(district?.id);

  const typeLabel = VEHICLE_TYPES.find((t) => t.slug === f.type)?.short ?? "All types";
  const makeLabel = f.make ? [names.make ?? titleCase(f.make), f.model ? names.model ?? titleCase(f.model) : ""].filter(Boolean).join(" ") : "Make & model";
  const pmin = Number(f.price_min || 0);
  const pmax = Number(f.price_max || 0);
  const priceLabel = pmin && pmax ? `${formatLKRCompact(pmin)} – ${formatLKRCompact(pmax)}` : pmin ? `From ${formatLKRCompact(pmin)}` : pmax ? `Up to ${formatLKRCompact(pmax)}` : "Price";
  const yearLabel = f.year_min && f.year_max ? `${f.year_min} – ${f.year_max}` : f.year_min ? `${f.year_min}+` : f.year_max ? `Up to ${f.year_max}` : "Year";
  const locLabel = f.city ? names.city ?? titleCase(f.city) : f.district ? names.district ?? titleCase(f.district) : "Location";
  const advanced = ["condition", "fuel", "transmission", "body", "mileage_max", "photos", "leasing", "seller_type", "deal"].filter((k) => f[k as keyof typeof f]).length;

  const makeOptions = (facets?.make ?? []).map((m) => ({ value: m.slug, label: m.name, count: m.count }));
  if (f.make && !makeOptions.some((o) => o.value === f.make)) makeOptions.unshift({ value: f.make, label: names.make ?? titleCase(f.make), count: 0 });
  const modelOptions = (facets?.model ?? []).map((m) => ({ value: m.slug, label: m.name, count: m.count }));
  const districtCounts = new Map((facets?.district ?? []).map((d) => [d.slug, d.count]));

  return (
    <div className="flex items-center gap-2">
      <KeywordBox className="flex-1 lg:max-w-xs" />

      <div className="hidden items-center gap-2 lg:flex">
        {!hideType && (
          <Popover label={typeLabel} active={!!f.type} panelClassName="w-64">
            {(close) => (
              <OptionList
                value={f.type}
                onPick={(v) => {
                  apply({ type: v });
                  close();
                }}
                options={[
                  { value: "", label: "All types" },
                  ...VEHICLE_TYPES.filter((t) => facets?.type?.[t.slug] || f.type === t.slug).map((t) => ({ value: t.slug, label: t.plural, count: facets?.type?.[t.slug] ?? 0 })),
                ]}
              />
            )}
          </Popover>
        )}
        <Popover label={makeLabel} active={!!f.make}>
          <div className="space-y-3">
            <div>
              <Label htmlFor="bar-make">Make</Label>
              <Combobox id="bar-make" options={makeOptions} value={f.make} onChange={(v) => apply({ make: v ?? undefined })} placeholder="Any make" />
            </div>
            <div>
              <Label htmlFor="bar-model">Model</Label>
              <Combobox id="bar-model" options={modelOptions} value={f.model} onChange={(v) => apply({ model: v ?? undefined })} placeholder={f.make ? "Any model" : "Pick a make first"} disabled={!f.make} />
            </div>
          </div>
        </Popover>
        <Popover label={priceLabel} active={!!(pmin || pmax || f.deal)}>
          <p className="mb-2 text-sm font-bold">Price (Rs)</p>
          <div className="grid grid-cols-2 gap-2">
            <Select aria-label="Minimum price" value={f.price_min ?? ""} onChange={(e) => apply({ price_min: e.target.value || undefined })}>
              <option value="">No min</option>
              {PRICE_STEPS.filter((p) => !pmax || p < pmax).map((p) => (
                <option key={p} value={p}>
                  {formatLKRCompact(p)}
                </option>
              ))}
            </Select>
            <Select aria-label="Maximum price" value={f.price_max ?? ""} onChange={(e) => apply({ price_max: e.target.value || undefined })}>
              <option value="">No max</option>
              {PRICE_STEPS.filter((p) => p > pmin).map((p) => (
                <option key={p} value={p}>
                  {formatLKRCompact(p)}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <Switch checked={f.deal === "good"} onChange={(on) => apply({ deal: on ? "good" : undefined })} label="Good price only" hint="At least 5% under similar ads" />
          </div>
        </Popover>
        <Popover label={yearLabel} active={!!(f.year_min || f.year_max)} panelClassName="w-72">
          <p className="mb-2 text-sm font-bold">Year made</p>
          <div className="grid grid-cols-2 gap-2">
            <Select aria-label="Oldest year" value={f.year_min ?? ""} onChange={(e) => apply({ year_min: e.target.value || undefined })}>
              <option value="">From any</option>
              {YEARS.filter((y) => !f.year_max || y <= Number(f.year_max)).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </Select>
            <Select aria-label="Newest year" value={f.year_max ?? ""} onChange={(e) => apply({ year_max: e.target.value || undefined })}>
              <option value="">To any</option>
              {YEARS.filter((y) => !f.year_min || y >= Number(f.year_min)).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </Select>
          </div>
        </Popover>
        <Popover label={locLabel} active={!!f.district} align="right">
          <div className="space-y-3">
            <div>
              <Label htmlFor="bar-district">District</Label>
              <Combobox
                id="bar-district"
                leading={<MapPin className="size-4" />}
                options={(ref?.districts ?? []).map((d) => ({ value: d.slug, label: d.name, keywords: `${d.name_si ?? ""} ${d.name_ta ?? ""}`, count: districtCounts.get(d.slug) ?? 0 }))}
                value={f.district}
                onChange={(v) => apply({ district: v ?? undefined })}
                placeholder="All districts"
              />
            </div>
            {f.district && (
              <div>
                <Label htmlFor="bar-city">Town</Label>
                <Combobox id="bar-city" options={cities.map((c) => ({ value: c.slug, label: c.name }))} value={f.city} onChange={(v) => apply({ city: v ?? undefined })} placeholder="Any town" />
              </div>
            )}
          </div>
        </Popover>
        <MobileFilters facets={facets} names={names} total={total} hideType={hideType} hideSeller={hideSeller} label={advanced ? `More filters (${advanced})` : "More filters"} showCount={false} />
      </div>

      <MobileFilters facets={facets} names={names} total={total} hideType={hideType} hideSeller={hideSeller} className="lg:hidden" />
      <div className="hidden sm:block lg:hidden">
        <SortSelect />
      </div>
      <SaveSearchButton label={saveLabel} compact />
    </div>
  );
}
