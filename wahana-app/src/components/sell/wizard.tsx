import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowLeft, Check, Info, Lightbulb, Minus, RotateCcw, TrendingDown, TrendingUp, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BODY_TYPES, COLOURS, CONDITIONS, FEATURES, FUELS, MAX_YEAR, TRANSMISSIONS, VEHICLE_TYPES, label } from "@shared/constants";
import { formatLakhs, formatLKR, formatLKRCompact, normalizeLkPhone } from "@shared/format";
import type { ListingCard as Card } from "@shared/types";
import { ResultCard } from "@/components/listing/cards";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { SelectField, type Option } from "@/components/ui/select";
import { SwitchRow } from "@/components/ui/switch-row";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { VehicleArt } from "@/components/vehicle-art";
import { track } from "@/lib/analytics";
import { useCatalog, useCities, usePriceSpread } from "@/lib/api";
import { NO_TRANSMISSION, STEPS, digits, draftTitle, emptyDraft, firstInvalidStep, toListingRow, validate, type Draft, type Errors, type StepId } from "@/lib/sell/draft";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { PhotoGrid } from "./photo-grid";

const OTHER = -1;
const YEARS = Array.from({ length: MAX_YEAR - 1949 }, (_, i) => String(MAX_YEAR - i));
export const draftKey = (uid: string) => `wahana:sell-draft:${uid}`;

const TIPS: Record<StepId, string> = {
  vehicle: "Pick the exact model so buyers searching for it find your ad, and so we can show you what similar ones sell for.",
  details: "Accurate mileage and features build trust. Buyers skip ads that look vague.",
  photos: "Ads with 6 or more clear daylight photos get far more calls. Show any scratches honestly; it saves wasted visits.",
  price: "Price within the typical range and your ad gets a Fair or Good price tag, which buyers filter for.",
  contact: "Mention service history, accident history and why you're selling. Your number is only shown when a buyer taps to reveal it.",
  review: "You can edit your ad, mark it as sold or relist it at any time from My ads.",
};

const money = (v: string) => {
  const d = digits(v).slice(0, 10);
  return d ? Number(d).toLocaleString("en-LK") : "";
};

export type SellerDefaults = { phone: string; whatsapp: string; name: string; hasSaved: boolean };

