"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Info, Lightbulb, MapPin, Pencil, RotateCcw, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCities } from "@/lib/catalog";
import { BODY_TYPES, COLOURS, CONDITIONS, FEATURES, FUELS, MAX_YEAR, TRANSMISSIONS, VEHICLE_TYPES, label } from "@/lib/constants";
import { formatLKR, formatLKRCompact, formatLakhs, normalizeLkPhone } from "@/lib/format";
import type { ListingCard as Card, PriceSpread, RefData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ChoiceCards, ChoiceChips, Switch } from "@/components/ui/choice";
import { FieldError, Hint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ListingCard } from "@/components/listing-card";
import { VehicleArt } from "@/components/vehicle-art";
import { cn } from "@/lib/cn";
import { PhotoUploader } from "./photo-uploader";
import { NO_TRANSMISSION, STEPS, digits, draftTitle, emptyDraft, firstInvalidStep, toListingRow, validate, type Draft, type Errors, type StepId } from "./draft";

const OTHER = "__other";
const YEARS = Array.from({ length: MAX_YEAR - 1949 }, (_, i) => String(MAX_YEAR - i));
const draftKey = (uid: string) => `wahana:sell-draft:${uid}`;

const TIPS: Record<StepId, string> = {
  vehicle: "Pick the exact model so buyers searching for it find your ad, and so we can show you what similar ones sell for.",
  details: "Accurate mileage and features build trust. Buyers skip ads that look vague.",
  photos: "Ads with 6 or more clear daylight photos get far more calls. Show any scratches honestly; it saves wasted visits.",
  price: "Price within the typical range and your ad gets a Fair or Good price tag, which buyers filter for.",
  contact: "Mention service history, accident history and why you're selling. Your number is only shown when a buyer taps to reveal it.",
  review: "You can edit your ad, mark it as sold or relist it at any time from My ads.",
};

function moneyInput(v: string) {
  const d = digits(v).slice(0, 10);
  return d ? Number(d).toLocaleString("en-LK") : "";
}

