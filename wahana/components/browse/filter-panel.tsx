"use client";
import { useEffect, useId, useState, type ReactNode } from "react";
import { MapPin, Search } from "lucide-react";
import { useSearch } from "./search-context";
import type { Facets } from "@/lib/types";
import type { Names } from "@/lib/search";
import { useCatalog, useCities } from "@/lib/catalog";
import { BODY_TYPES, CONDITIONS, FUELS, MAX_YEAR, MILEAGE_STEPS, PRICE_STEPS, TRANSMISSIONS, VEHICLE_TYPES } from "@/lib/constants";
import { formatLKRCompact, formatNumber } from "@/lib/format";
import { Combobox } from "@/components/ui/combobox";
import { ChoiceChips, Switch } from "@/components/ui/choice";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section role="group" aria-labelledby={id} className={cn("border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0", className)}>
      <h3 id={id} className="mb-3 font-sans text-sm font-semibold tracking-normal">
        {title}
      </h3>
      {children}
    </section>
  );
}

const YEARS = Array.from({ length: MAX_YEAR - 1979 }, (_, i) => MAX_YEAR - i);

export function FilterPanel({ facets, names, hideType, hideSeller }: { facets: Facets | null; names: Names; hideType?: boolean; hideSeller?: boolean }) {
  const { filters: f, apply } = useSearch();
  const ref = useCatalog();
  const district = ref?.districts.find((d) => d.slug === f.district);
  const cities = useCities(district?.id);
  const [q, setQ] = useState(f.q ?? "");
  useEffect(() => setQ(f.q ?? ""), [f.q]);

  const typeCounts = facets?.type ?? {};
  const makeOptions = (facets?.make ?? []).map((m) => ({ value: m.slug, label: m.name, count: m.count }));
  if (f.make && !makeOptions.some((o) => o.value === f.make)) makeOptions.unshift({ value: f.make, label: names.make ?? f.make, count: 0 });
  const modelOptions = (facets?.model ?? []).map((m) => ({ value: m.slug, label: m.name, count: m.count }));
  if (f.model && !modelOptions.some((o) => o.value === f.model)) modelOptions.unshift({ value: f.model, label: names.model ?? f.model, count: 0 });

  const districtCounts = new Map((facets?.district ?? []).map((d) => [d.slug, d.count]));
  const districtOptions = (ref?.districts ?? []).map((d) => ({
    value: d.slug,
    label: d.name,
    keywords: `${d.name_si ?? ""} ${d.name_ta ?? ""}`,
    count: districtCounts.get(d.slug) ?? 0,
  }));
  if (!ref && f.district) districtOptions.push({ value: f.district, label: names.district ?? f.district, keywords: "", count: 0 });
  const cityOptions = cities.map((c) => ({ value: c.slug, label: c.name, keywords: `${c.name_si ?? ""} ${c.name_ta ?? ""}` }));
  if (f.city && !cityOptions.some((c) => c.value === f.city)) cityOptions.unshift({ value: f.city, label: names.city ?? f.city, keywords: "" });

  const bodies = f.type ? BODY_TYPES[f.type] ?? [] : [];
  const pmin = Number(f.price_min || 0);
  const pmax = Number(f.price_max || 0);

  return (
    <div className="text-[15px]">
      <Section title="Keywords">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: q.trim() || undefined });
          }}
        >
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => q.trim() !== (f.q ?? "") && apply({ q: q.trim() || undefined })}
            placeholder="e.g. sunroof, 7 seater"
            leading={<Search className="size-4" />}
            enterKeyHint="search"
            aria-label="Keywords"
          />
        </form>
      </Section>

      {!hideType && (
        <Section title="Vehicle type">
          <ChoiceChips
            name="type"
            size="sm"
            value={f.type ?? null}
            onChange={(v) => apply({ type: (v as string) || undefined })}
            options={VEHICLE_TYPES.filter((t) => typeCounts[t.slug] || f.type === t.slug).map((t) => ({ value: t.slug, label: t.short, count: typeCounts[t.slug] ?? 0 }))}
          />
        </Section>
      )}

      <Section title="Make and model">
        <div className="space-y-2.5">
          <Combobox options={makeOptions} value={f.make} onChange={(v) => apply({ make: v ?? undefined })} placeholder="Any make" ariaLabel="Make" />
          <Combobox
            options={modelOptions}
            value={f.model}
            onChange={(v) => apply({ model: v ?? undefined })}
            placeholder={f.make ? "Any model" : "Pick a make first"}
            ariaLabel="Model"
            disabled={!f.make}
          />
        </div>
      </Section>

      <Section title="Price">
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
        <div className="mt-3">
          <Switch checked={f.deal === "good"} onChange={(on) => apply({ deal: on ? "good" : undefined })} label="Good price only" hint="At least 5% under similar ads" />
        </div>
      </Section>

      <Section title="Location">
        <div className="space-y-2.5">
          <Combobox
            options={districtOptions}
            value={f.district}
            onChange={(v) => apply({ district: v ?? undefined })}
            placeholder="All districts"
            ariaLabel="District"
            leading={<MapPin className="size-4" />}
          />
          {f.district && <Combobox options={cityOptions} value={f.city} onChange={(v) => apply({ city: v ?? undefined })} placeholder="Any town" ariaLabel="Town" />}
        </div>
      </Section>

      <Section title="Condition">
        <ChoiceChips
          name="condition"
          size="sm"
          value={f.condition ?? null}
          onChange={(v) => apply({ condition: (v as string) || undefined })}
          options={CONDITIONS.map((c) => ({ value: c.value, label: c.label, count: facets?.condition?.[c.value] ?? 0 }))}
        />
      </Section>

      <Section title="Year">
        <div className="grid grid-cols-2 gap-2">
          <Select aria-label="Oldest year" value={f.year_min ?? ""} onChange={(e) => apply({ year_min: e.target.value || undefined })}>
            <option value="">From any</option>
            {YEARS.filter((y) => !f.year_max || y <= Number(f.year_max)).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select aria-label="Newest year" value={f.year_max ?? ""} onChange={(e) => apply({ year_max: e.target.value || undefined })}>
            <option value="">To any</option>
            {YEARS.filter((y) => !f.year_min || y >= Number(f.year_min)).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      <Section title="Mileage">
        <Select aria-label="Maximum mileage" value={f.mileage_max ?? ""} onChange={(e) => apply({ mileage_max: e.target.value || undefined })}>
          <option value="">Any mileage</option>
          {MILEAGE_STEPS.map((m) => (
            <option key={m} value={m}>
              Under {formatNumber(m)} km
            </option>
          ))}
        </Select>
      </Section>

      <Section title="Fuel">
        <ChoiceChips
          name="fuel"
          size="sm"
          value={f.fuel ?? null}
          onChange={(v) => apply({ fuel: (v as string) || undefined })}
          options={FUELS.filter((x) => facets?.fuel?.[x.value] || f.fuel === x.value).map((x) => ({ value: x.value, label: x.label, count: facets?.fuel?.[x.value] ?? 0 }))}
        />
      </Section>

      {!["motorbike", "three-wheeler"].includes(f.type ?? "") && (
        <Section title="Transmission">
          <ChoiceChips
            name="transmission"
            size="sm"
            value={f.transmission ?? null}
            onChange={(v) => apply({ transmission: (v as string) || undefined })}
            options={TRANSMISSIONS.filter((x) => facets?.transmission?.[x.value] || f.transmission === x.value).map((x) => ({
              value: x.value,
              label: x.label,
              count: facets?.transmission?.[x.value] ?? 0,
            }))}
          />
        </Section>
      )}

      {bodies.length > 1 && (
        <Section title="Body type">
          <ChoiceChips name="body" size="sm" value={f.body ?? null} onChange={(v) => apply({ body: (v as string) || undefined })} options={bodies} />
        </Section>
      )}

      <Section title="More">
        <div className="space-y-2">
          <Switch checked={f.photos === "true"} onChange={(on) => apply({ photos: on ? "true" : undefined })} label="With photos" />
          <Switch checked={f.leasing === "true"} onChange={(on) => apply({ leasing: on ? "true" : undefined })} label="Leasing available" hint="Seller accepts leasing or finance" />
        </div>
        {!hideSeller && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-fg-muted">Seller</p>
            <ChoiceChips
              name="seller_type"
              size="sm"
              value={f.seller_type ?? null}
              onChange={(v) => apply({ seller_type: (v as string) || undefined })}
              options={[
                { value: "private", label: "Private" },
                { value: "dealer", label: "Dealers" },
              ]}
            />
          </div>
        )}
      </Section>
    </div>
  );
}
