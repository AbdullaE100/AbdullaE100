"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Info, Gauge } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCatalog } from "@/lib/catalog";
import { CONDITIONS, MAX_YEAR, VEHICLE_TYPES, typeBySlug } from "@/lib/constants";
import { formatKm, formatLKR, formatLKRCompact } from "@/lib/format";
import type { ListingCard as Card, PriceSpread, SearchResult } from "@/lib/types";
import type { Json } from "@/lib/database.types";
import { Combobox } from "@/components/ui/combobox";
import { ChoiceChips } from "@/components/ui/choice";
import { Label, Select } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";

const YEARS = Array.from({ length: MAX_YEAR - 1979 }, (_, i) => String(MAX_YEAR - i));

export function Valuer() {
  const ref = useCatalog();
  const [type, setType] = useState("car");
  const [makeId, setMakeId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState<string>("used");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ spread: PriceSpread | null; examples: Card[]; href: string } | null>(null);

  const makes = useMemo(() => (ref?.makes ?? []).filter((m) => m.vehicle_types.includes(type)).map((m) => ({ value: String(m.id), label: m.name })), [ref, type]);
  const models = useMemo(
    () => (ref?.models ?? []).filter((m) => String(m.make_id) === makeId && m.vehicle_type === type).map((m) => ({ value: String(m.id), label: m.name })),
    [ref, makeId, type],
  );
  const make = ref?.makes.find((m) => String(m.id) === makeId);
  const model = ref?.models.find((m) => String(m.id) === modelId);

  const run = async () => {
    if (!model || !year || !make) return;
    setBusy(true);
    const db = supabaseBrowser();
    const y = Number(year);
    const filters = { type, make: make.slug, model: model.slug, condition, year_min: String(y - 1), year_max: String(y + 1) };
    const [{ data: s }, { data: r }] = await Promise.all([
      db.rpc("price_spread", { p_model_id: model.id, p_condition: condition, p_year: y }),
      db.rpc("search_listings", { p: { ...filters, page_size: 4, sort: "price_asc" } as unknown as Json }),
    ]);
    const spread = s as unknown as PriceSpread | null;
    const t = typeBySlug(type);
    const qs = new URLSearchParams({ condition, year_min: String(y - 1), year_max: String(y + 1) });
    setResult({
      spread: spread && spread.peer_count > 0 ? spread : null,
      examples: ((r as unknown as SearchResult | null)?.items ?? []).slice(0, 4),
      href: `/${t?.path ?? "vehicles"}/${make.slug}/${model.slug}?${qs}`,
    });
    setBusy(false);
  };

  const s = result?.spread;
  const lo = s?.min ?? 0;
  const hi = s?.max ?? 0;
  const span = hi - lo || 1;
  const pct = (v: number) => `${((v - lo) / span) * 100}%`;

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      <form
        className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6 lg:self-start"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div>
          <Label>Type</Label>
          <ChoiceChips
            name="v-type"
            size="sm"
            value={type}
            onChange={(v) => {
              if (!v) return;
              setType(v as string);
              setMakeId(null);
              setModelId(null);
              setResult(null);
            }}
            options={VEHICLE_TYPES.slice(0, 7).map((t) => ({ value: t.slug, label: t.short }))}
          />
        </div>
        <div>
          <Label htmlFor="v-make">Make</Label>
          <Combobox id="v-make" options={makes} value={makeId} onChange={(v) => { setMakeId(v); setModelId(null); }} placeholder="Search makes" />
        </div>
        <div>
          <Label htmlFor="v-model">Model</Label>
          <Combobox id="v-model" options={models} value={modelId} onChange={setModelId} disabled={!makeId} placeholder={makeId ? "Search models" : "Choose a make first"} />
        </div>
        <div>
          <Label htmlFor="v-year">Year made</Label>
          <Select id="v-year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Choose year</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Condition</Label>
          <ChoiceChips name="v-cond" size="sm" value={condition} onChange={(v) => v && setCondition(v as string)} options={CONDITIONS.map((c) => ({ value: c.value, label: c.label }))} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!modelId || !year}>
          Check the market
        </Button>
      </form>

      <div className="min-w-0">
        {!result ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border-strong bg-surface p-8 text-center">
            <Gauge className="size-10 text-fg-subtle" />
            <p className="mt-3 font-semibold">Pick a model and year</p>
            <p className="mt-1 max-w-sm text-[15px] text-fg-muted">We&apos;ll show what similar vehicles are listed for right now, based on live ads.</p>
          </div>
        ) : !s || s.min == null ? (
          <div className="rounded-3xl border border-border bg-surface p-6">
            <p className="flex items-start gap-2 font-semibold">
              <Info className="mt-0.5 size-5 shrink-0 text-fg-muted" /> Not enough live ads for a {year} {make?.name} {model?.name} yet.
            </p>
            <p className="mt-2 text-fg-muted">Try a year either side, or a different condition. You can also post your ad and price it yourself.</p>
            <ButtonLink href="/sell" className="mt-5">
              Post an ad
            </ButtonLink>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
              <p className="text-sm font-semibold text-fg-muted">
                {year} {make?.name} {model?.name}, {CONDITIONS.find((c) => c.value === condition)?.label.toLowerCase()}
              </p>
              <p className="tabular mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {s.p25 != null && s.p75 != null && s.peer_count >= 4 ? `${formatLKRCompact(s.p25)} – ${formatLKRCompact(s.p75)}` : `${formatLKRCompact(s.min)} – ${formatLKRCompact(s.max)}`}
              </p>
              <p className="mt-1 text-[15px] text-fg-muted">
                {s.peer_count >= 4 ? "Where most similar ads are priced" : "Range of similar ads"} · median {formatLKR(s.median)} from {s.peer_count} {s.peer_count === 1 ? "ad" : "ads"}
              </p>
              <div className="relative mb-2 mt-8 h-3 rounded-full bg-surface-2">
                {s.p25 != null && s.p75 != null && <div className="absolute inset-y-0 rounded-full bg-brand-soft ring-1 ring-brand/30" style={{ left: pct(s.p25), right: `calc(100% - ${pct(s.p75)})` }} />}
                {s.median != null && <div className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded bg-brand" style={{ left: pct(s.median) }} />}
              </div>
              <div className="tabular flex justify-between text-xs text-fg-subtle">
                <span>{formatLKRCompact(s.min)}</span>
                <span>{formatLKRCompact(s.max)}</span>
              </div>
              {s.median_mileage != null && <p className="mt-5 text-sm text-fg-muted">Typical mileage for these: {formatKm(s.median_mileage)}. Lower mileage and full service records push the price up.</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <ButtonLink href="/sell">Sell yours</ButtonLink>
                <ButtonLink href={result.href} variant="secondary">
                  See the ads <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            </div>
            {result.examples.length > 0 && (
              <div>
                <p className="mb-3 font-semibold">Similar ads, lowest price first</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.examples.map((l) => (
                    <ListingCard key={l.id} l={l} layout="responsive" />
                  ))}
                </div>
                <Link href={result.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
                  See all similar ads <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