export function SellWizard({ mode, listingId, userId, initial, defaults }: { mode: "create" | "edit"; listingId?: number; userId: string; initial?: Draft; defaults: SellerDefaults }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { toast } = useToast();
  const cat = useCatalog();
  const [d, setD] = useState<Draft>(
    () =>
      initial ?? {
        ...emptyDraft(),
        phone: defaults.phone,
        whatsapp: defaults.whatsapp && defaults.whatsapp !== defaults.phone ? defaults.whatsapp : "",
        whatsapp_mode: defaults.whatsapp && defaults.whatsapp !== defaults.phone ? "other" : "same",
        seller_name: defaults.name,
      },
  );
  const [makeOther, setMakeOther] = useState(!!d.make_other && !d.make_id);
  const [modelOther, setModelOther] = useState(!!d.model_other && !d.model_id);
  const created = useRef<{ id: number } | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [restored, setRestored] = useState(false);
  const [saveContact, setSaveContact] = useState(!defaults.hasSaved);
  const [publishing, setPublishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loaded = useRef(mode !== "create");
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const started = useRef(false);

  const current = STEPS[step].id;
  const set = useCallback(<K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  }, []);

  useEffect(() => {
    if (!started.current && mode === "create") {
      started.current = true;
      track("sell_started", {});
    }
  }, [mode]);

  // Restore an unfinished draft (create mode only).
  useEffect(() => {
    if (mode !== "create") return;
    AsyncStorage.getItem(draftKey(userId))
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { draft: Draft; step: number };
        if (!saved?.draft?.vehicle_type) return;
        setD({ ...emptyDraft(), ...saved.draft, photos: (saved.draft.photos ?? []).filter((p) => p.status === "done").map(({ localUri: _l, ...p }) => p) });
        setMakeOther(!!saved.draft.make_other && !saved.draft.make_id);
        setModelOther(!!saved.draft.model_other && !saved.draft.model_id);
        setStep(Math.min(saved.step ?? 0, STEPS.length - 1));
        setRestored(true);
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, [mode, userId]);

  // Autosave as they go.
  useEffect(() => {
    if (mode !== "create" || !loaded.current) return;
    const t = setTimeout(() => {
      const photos = d.photos.filter((p) => p.status === "done").map(({ localUri: _l, ...rest }) => rest);
      AsyncStorage.setItem(draftKey(userId), JSON.stringify({ draft: { ...d, photos }, step })).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [d, step, mode, userId]);

  const makes = cat.data?.makes ?? [];
  const models = cat.data?.models ?? [];
  const district = cat.data?.districts.find((x) => x.id === d.district_id);
  const cities = useCities(d.district_id);
  const city = cities.data?.find((x) => x.id === d.city_id);
  const title = draftTitle(d, makes, models) || "Your vehicle";
  const spread = usePriceSpread(d.model_id, d.condition, Number(d.year_manufactured) || null, listingId);

  const goto = (i: number) => {
    setStep(i);
    setErrors({});
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const next = () => {
    const e = validate(current, d);
    if (Object.keys(e).length) {
      setErrors(e);
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    track("sell_step_completed", { step: current, index: step, mode });
    goto(Math.min(step + 1, STEPS.length - 1));
  };

  const back = () => (step > 0 ? goto(step - 1) : exit());

  const exit = () => {
    const leave = () => (router.canGoBack() ? router.back() : router.replace("/sell"));
    const dirty = mode === "edit" || d.vehicle_type;
    if (!dirty || Platform.OS === "web") return leave();
    Alert.alert(mode === "edit" ? "Discard changes?" : "Leave for now?", mode === "edit" ? "Your changes to this ad won't be saved." : "Your draft is saved on this phone. Pick up where you left off any time.", [
      { text: "Keep editing", style: "cancel" },
      { text: mode === "edit" ? "Discard" : "Leave", style: mode === "edit" ? "destructive" : "default", onPress: leave },
    ]);
  };

  const startOver = () => {
    AsyncStorage.removeItem(draftKey(userId)).catch(() => {});
    setD({ ...emptyDraft(), phone: defaults.phone, whatsapp: "", whatsapp_mode: "same", seller_name: defaults.name });
    setMakeOther(false);
    setModelOther(false);
    setRestored(false);
    goto(0);
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
    const row = toListingRow(d);
    const phone = normalizeLkPhone(d.phone)!;
    const whatsapp = d.whatsapp_mode === "same" ? phone : d.whatsapp_mode === "other" ? normalizeLkPhone(d.whatsapp) : null;
    const contact = { phone, whatsapp, seller_name: d.seller_name.trim().slice(0, 60) || null };
    const done = d.photos.filter((p) => p.status === "done" && p.path);
    const isNew = mode === "create";
    let liveAlready = false;
    try {
      // 1. The listing row is created once; a retry updates it instead of posting twice.
      let id: number;
      const existing = mode === "edit" ? listingId! : created.current?.id;
      if (existing) {
        const { error } = await supabase.from("listings").update(row).eq("id", existing);
        if (error) throw error;
        id = existing;
      } else {
        const { data, error } = await supabase.from("listings").insert({ ...row, seller_id: userId }).select("id").single();
        if (error) throw error;
        created.current = { id: data.id };
        id = data.id;
      }
      liveAlready = isNew;

      // 2. Contact details (safe to repeat).
      const cu = await supabase.from("listing_contacts").upsert({ listing_id: id, ...contact }, { onConflict: "listing_id" });
      if (cu.error) throw cu.error;

      // 3. Photos: make the rows match the draft, then tidy storage.
      const { data: rows, error: rowsErr } = await supabase.from("listing_photos").select("id, path, thumb_path, position").eq("listing_id", id);
      if (rowsErr) throw rowsErr;
      const wanted = new Map(done.map((p, i) => [p.path!, i]));
      const stale = (rows ?? []).filter((r) => !wanted.has(r.path));
      if (stale.length) {
        const del = await supabase.from("listing_photos").delete().in("id", stale.map((r) => r.id));
        if (del.error) throw del.error;
        supabase.storage.from("listing-photos").remove(stale.flatMap((r) => [r.path, r.thumb_path].filter(Boolean) as string[])).then(() => {});
      }
      const have = new Map((rows ?? []).filter((r) => wanted.has(r.path)).map((r) => [r.path, r]));
      for (const [path, pos] of wanted) {
        const r = have.get(path);
        if (r && r.position !== pos) {
          const u = await supabase.from("listing_photos").update({ position: pos }).eq("id", r.id);
          if (u.error) throw u.error;
        }
      }
      const fresh = done.map((ph, i) => ({ ph, i })).filter(({ ph }) => !have.has(ph.path!));
      if (fresh.length) {
        const ins = await supabase
          .from("listing_photos")
          .insert(fresh.map(({ ph, i }) => ({ listing_id: id, path: ph.path!, thumb_path: ph.thumb_path ?? null, width: ph.width ?? null, height: ph.height ?? null, position: i })));
        if (ins.error) throw ins.error;
      }

      if (saveContact) await supabase.from("profile_contacts").upsert({ id: userId, phone, whatsapp }, { onConflict: "id" });
      if (isNew) AsyncStorage.removeItem(draftKey(userId)).catch(() => {});
      if (isNew) track("sell_published", { listing_id: id, photos: done.length, has_description: !!row.description, used_median: false });
      qc.invalidateQueries({ queryKey: ["my-ads"] });
      qc.invalidateQueries({ queryKey: ["listing", id] });
      qc.invalidateQueries({ queryKey: ["rail"] });
      qc.invalidateQueries({ queryKey: ["search"] });
      toast({ tone: "success", title: isNew ? "Your ad is live" : "Changes saved" });
      router.replace({ pathname: "/ad/[id]", params: { id: String(id), ...(isNew ? { posted: "1" } : {}) } });
    } catch (e) {
      const msg = (e as { message?: string }).message || "Something went wrong.";
      track("sell_failed", { mode, message: msg.slice(0, 80), live: liveAlready });
      setSubmitError(
        liveAlready || created.current
          ? `Your ad is live, but we couldn't finish saving everything (${msg}). Tap Publish again to retry; it won't post a duplicate.`
          : `${friendlyDb(msg)} Your draft is saved, so you can try again.`,
      );
      setPublishing(false);
    }
  };

  // ---------- options ----------
  const makeOptions = useMemo<Option<number>[]>(() => {
    const list = makes
      .filter((m) => !d.vehicle_type || m.vehicle_types.includes(d.vehicle_type))
      .map((m) => ({ value: m.id, label: m.name, group: m.is_popular ? "Popular" : "All makes" }))
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1));
    return [...list, { value: OTHER, label: "Other make", sub: "Not in the list", group: "All makes" }];
  }, [makes, d.vehicle_type]);
  const modelOptions = useMemo<Option<number>[]>(() => {
    if (!d.make_id) return [{ value: OTHER, label: "Other model" }];
    const list = models
      .filter((m) => m.make_id === d.make_id && (!d.vehicle_type || m.vehicle_type === d.vehicle_type))
      .map((m) => ({ value: m.id, label: m.name, group: m.is_popular ? "Popular" : "All models" }))
      .sort((a, b) => (a.group === b.group ? 0 : a.group === "Popular" ? -1 : 1));
    return [...list, { value: OTHER, label: "Other model", sub: "Not in the list" }];
  }, [models, d.make_id, d.vehicle_type]);

  const price = Number(digits(d.price_lkr)) || 0;
  const sp = spread.data;
  const med = sp?.median ?? null;
  const predicted = med && price && sp && sp.peer_count >= 4 ? (price <= med * 0.95 ? "good" : price >= med * 1.08 ? "high" : "fair") : null;

  const preview: Card = {
    id: 0,
    slug: "preview",
    title,
    vehicle_type: d.vehicle_type ?? "car",
    price_lkr: price,
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
    cover_thumb: d.photos[0]?.localUri ?? d.photos[0]?.thumb_path ?? null,
    photo_count: d.photos.length,
    price_rating: predicted,
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

  // ---------- steps ----------
  const stepVehicle = (
    <>
      <Field label="Type of vehicle" error={errors.vehicle_type}>
        <View style={styles.typeGrid} role="radiogroup">
          {VEHICLE_TYPES.map((t) => {
            const on = d.vehicle_type === t.slug;
            return (
              <Pressable
                key={t.slug}
                role="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t.name}
                onPress={() => {
                  if (d.vehicle_type !== t.slug) {
                    setD((p) => ({ ...p, vehicle_type: t.slug, make_id: null, make_other: "", model_id: null, model_other: "", body_type: null, transmission: NO_TRANSMISSION.includes(t.slug) ? null : p.transmission }));
                    setMakeOther(false);
                    setModelOther(false);
                    setErrors((e) => ({ ...e, vehicle_type: undefined }));
                  }
                }}
                style={[styles.typeTile, { borderColor: on ? c.brand : c.border, backgroundColor: on ? c.brandSoft : c.surface, borderWidth: on ? 2 : 1 }]}
              >
                <VehicleArt type={t.slug} width={56} color={on ? c.brandSoftFg : c.fgMuted} bg={on ? c.brandSoft : c.surface} />
                <Text variant="caption" weight="700" numberOfLines={1} style={on ? { color: c.brandSoftFg } : undefined}>
                  {t.short}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>
      <SelectField<number>
        label="Make"
        value={makeOther ? OTHER : d.make_id}
        options={makeOptions}
        disabled={!d.vehicle_type}
        placeholder={d.vehicle_type ? "Choose the make" : "Choose a type first"}
        error={errors.make_id}
        onChange={(v) => {
          const other = v === OTHER;
          setMakeOther(other);
          setModelOther(other);
          setD((p) => ({ ...p, make_id: other ? null : v, make_other: other ? p.make_other : "", model_id: null, model_other: "" }));
          setErrors((e) => ({ ...e, make_id: undefined, model_id: undefined }));
        }}
      />
      {makeOther && <Input placeholder="Type the make" value={d.make_other} maxLength={40} onChangeText={(t) => set("make_other", t)} accessibilityLabel="Make name" />}
      <SelectField<number>
        label="Model"
        value={modelOther ? OTHER : d.model_id}
        options={modelOptions}
        disabled={!d.make_id && !makeOther}
        placeholder={d.make_id || makeOther ? "Choose the model" : "Choose a make first"}
        error={errors.model_id}
        onChange={(v) => {
          const other = v === OTHER;
          setModelOther(other);
          setD((p) => {
            const m = models.find((x) => x.id === v);
            return { ...p, model_id: other ? null : v, model_other: other ? p.model_other : "", body_type: p.body_type ?? m?.body_type ?? null };
          });
          setErrors((e) => ({ ...e, model_id: undefined }));
        }}
      />
      {(modelOther || makeOther) && <Input placeholder="Type the model" value={d.model_other} maxLength={60} onChangeText={(t) => set("model_other", t)} accessibilityLabel="Model name" />}
      <Input label="Edition or grade" optional hint="For example G, S, X, Safety, Premium or Hybrid." value={d.trim_level} maxLength={60} onChangeText={(t) => set("trim_level", t)} placeholder="e.g. S Safety" />
      <Field label="Condition" error={errors.condition}>
        <View style={styles.stack} role="radiogroup">
          {CONDITIONS.map((o) => (
            <ChoiceCard key={o.value} title={o.label} hint={o.hint} selected={d.condition === o.value} onPress={() => set("condition", o.value)} />
          ))}
        </View>
      </Field>
      <View style={styles.pair}>
        <View style={styles.flex}>
          <SelectField label="Year made" value={d.year_manufactured || null} options={YEARS.map((y) => ({ value: y, label: y }))} error={errors.year_manufactured} placeholder="Year" onChange={(v) => set("year_manufactured", v ?? "")} />
        </View>
        <View style={styles.flex}>
          <SelectField
            label="Registered"
            optional={d.condition !== "used"}
            value={d.year_registered || null}
            options={YEARS.filter((y) => !d.year_manufactured || y >= d.year_manufactured).map((y) => ({ value: y, label: y }))}
            anyLabel="Not registered yet"
            error={errors.year_registered}
            placeholder="Year"
            onChange={(v) => set("year_registered", v ?? "")}
          />
        </View>
      </View>
    </>
  );

  const bodies = d.vehicle_type ? BODY_TYPES[d.vehicle_type] ?? [] : [];
  const stepDetails = (
    <>
      {d.condition !== "brand_new" && (
        <Input label="Mileage" keyboardType="number-pad" suffix="km" value={money(d.mileage_km)} onChangeText={(t) => set("mileage_km", digits(t))} placeholder="e.g. 85,000" error={errors.mileage_km} />
      )}
      <Input label="Engine capacity" optional keyboardType="number-pad" suffix="cc" value={d.engine_cc} onChangeText={(t) => set("engine_cc", digits(t).slice(0, 5))} placeholder="e.g. 1500" error={errors.engine_cc} />
      <Field label="Fuel" error={errors.fuel}>
        <View style={styles.wrap}>
          {FUELS.map((o) => (
            <Chip key={o.value} label={o.label} selected={d.fuel === o.value} onPress={() => set("fuel", o.value)} />
          ))}
        </View>
      </Field>
      {!NO_TRANSMISSION.includes(d.vehicle_type ?? "") && (
        <Field label="Transmission" error={errors.transmission}>
          <View style={styles.wrap}>
            {TRANSMISSIONS.map((o) => (
              <Chip key={o.value} label={o.label} selected={d.transmission === o.value} onPress={() => set("transmission", o.value)} />
            ))}
          </View>
        </Field>
      )}
      {bodies.length > 0 && (
        <Field label="Body type" optional>
          <View style={styles.wrap}>
            {bodies.map((o) => (
              <Chip key={o.value} label={o.label} selected={d.body_type === o.value} onPress={() => set("body_type", d.body_type === o.value ? null : o.value)} />
            ))}
          </View>
        </Field>
      )}
      <Field label="Colour" optional>
        <View style={styles.wrap} role="radiogroup">
          {COLOURS.map((col) => {
            const on = d.colour === col.name;
            return (
              <Pressable
                key={col.name}
                role="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={col.name}
                onPress={() => set("colour", on ? null : col.name)}
                style={[styles.colour, { borderColor: on ? c.brand : c.border, backgroundColor: on ? c.brandSoft : c.surface }]}
              >
                <View style={[styles.swatch, { backgroundColor: col.hex, borderColor: c.borderStrong }]} />
                <Text variant="small" weight="600">
                  {col.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>
      {d.condition === "used" && (
        <Field label="Previous owners" optional hint="Not counting you.">
          <View style={styles.wrap}>
            {["0", "1", "2", "3", "4"].map((n) => (
              <Chip key={n} label={n === "0" ? "None" : n === "4" ? "4+" : n} selected={d.previous_owners === n} onPress={() => set("previous_owners", d.previous_owners === n ? "" : n)} />
            ))}
          </View>
        </Field>
      )}
      <Field label="Features" optional>
        <View style={styles.wrap}>
          {FEATURES.map((f) => {
            const on = d.features.includes(f);
            return <Chip key={f} label={f} check selected={on} onPress={() => set("features", on ? d.features.filter((x) => x !== f) : [...d.features, f])} />;
          })}
        </View>
      </Field>
    </>
  );

  const stepPhotos = (
    <>
      <PhotoGrid userId={userId} folder={d.folder} photos={d.photos} onChange={(fn) => setD((p) => ({ ...p, photos: fn(p.photos) }))} />
      {!!errors.photos_pending && <Notice tone="danger" text={errors.photos_pending} />}
      {d.photos.length === 0 && <Notice tone="info" text="You can publish without photos, but ads with photos get many more calls. You can add them later too." />}
    </>
  );

  const stepPrice = (
    <>
      <Input
        label="Asking price"
        prefix="Rs"
        keyboardType="number-pad"
        value={money(d.price_lkr)}
        onChangeText={(t) => set("price_lkr", digits(t).slice(0, 10))}
        placeholder="e.g. 8,500,000"
        error={errors.price_lkr}
        hint={price >= 100_000 ? `${formatLakhs(price)}` : undefined}
      />
      {d.model_id ? (
        sp && sp.median != null ? (
          <View style={[styles.guide, { backgroundColor: c.surface2 }]}>
            <Text variant="body" weight="700">
              Similar {title.replace(/ \d{4}$/, "")} ads
            </Text>
            <Text variant="small" tone="muted">
              {sp.peer_count} live ads of the same model, condition and year (±1). Typical range {formatLKRCompact(sp.p25 ?? sp.min)} – {formatLKRCompact(sp.p75 ?? sp.max)}, median{" "}
              {formatLKRCompact(sp.median)}.
            </Text>
            {predicted && (
              <View style={styles.predict}>
                {predicted === "good" ? <TrendingDown size={18} color={c.good} /> : predicted === "high" ? <TrendingUp size={18} color={c.high} /> : <Minus size={18} color={c.fgMuted} />}
                <Text variant="small" weight="700" tone={predicted === "good" ? "good" : predicted === "high" ? "high" : "default"}>
                  {predicted === "good" ? "Buyers will see a Good price tag" : predicted === "high" ? "This is above the market; expect fewer calls" : "Buyers will see a Fair price tag"}
                </Text>
              </View>
            )}
            <Button title={`Use the median, ${formatLKR(sp.median)}`} variant="soft" size="sm" onPress={() => set("price_lkr", String(Math.round(sp.median! / 1000) * 1000))} style={styles.self} />
          </View>
        ) : spread.isLoading ? null : (
          <Notice tone="info" text="Not enough similar ads are live to suggest a price yet. Check the Search tab for comparable vehicles." />
        )
      ) : null}
      <SwitchRow label="Price is negotiable" value={d.negotiable} onChange={(v) => set("negotiable", v)} />
      <SwitchRow label="Leasing available" hint="You'll help a buyer arrange leasing" value={d.leasing_available} onChange={(v) => set("leasing_available", v)} />
      <SelectField<number>
        label="District"
        value={d.district_id}
        options={(cat.data?.districts ?? []).map((x) => ({ value: x.id, label: x.name, sub: x.name_si ?? undefined }))}
        error={errors.district_id}
        placeholder="Where is the vehicle?"
        onChange={(v) => {
          setD((p) => ({ ...p, district_id: v, city_id: null }));
          setErrors((e) => ({ ...e, district_id: undefined }));
        }}
      />
      {!!d.district_id && (
        <SelectField<number>
          label="Town"
          optional
          value={d.city_id}
          options={(cities.data ?? []).map((x) => ({ value: x.id, label: x.name, group: x.is_major ? "Main towns" : "Other towns" }))}
          anyLabel="Not specified"
          placeholder="Choose a town"
          onChange={(v) => set("city_id", v)}
        />
      )}
    </>
  );

  const stepContact = (
    <>
      <Input
        label="Description"
        optional
        multiline
        value={d.description}
        onChangeText={(t) => set("description", t)}
        maxLength={5000}
        placeholder="Service history, accident history, recent repairs, why you're selling…"
        error={errors.description}
        hint={`${d.description.length.toLocaleString("en-LK")} / 5,000`}
      />
      <Input label="Your name" optional value={d.seller_name} onChangeText={(t) => set("seller_name", t)} maxLength={60} placeholder="Shown with your number" autoComplete="name" />
      <Input
        label="Phone number"
        keyboardType="phone-pad"
        value={d.phone}
        onChangeText={(t) => set("phone", t)}
        placeholder="077 123 4567"
        autoComplete="tel"
        textContentType="telephoneNumber"
        error={errors.phone}
        hint="Only shown when a buyer taps to reveal it."
      />
      <Field label="WhatsApp">
        <View style={styles.wrap}>
          <Chip label="Same number" selected={d.whatsapp_mode === "same"} onPress={() => set("whatsapp_mode", "same")} />
          <Chip label="Different number" selected={d.whatsapp_mode === "other"} onPress={() => set("whatsapp_mode", "other")} />
          <Chip label="No WhatsApp" selected={d.whatsapp_mode === "none"} onPress={() => set("whatsapp_mode", "none")} />
        </View>
      </Field>
      {d.whatsapp_mode === "other" && (
        <Input label="WhatsApp number" keyboardType="phone-pad" value={d.whatsapp} onChangeText={(t) => set("whatsapp", t)} placeholder="077 123 4567" error={errors.whatsapp} />
      )}
      <SwitchRow label="Use these details next time" value={saveContact} onChange={setSaveContact} />
    </>
  );

  const summary: [string, string, number][] = [
    ["Vehicle", [title, d.condition ? label(CONDITIONS, d.condition) : null].filter(Boolean).join(" · "), 0],
    ["Details", [d.mileage_km ? `${money(d.mileage_km)} km` : null, d.fuel ? label(FUELS, d.fuel) : null, d.transmission ? label(TRANSMISSIONS, d.transmission) : null, d.colour].filter(Boolean).join(" · ") || "—", 1],
    ["Photos", d.photos.length ? `${d.photos.length} photo${d.photos.length === 1 ? "" : "s"}` : "No photos", 2],
    ["Price", [price ? formatLKR(price) : "—", d.negotiable ? "negotiable" : null].filter(Boolean).join(", "), 3],
    ["Location", [city?.name, district?.name].filter(Boolean).join(", ") || "—", 3],
    ["Contact", [d.phone, d.whatsapp_mode === "none" ? "no WhatsApp" : d.whatsapp_mode === "other" ? `WhatsApp ${d.whatsapp}` : "same number on WhatsApp"].filter(Boolean).join(" · "), 4],
  ];

  const stepReview = (
    <>
      <View pointerEvents="none">
        <ResultCard l={preview} source="preview" hideContact />
      </View>
      <View style={[styles.summary, { borderColor: c.border }]}>
        {summary.map(([k, v, s], i) => (
          <View key={k} style={[styles.sumRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <View style={styles.flex}>
              <Text variant="small" tone="subtle">
                {k}
              </Text>
              <Text variant="body" weight="600">
                {v}
              </Text>
            </View>
            <Pressable onPress={() => goto(s)} accessibilityRole="button" accessibilityLabel={`Edit ${k.toLowerCase()}`} hitSlop={8} style={styles.edit}>
              <Text variant="small" weight="700" tone="brand">
                Edit
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      {!!submitError && <Notice tone="danger" text={submitError} />}
    </>
  );

  const body: Record<StepId, ReactNode> = { vehicle: stepVehicle, details: stepDetails, photos: stepPhotos, price: stepPrice, contact: stepContact, review: stepReview };
  const errCount = Object.values(errors).filter(Boolean).length;
  const uploading = d.photos.some((p) => p.status === "processing" || p.status === "uploading");

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={exit} accessibilityRole="button" accessibilityLabel={mode === "edit" ? "Close without saving" : "Close and keep draft"} hitSlop={10} style={styles.headerBtn}>
            <X size={24} color={c.fg} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text variant="title" numberOfLines={1}>
              {mode === "edit" ? "Edit ad" : "Post an ad"}
            </Text>
            <Text variant="caption" tone="muted">
              Step {step + 1} of {STEPS.length} · {STEPS[step].title}
            </Text>
          </View>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}>
          {STEPS.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => (i < step || mode === "edit" ? goto(i) : undefined)}
              accessibilityLabel={`Step ${i + 1}: ${s.title}`}
              style={[styles.seg, { backgroundColor: i <= step ? c.brand : c.surface3 }]}
            />
          ))}
        </View>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {restored && step === 0 && (
          <View style={[styles.restored, { backgroundColor: c.brandSoft }]}>
            <Text variant="small" weight="600" style={[styles.flex, { color: c.brandSoftFg }]}>
              We restored your unfinished ad.
            </Text>
            <Pressable onPress={startOver} accessibilityRole="button" hitSlop={8} style={styles.inline}>
              <RotateCcw size={14} color={c.brandSoftFg} />
              <Text variant="small" weight="700" style={{ color: c.brandSoftFg }}>
                Start over
              </Text>
            </Pressable>
          </View>
        )}
        <Text variant="h2" accessibilityRole="header">
          {STEPS[step].heading}
        </Text>
        {errCount > 0 && current !== "photos" && <Notice tone="danger" text={errCount === 1 ? "Fix the highlighted field to continue." : `Fix the ${errCount} highlighted fields to continue.`} />}
        {body[current]}
        <View style={[styles.tip, { backgroundColor: c.accentSoft }]}>
          <Lightbulb size={18} color={c.accentFg} />
          <Text variant="small" style={[styles.flex, { color: c.accentFg }]}>
            {TIPS[current]}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: c.surface, borderTopColor: c.border }]}>
        <Button title={step === 0 ? "Cancel" : "Back"} variant="secondary" size="lg" icon={step === 0 ? undefined : <ArrowLeft size={18} color={c.fg} />} onPress={back} />
        {current === "review" ? (
          <Button title={mode === "edit" ? "Save changes" : "Publish ad"} size="lg" style={styles.flex} loading={publishing} icon={<Check size={18} color="#fff" />} onPress={publish} />
        ) : (
          <Button title={current === "photos" && uploading ? "Uploading…" : "Continue"} size="lg" style={styles.flex} disabled={current === "photos" && uploading} onPress={next} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function friendlyDb(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("10 live") || m.includes("limit")) return "You've reached the limit of 10 live ads for private sellers. Mark one as sold or remove it first.";
  if (m.includes("network") || m.includes("fetch")) return "No connection.";
  return msg;
}

function Field({ label: l, error, hint, optional, children }: { label: string; error?: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="small" weight="700">
        {l}
        {optional && (
          <Text variant="small" tone="subtle">
            {"  "}Optional
          </Text>
        )}
      </Text>
      {children}
      {error ? (
        <Text variant="small" tone="danger" role="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function ChoiceCard({ title, hint, selected, onPress }: { title: string; hint: string; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      role="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, { borderColor: selected ? c.brand : c.border, backgroundColor: selected ? c.brandSoft : c.surface, borderWidth: selected ? 2 : 1 }]}
    >
      <View style={[styles.radio, { borderColor: selected ? c.brand : c.borderStrong }]}>{selected && <View style={[styles.radioDot, { backgroundColor: c.brand }]} />}</View>
      <View style={styles.flex}>
        <Text variant="bodyLg" weight="700">
          {title}
        </Text>
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

function Notice({ tone, text }: { tone: "danger" | "info"; text: string }) {
  const c = useColors();
  return (
    <View style={[styles.notice, { backgroundColor: tone === "danger" ? c.dangerSoft : c.surface2 }]} role={tone === "danger" ? "alert" : undefined}>
      <Info size={18} color={tone === "danger" ? c.danger : c.fgMuted} />
      <Text variant="small" style={[styles.flex, { color: tone === "danger" ? c.danger : c.fgMuted }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, alignItems: "center" },
  progress: { flexDirection: "row", gap: 4, paddingHorizontal: 16, marginTop: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  content: { padding: 16, gap: 18, paddingBottom: 32, width: "100%", maxWidth: 720, alignSelf: "center" },
  restored: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.lg },
  inline: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 },
  flex: { flex: 1 },
  self: { alignSelf: "flex-start" },
  field: { gap: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeTile: { width: "31.5%", flexGrow: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.lg, gap: 2 },
  stack: { gap: 8 },
  pair: { flexDirection: "row", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  colour: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingLeft: 6, paddingRight: 12, minHeight: 36 },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth },
  choice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.xl },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  guide: { padding: 14, borderRadius: radius.xl, gap: 8 },
  predict: { flexDirection: "row", alignItems: "center", gap: 6 },
  summary: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  sumRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  edit: { minHeight: 36, minWidth: 44, alignItems: "flex-end", justifyContent: "center" },
  notice: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg, alignItems: "flex-start" },
  tip: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg, alignItems: "flex-start" },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