function Field({ label: l, htmlFor, error, hint, optional, children }: { label: string; htmlFor?: string; error?: string; hint?: React.ReactNode; optional?: boolean; children: React.ReactNode }) {
  return (
    <div data-invalid={error ? "" : undefined}>
      <Label htmlFor={htmlFor} optional={optional}>
        {l}
      </Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

export function SellWizard({
  mode,
  listingId,
  userId,
  initial,
  catalog,
  defaultContact,
}: {
  mode: "create" | "edit";
  listingId?: number;
  userId: string;
  initial?: Draft;
  catalog: RefData;
  defaultContact: { phone: string; whatsapp: string; name: string; hasSaved: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [d, setD] = useState<Draft>(() => initial ?? { ...emptyDraft(), phone: defaultContact.phone, whatsapp: defaultContact.whatsapp, whatsapp_same: !defaultContact.whatsapp || defaultContact.whatsapp === defaultContact.phone, seller_name: defaultContact.name });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [restored, setRestored] = useState(false);
  const [saveContact, setSaveContact] = useState(!defaultContact.hasSaved);
  const [publishing, setPublishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [spread, setSpread] = useState<PriceSpread | null | "loading">(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loaded = useRef(false);
  const initialPhotoIds = useRef(new Set((initial?.photos ?? []).map((p) => p.id).filter(Boolean) as string[]));
  const initialPhotoPaths = useRef(new Map((initial?.photos ?? []).filter((p) => p.id).map((p) => [p.id!, [p.path!, p.thumb_path].filter(Boolean) as string[]])));

  const current = STEPS[step].id;
  const set = useCallback(<K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  }, []);

  // Restore an unfinished draft (create mode only).
  useEffect(() => {
    if (mode !== "create" || loaded.current) return;
    loaded.current = true;
    try {
      const raw = localStorage.getItem(draftKey(userId));
      if (!raw) return;
      const saved = JSON.parse(raw) as { draft: Draft; step: number };
      if (!saved?.draft?.vehicle_type) return;
      setD({ ...emptyDraft(), ...saved.draft, photos: (saved.draft.photos ?? []).filter((p) => p.status === "done").map((p) => ({ ...p, preview: undefined })) });
      setStep(Math.min(saved.step ?? 0, STEPS.length - 1));
      setRestored(true);
    } catch {}
  }, [mode, userId]);

  // Autosave.
  useEffect(() => {
    if (mode !== "create" || !loaded.current) return;
    const t = setTimeout(() => {
      try {
        const photos = d.photos.filter((p) => p.status === "done").map(({ preview: _p, ...rest }) => rest);
        localStorage.setItem(draftKey(userId), JSON.stringify({ draft: { ...d, photos }, step }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [d, step, mode, userId]);

  const make = catalog.makes.find((m) => m.id === d.make_id);
  const model = catalog.models.find((m) => m.id === d.model_id);
  const district = catalog.districts.find((x) => x.id === d.district_id);
  const cities = useCities(d.district_id);
  const city = cities.find((c) => c.id === d.city_id);
  const title = draftTitle(d, catalog.makes, catalog.models) || "Your vehicle";

  // Market guidance for the price step.
  useEffect(() => {
    if (!d.model_id || !d.condition || !d.year_manufactured) {
      setSpread(null);
      return;
    }
    let alive = true;
    setSpread("loading");
    supabaseBrowser()
      .rpc("price_spread", { p_model_id: d.model_id, p_condition: d.condition, p_year: Number(d.year_manufactured), ...(listingId ? { p_exclude: listingId } : {}) })
      .then(({ data }) => {
        if (!alive) return;
        const s = data as unknown as PriceSpread | null;
        setSpread(s && s.peer_count > 0 ? s : null);
      });
    return () => {
      alive = false;
    };
  }, [d.model_id, d.condition, d.year_manufactured, listingId]);

  const goto = (i: number) => {
    setStep(i);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  const next = () => {
    const e = validate(current, d);
    if (Object.keys(e).length) {
      setErrors(e);
      requestAnimationFrame(() => {
        const el = document.querySelector("[data-invalid]");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.querySelector<HTMLElement>("input,select,textarea,button")?.focus({ preventScroll: true });
      });
      return;
    }
    goto(Math.min(step + 1, STEPS.length - 1));
  };

  const canJump = (i: number) => {
    if (mode === "edit") return true;
    for (let s = 0; s < i; s++) if (Object.keys(validate(STEPS[s].id, d)).length) return false;
    return true;
  };

  const publish = async () => {
    const bad = firstInvalidStep(d);
    if (bad) {
      const i = STEPS.findIndex((s) => s.id === bad);
      goto(i);
      setTimeout(() => setErrors(validate(bad, d)), 50);
      return;
    }
    setPublishing(true);
    setSubmitError(null);
    const db = supabaseBrowser();
    const row = toListingRow(d);
    const phone = normalizeLkPhone(d.phone)!;
    const whatsapp = d.whatsapp_same ? phone : d.whatsapp ? normalizeLkPhone(d.whatsapp) : null;
    const contact = { phone, whatsapp, seller_name: d.seller_name.trim().slice(0, 60) || null };
    const done = d.photos.filter((p) => p.status === "done" && p.path);

    try {
      let id = listingId!;
      let slug = "";
      if (mode === "create") {
        const { data, error } = await db.from("listings").insert({ ...row, seller_id: userId }).select("id, slug").single();
        if (error) throw error;
        id = data.id;
        slug = data.slug;
        const c = await db.from("listing_contacts").insert({ listing_id: id, ...contact });
        if (c.error) throw c.error;
        if (done.length) {
          const p = await db.from("listing_photos").insert(
            done.map((ph, i) => ({ listing_id: id, path: ph.path!, thumb_path: ph.thumb_path ?? null, width: ph.width ?? null, height: ph.height ?? null, position: i })),
          );
          if (p.error) throw p.error;
        }
      } else {
        const { data, error } = await db.from("listings").update(row).eq("id", id).select("id, slug").single();
        if (error) throw error;
        slug = data.slug;
        const c = await db.from("listing_contacts").upsert({ listing_id: id, ...contact }, { onConflict: "listing_id" });
        if (c.error) throw c.error;
        const keep = new Set(done.map((p) => p.id).filter(Boolean) as string[]);
        const removed = [...initialPhotoIds.current].filter((pid) => !keep.has(pid));
        if (removed.length) {
          await db.from("listing_photos").delete().in("id", removed);
          const paths = removed.flatMap((pid) => initialPhotoPaths.current.get(pid) ?? []);
          db.storage.from("listing-photos").remove(paths).then(() => {});
        }
        for (const [i, ph] of done.entries()) {
          if (ph.id) await db.from("listing_photos").update({ position: i }).eq("id", ph.id);
        }
        const fresh = done.map((ph, i) => ({ ph, i })).filter(({ ph }) => !ph.id);
        if (fresh.length) {
          const p = await db
            .from("listing_photos")
            .insert(fresh.map(({ ph, i }) => ({ listing_id: id, path: ph.path!, thumb_path: ph.thumb_path ?? null, width: ph.width ?? null, height: ph.height ?? null, position: i })));
          if (p.error) throw p.error;
        }
      }
      if (saveContact) {
        await db.from("profile_contacts").upsert({ id: userId, phone, whatsapp }, { onConflict: "id" });
      }
      try {
        localStorage.removeItem(draftKey(userId));
      } catch {}
      toast({ tone: "success", title: mode === "create" ? "Your ad is live" : "Changes saved" });
      router.push(mode === "create" ? `/ad/${id}/${slug}?posted=1` : `/ad/${id}/${slug}`);
      router.refresh();
    } catch (e) {
      const msg = (e as { message?: string }).message || "Something went wrong. Your draft is saved; try again.";
      setSubmitError(msg);
      setPublishing(false);
    }
  };

  // ---------- option lists ----------
  const makeOptions = useMemo(() => {
    const list = catalog.makes
      .filter((m) => !d.vehicle_type || m.vehicle_types.includes(d.vehicle_type))
      .map((m) => ({ value: String(m.id), label: m.name, group: m.is_popular ? "Popular" : "All makes" }))
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1));
    return [...list, { value: OTHER, label: "Other make", hint: "Not listed", group: "All makes" }];
  }, [catalog.makes, d.vehicle_type]);

  const modelOptions = useMemo(() => {
    if (!d.make_id) return [{ value: OTHER, label: "Other model" }];
    const list = catalog.models
      .filter((m) => m.make_id === d.make_id && (!d.vehicle_type || m.vehicle_type === d.vehicle_type))
      .map((m) => ({ value: String(m.id), label: m.name, group: m.is_popular ? "Popular" : "All models" }))
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1));
    return [...list, { value: OTHER, label: "Other model", hint: "Not listed" }];
  }, [catalog.models, d.make_id, d.vehicle_type]);

  const [makeOther, setMakeOther] = useState(!!d.make_other && !d.make_id);
  const [modelOther, setModelOther] = useState(!!d.model_other && !d.model_id);

  // Card preview of the ad being built.
  const preview: Card = {
    id: 0,
    slug: "preview",
    title,
    vehicle_type: d.vehicle_type ?? "car",
    price_lkr: Number(digits(d.price_lkr)) || 0,
    negotiable: d.negotiable,
    condition: d.condition ?? "used",
    year_manufactured: Number(d.year_manufactured) || MAX_YEAR,
    year_registered: d.year_registered ? Number(d.year_registered) : null,
    mileage_km: d.mileage_km ? Number(digits(d.mileage_km)) : null,
    fuel: d.fuel,
    transmission: d.transmission,
    engine_cc: null,
    district: district?.name ?? "Your district",
    district_slug: "",
    city: city?.name ?? null,
    cover_photo: null,
    cover_thumb: d.photos[0]?.preview ?? d.photos[0]?.thumb_path ?? null,
    photo_count: d.photos.length,
    price_rating: null,
    market_median_lkr: null,
    market_peer_count: null,
    bumped_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    is_top: false,
    is_urgent: false,
    is_dealer: false,
    dealer_name: null,
    is_demo: false,
    status: "active",
  };
  const price = Number(digits(d.price_lkr)) || 0;
  const med = spread && spread !== "loading" ? spread.median : null;
  const predicted = med && price && spread && spread !== "loading" && spread.peer_count >= 4 ? (price <= med * 0.95 ? "good" : price >= med * 1.08 ? "high" : "fair") : null;
  if (predicted) preview.price_rating = predicted as Card["price_rating"];

  // ---------- steps ----------
  const stepVehicle = (
    <div className="space-y-7">
      <Field label="Type of vehicle" error={errors.vehicle_type}>
        <div role="radiogroup" aria-label="Type of vehicle" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {VEHICLE_TYPES.map((t) => {
            const on = d.vehicle_type === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  if (on) return;
                  setD((prev) => ({ ...prev, vehicle_type: t.slug, make_id: null, model_id: null, body_type: null, transmission: NO_TRANSMISSION.includes(t.slug) ? null : prev.transmission }));
                  setMakeOther(false);
                  setModelOther(false);
                  setErrors((e) => ({ ...e, vehicle_type: undefined }));
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center text-[13px] font-semibold transition-colors",
                  on ? "border-brand bg-brand-soft/50 text-brand-soft-fg" : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <VehicleArt type={t.slug} className={cn("h-7 w-14", on ? "text-brand-text [--art-bg:var(--brand-soft)]" : "text-fg-muted [--art-bg:var(--surface)]")} />
                {t.short}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Make" htmlFor="sell-make" error={errors.make_id}>
          <Combobox
            id="sell-make"
            options={makeOptions}
            value={makeOther ? OTHER : d.make_id ? String(d.make_id) : null}
            invalid={!!errors.make_id}
            disabled={!d.vehicle_type}
            placeholder={d.vehicle_type ? "Search makes" : "Choose a type first"}
            onChange={(v) => {
              setMakeOther(v === OTHER);
              setModelOther(false);
              setD((prev) => ({ ...prev, make_id: v && v !== OTHER ? Number(v) : null, model_id: null, make_other: v === OTHER ? prev.make_other : "" }));
              setErrors((e) => ({ ...e, make_id: undefined }));
            }}
          />
          {makeOther && <Input className="mt-2" placeholder="Type the make" value={d.make_other} maxLength={40} onChange={(e) => set("make_other", e.target.value)} aria-label="Make name" />}
        </Field>
        <Field label="Model" htmlFor="sell-model" error={errors.model_id}>
          <Combobox
            id="sell-model"
            options={modelOptions}
            value={modelOther ? OTHER : d.model_id ? String(d.model_id) : null}
            invalid={!!errors.model_id}
            disabled={!d.make_id && !makeOther}
            placeholder={d.make_id || makeOther ? "Search models" : "Choose a make first"}
            onChange={(v) => {
              setModelOther(v === OTHER || (makeOther && !!v));
              const m = catalog.models.find((x) => String(x.id) === v);
              setD((prev) => ({ ...prev, model_id: m ? m.id : null, model_other: v === OTHER ? prev.model_other : "", body_type: prev.body_type ?? m?.body_type ?? null }));
              setErrors((e) => ({ ...e, model_id: undefined }));
            }}
          />
          {(modelOther || makeOther) && <Input className="mt-2" placeholder="Type the model" value={d.model_other} maxLength={60} onChange={(e) => set("model_other", e.target.value)} aria-label="Model name" />}
        </Field>
      </div>

      <Field label="Edition or grade" htmlFor="sell-trim" optional hint="For example G, S, X, Safety, Premium or Hybrid.">
        <Input id="sell-trim" value={d.trim_level} maxLength={60} onChange={(e) => set("trim_level", e.target.value)} placeholder="e.g. S Safety" />
      </Field>

      <Field label="Condition" error={errors.condition}>
        <ChoiceCards
          name="condition"
          value={d.condition}
          invalid={!!errors.condition}
          onChange={(v) => {
            setD((prev) => ({ ...prev, condition: v, year_registered: v === "used" ? prev.year_registered : "", previous_owners: v === "used" ? prev.previous_owners : "", mileage_km: v === "brand_new" ? "" : prev.mileage_km }));
            setErrors((e) => ({ ...e, condition: undefined }));
          }}
          options={CONDITIONS.map((c) => ({ value: c.value, label: c.label, hint: c.hint }))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Year made" htmlFor="sell-year" error={errors.year_manufactured}>
          <Select id="sell-year" value={d.year_manufactured} aria-invalid={!!errors.year_manufactured} onChange={(e) => set("year_manufactured", e.target.value)}>
            <option value="">Choose year</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
        </Field>
        <Field label="Year registered in Sri Lanka" htmlFor="sell-reg" error={errors.year_registered} optional={d.condition !== "used"}>
          <Select id="sell-reg" value={d.year_registered} aria-invalid={!!errors.year_registered} onChange={(e) => set("year_registered", e.target.value)}>
            <option value="">{d.condition === "used" ? "Choose year" : "Not registered yet"}</option>
            {YEARS.filter((y) => !d.year_manufactured || Number(y) >= Number(d.year_manufactured)).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );

  const bodies = d.vehicle_type ? BODY_TYPES[d.vehicle_type] ?? [] : [];
  const stepDetails = (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        {d.condition !== "brand_new" && (
          <Field label="Mileage" htmlFor="sell-mileage" error={errors.mileage_km}>
            <Input id="sell-mileage" inputMode="numeric" value={moneyInput(d.mileage_km)} aria-invalid={!!errors.mileage_km} onChange={(e) => set("mileage_km", digits(e.target.value))} trailing="km" placeholder="e.g. 85,000" />
          </Field>
        )}
        <Field label="Engine capacity" htmlFor="sell-cc" error={errors.engine_cc} optional>
          <Input id="sell-cc" inputMode="numeric" value={d.engine_cc} onChange={(e) => set("engine_cc", digits(e.target.value).slice(0, 5))} trailing="cc" placeholder="e.g. 1500" />
        </Field>
      </div>

      <Field label="Fuel" error={errors.fuel}>
        <ChoiceChips name="fuel" value={d.fuel} onChange={(v) => set("fuel", (v as string) ?? null)} options={FUELS} />
      </Field>

      {!NO_TRANSMISSION.includes(d.vehicle_type ?? "") && (
        <Field label="Transmission" error={errors.transmission}>
          <ChoiceChips name="transmission" value={d.transmission} onChange={(v) => set("transmission", (v as string) ?? null)} options={TRANSMISSIONS} />
        </Field>
      )}

      {bodies.length > 0 && (
        <Field label="Body type" optional>
          <ChoiceChips name="body" value={d.body_type} onChange={(v) => set("body_type", (v as string) ?? null)} options={bodies} />
        </Field>
      )}

      <Field label="Colour" optional>
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
          {COLOURS.map((c) => {
            const on = d.colour === c.name;
            return (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("colour", on ? null : c.name)}
                className={cn("inline-flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-sm font-medium", on ? "border-brand bg-brand-soft text-brand-soft-fg" : "border-border bg-surface hover:border-border-strong")}
              >
                <span className="grid size-7 place-items-center rounded-full border border-black/10" style={{ background: c.hex }}>
                  {on && <Check className={cn("size-3.5", ["White", "Pearl White", "Silver", "Beige", "Yellow"].includes(c.name) ? "text-black" : "text-white")} strokeWidth={3} />}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      </Field>

      {d.condition === "used" && (
        <Field label="Previous owners" optional hint="Not counting you.">
          <ChoiceChips
            name="owners"
            value={d.previous_owners || null}
            onChange={(v) => set("previous_owners", (v as string) ?? "")}
            options={[
              { value: "0", label: "None, I'm the first owner" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4 or more" },
            ]}
          />
        </Field>
      )}

      {!["motorbike", "heavy-duty"].includes(d.vehicle_type ?? "") && (
        <Field label="Features" optional>
          <ChoiceChips name="features" multiple value={d.features} onChange={(v) => set("features", (v as string[]) ?? [])} options={FEATURES.map((f) => ({ value: f, label: f }))} />
        </Field>
      )}
    </div>
  );

  const stepPhotos = (
    <div>
      <PhotoUploader userId={userId} folder={mode === "edit" ? String(listingId) : d.folder} photos={d.photos} onChange={(fn) => setD((prev) => ({ ...prev, photos: fn(prev.photos) }))} />
      <FieldError>{errors.photos_pending}</FieldError>
      {d.photos.length === 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-fg">
          <Lightbulb className="mt-0.5 size-4 shrink-0" /> You can publish without photos and add them later, but ads with photos get many more enquiries.
        </p>
      )}
    </div>
  );

  const districtOptions = catalog.districts.map((x) => ({ value: String(x.id), label: x.name, keywords: `${x.name_si ?? ""} ${x.name_ta ?? ""}`, hint: x.name_si ?? undefined }));
  const cityOptions = cities.map((c) => ({ value: String(c.id), label: c.name, keywords: `${c.name_si ?? ""} ${c.name_ta ?? ""}` }));

  const stepPrice = (
    <div className="space-y-7">
      <Field label="Asking price" htmlFor="sell-price" error={errors.price_lkr}>
        <Input
          id="sell-price"
          inputMode="numeric"
          value={moneyInput(d.price_lkr)}
          aria-invalid={!!errors.price_lkr}
          onChange={(e) => set("price_lkr", digits(e.target.value))}
          leading={<span className="text-sm font-semibold text-fg-muted">Rs</span>}
          trailing={formatLakhs(price) || undefined}
          placeholder="e.g. 8,500,000"
          className="text-lg font-semibold"
        />
      </Field>

      <div className="rounded-2xl border border-border bg-surface-2/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-brand-text" /> Market guide
        </p>
        {spread === "loading" ? (
          <div className="mt-3 space-y-2">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        ) : spread && spread.min != null ? (
          <>
            <p className="mt-2 text-[15px]">
              {spread.peer_count} similar {spread.peer_count === 1 ? "ad is" : "ads are"} listed for{" "}
              <strong>
                {formatLKRCompact(spread.min)} to {formatLKRCompact(spread.max)}
              </strong>
              {spread.median != null && (
                <>
                  , with a median of <strong>{formatLKRCompact(spread.median)}</strong>
                </>
              )}
              .
            </p>
            {spread.p25 != null && spread.p75 != null && spread.peer_count >= 4 && (
              <p className="mt-1 text-sm text-fg-muted">
                Most are between {formatLKRCompact(spread.p25)} and {formatLKRCompact(spread.p75)}.
              </p>
            )}
            {predicted && (
              <p
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
                  predicted === "good" ? "bg-good-soft text-good" : predicted === "high" ? "bg-high-soft text-high" : "bg-surface text-fg",
                )}
                aria-live="polite"
              >
                {predicted === "good" ? <TrendingDown className="size-4" /> : predicted === "high" ? <TrendingUp className="size-4" /> : <Minus className="size-4" />}
                At {formatLKRCompact(price)}, buyers will see this as {predicted === "good" ? "a Good price" : predicted === "high" ? "Above market" : "a Fair price"}.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">
            {d.model_id ? "There aren't enough similar ads live right now to suggest a price." : "Pick a listed model in step 1 to see what similar vehicles are listed for."}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <Switch checked={d.negotiable} onChange={(v) => set("negotiable", v)} label="Price is negotiable" />
        <Switch checked={d.leasing_available} onChange={(v) => set("leasing_available", v)} label="Leasing available" hint="Buyers can pay with a lease or finance" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="District" htmlFor="sell-district" error={errors.district_id}>
          <Combobox
            id="sell-district"
            options={districtOptions}
            value={d.district_id ? String(d.district_id) : null}
            invalid={!!errors.district_id}
            leading={<MapPin className="size-4" />}
            placeholder="Where is it?"
            onChange={(v) => {
              setD((prev) => ({ ...prev, district_id: v ? Number(v) : null, city_id: null }));
              setErrors((e) => ({ ...e, district_id: undefined }));
            }}
          />
        </Field>
        <Field label="Town" htmlFor="sell-city" optional>
          <Combobox id="sell-city" options={cityOptions} value={d.city_id ? String(d.city_id) : null} disabled={!d.district_id} placeholder={d.district_id ? "Search towns" : "Choose a district first"} onChange={(v) => set("city_id", v ? Number(v) : null)} />
        </Field>
      </div>
    </div>
  );

  const PROMPTS = [
    "Full service records available.",
    "No accidents, original paint.",
    "CR book in my name.",
    "Lease ongoing, can be settled on sale.",
    "Selling because I'm upgrading.",
  ];

  const stepContact = (
    <div className="space-y-7">
      <Field label="Description" htmlFor="sell-desc" error={errors.description} optional>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set("description", d.description.includes(p) ? d.description : `${d.description.trim()}${d.description.trim() ? " " : ""}${p}`)}
              className="rounded-full border border-border bg-surface px-3 py-1 text-[13px] font-medium hover:border-border-strong hover:bg-surface-2"
            >
              + {p}
            </button>
          ))}
        </div>
        <Textarea id="sell-desc" rows={6} value={d.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} placeholder="Service history, recent repairs, what's included, why you're selling…" />
        <p className="mt-1 text-right text-xs text-fg-subtle">{d.description.length} / 5000</p>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone number" htmlFor="sell-phone" error={errors.phone} hint="Only shown when a buyer taps to reveal it.">
          <Input id="sell-phone" type="tel" inputMode="tel" autoComplete="tel" value={d.phone} aria-invalid={!!errors.phone} onChange={(e) => set("phone", e.target.value)} placeholder="077 123 4567" />
        </Field>
        <Field label="Name to show buyers" htmlFor="sell-name" optional>
          <Input id="sell-name" autoComplete="name" value={d.seller_name} maxLength={60} onChange={(e) => set("seller_name", e.target.value)} placeholder="e.g. Nuwan" />
        </Field>
      </div>
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <Switch checked={d.whatsapp_same} onChange={(v) => set("whatsapp_same", v)} label="Buyers can WhatsApp this number" />
        {!d.whatsapp_same && (
          <Field label="WhatsApp number" htmlFor="sell-wa" error={errors.whatsapp} optional>
            <Input id="sell-wa" type="tel" inputMode="tel" value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="Leave blank for none" />
          </Field>
        )}
        <Switch checked={saveContact} onChange={setSaveContact} label="Remember these numbers for my next ad" />
      </div>
    </div>
  );

  const summary: { step: number; rows: [string, string | null | undefined][] }[] = [
    {
      step: 0,
      rows: [
        ["Vehicle", title],
        ["Type", VEHICLE_TYPES.find((t) => t.slug === d.vehicle_type)?.name],
        ["Condition", label(CONDITIONS, d.condition)],
        ["Registered", d.year_registered || (d.condition !== "used" ? "Not registered yet" : null)],
      ],
    },
    {
      step: 1,
      rows: [
        ["Mileage", d.mileage_km ? `${Number(d.mileage_km).toLocaleString("en-LK")} km` : null],
        ["Fuel", label(FUELS, d.fuel)],
        ["Transmission", label(TRANSMISSIONS, d.transmission)],
        ["Engine", d.engine_cc ? `${d.engine_cc} cc` : null],
        ["Colour", d.colour],
        ["Features", d.features.length ? `${d.features.length} selected` : null],
      ],
    },
    { step: 2, rows: [["Photos", d.photos.length ? `${d.photos.length} photo${d.photos.length === 1 ? "" : "s"}` : "None yet"]] },
    {
      step: 3,
      rows: [
        ["Price", price ? `${formatLKR(price)}${d.negotiable ? ", negotiable" : ""}` : null],
        ["Location", [city?.name, district?.name].filter(Boolean).join(", ")],
      ],
    },
    {
      step: 4,
      rows: [
        ["Phone", d.phone],
        ["Description", d.description ? `${d.description.slice(0, 80)}${d.description.length > 80 ? "…" : ""}` : "None"],
      ],
    },
  ];

  const stepReview = (
    <div className="space-y-4">
      {summary.map((s) => (
        <div key={s.step} className="rounded-2xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-fg-muted">{STEPS[s.step].title}</p>
            <button type="button" onClick={() => goto(s.step)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-text hover:bg-brand-soft">
              <Pencil className="size-3.5" /> Edit
            </button>
          </div>
          <dl className="grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
            {s.rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-fg-muted">{k}</dt>
                  <dd className="min-w-0 font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
      <p className="flex items-start gap-2 text-sm text-fg-muted">
        <Info className="mt-0.5 size-4 shrink-0" /> Your ad stays live for 60 days, and you can relist it after that. Private sellers can have up to 10 live ads at once.
      </p>
      {submitError && <p className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm font-medium text-danger">{submitError}</p>}
    </div>
  );

  const body = { vehicle: stepVehicle, details: stepDetails, photos: stepPhotos, price: stepPrice, contact: stepContact, review: stepReview }[current];
  const isLast = current === "review";
  const uploading = d.photos.some((p) => p.status === "processing" || p.status === "uploading");

  return (
    <div className="container-page pb-36 pt-4 sm:pt-8 lg:pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-text">{mode === "create" ? "Post an ad" : "Edit your ad"}</p>
            <p className="text-sm text-fg-muted">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          {restored && mode === "create" && (
            <div className="flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-3 pr-1 text-sm">
              <span className="text-fg-muted">Picked up where you left off</span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(draftKey(userId));
                  setD({ ...emptyDraft(), phone: defaultContact.phone, seller_name: defaultContact.name });
                  setStep(0);
                  setRestored(false);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-semibold hover:bg-surface-3"
              >
                <RotateCcw className="size-3.5" /> Start over
              </button>
            </div>
          )}
        </div>

        {/* Stepper */}
        <ol className="mb-6 grid grid-cols-6 gap-1.5" aria-label="Steps">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            const enabled = i !== step && canJump(i);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!enabled}
                  onClick={() => goto(i)}
                  aria-current={state === "current" ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span className={cn("block h-1.5 rounded-full transition-colors", state === "todo" ? "bg-surface-3" : "bg-brand", enabled && "group-hover:opacity-80")} />
                  <span className={cn("mt-2 hidden text-[13px] font-semibold sm:block", state === "current" ? "text-fg" : state === "done" ? "text-fg-muted" : "text-fg-subtle")}>{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="step-heading" className="min-w-0 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
            <h1 id="step-heading" ref={headingRef} tabIndex={-1} className="mb-6 text-2xl font-extrabold outline-none sm:text-[28px]">
              {STEPS[step].heading}
            </h1>
            <div key={current} className="animate-fade-in">
              {body}
            </div>

            {/* Desktop actions */}
            <div className="mt-8 hidden items-center justify-between gap-3 border-t border-border pt-6 lg:flex">
              <Button variant="ghost" onClick={() => goto(step - 1)} disabled={step === 0}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              {isLast ? (
                <Button size="lg" onClick={publish} loading={publishing} disabled={uploading}>
                  {mode === "create" ? "Publish ad" : "Save changes"}
                </Button>
              ) : (
                <Button size="lg" onClick={next} disabled={current === "photos" && uploading}>
                  {current === "photos" && d.photos.length === 0 ? "Skip for now" : "Continue"} <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </section>

          <aside className="hidden space-y-4 lg:block">
            <div className="sticky top-24 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Preview</p>
                <div inert className="pointer-events-none">
                  {mounted ? <ListingCard l={preview} /> : <div className="skeleton aspect-[4/5] rounded-2xl" />}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="size-4 text-accent" /> Tip
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{TIPS[current]}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => goto(step - 1)} aria-label="Back" className="px-4">
              <ArrowLeft className="size-5" />
            </Button>
          )}
          {isLast ? (
            <Button size="lg" className="flex-1" onClick={publish} loading={publishing} disabled={uploading}>
              {mode === "create" ? "Publish ad" : "Save changes"}
            </Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={next} disabled={current === "photos" && uploading}>
              {current === "photos" && uploading ? "Uploading photos…" : current === "photos" && d.photos.length === 0 ? "Skip for now" : `Continue to ${STEPS[step + 1].title.toLowerCase()}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
