import { useQuery } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { Store, UserRound } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { displayLkPhone, normalizeLkPhone } from "@shared/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { useCatalog, useCities } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { radius, useColors } from "@/lib/theme";
import { useSession } from "@/providers/session";

type Values = {
  display_name: string;
  account_type: "private" | "dealer";
  dealer_name: string;
  dealer_slug: string;
  dealer_about: string;
  dealer_address: string;
  district_id: number | null;
  city_id: number | null;
  phone: string;
  whatsapp: string;
  hasContacts: boolean;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

export default function ProfileScreen() {
  const { userId, ready } = useSession();
  const q = useQuery({
    queryKey: ["profile-form", userId],
    enabled: !!userId,
    gcTime: 0,
    queryFn: async (): Promise<Values> => {
      const [{ data: p }, { data: ct }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, account_type, dealer_name, dealer_slug, dealer_about, dealer_address, district_id, city_id")
          .eq("id", userId!)
          .maybeSingle(),
        supabase.from("profile_contacts").select("phone, whatsapp").eq("id", userId!).maybeSingle(),
      ]);
      return {
        display_name: p?.display_name ?? "",
        account_type: p?.account_type === "dealer" ? "dealer" : "private",
        dealer_name: p?.dealer_name ?? "",
        dealer_slug: p?.dealer_slug ?? "",
        dealer_about: p?.dealer_about ?? "",
        dealer_address: p?.dealer_address ?? "",
        district_id: p?.district_id ?? null,
        city_id: p?.city_id ?? null,
        phone: ct?.phone ? displayLkPhone(ct.phone) : "",
        whatsapp: ct?.whatsapp ? displayLkPhone(ct.whatsapp) : "",
        hasContacts: !!ct,
      };
    },
  });
  if (ready && !userId) return <Redirect href={{ pathname: "/signin", params: { next: "/profile" } }} />;
  if (!q.data || !userId) return <ActivityIndicator style={{ flex: 1 }} />;
  return <Form userId={userId} initial={q.data} />;
}

function Form({ userId, initial }: { userId: string; initial: Values }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { refreshProfile } = useSession();
  const cat = useCatalog();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const cities = useCities(v.district_id);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const err: typeof errors = {};
    if (v.account_type === "dealer") {
      if (!v.dealer_name.trim()) err.dealer_name = "Enter your business name.";
      if (!/^[a-z0-9-]{3,50}$/.test(v.dealer_slug)) err.dealer_slug = "Use 3 to 50 lowercase letters, numbers or dashes.";
    }
    if (v.phone && !normalizeLkPhone(v.phone)) err.phone = "Enter a valid Sri Lankan number.";
    if (v.whatsapp && !normalizeLkPhone(v.whatsapp)) err.whatsapp = "Enter a valid Sri Lankan number.";
    if (Object.keys(err).length) return setErrors(err);
    setSaving(true);
    const dealer = v.account_type === "dealer";
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: v.display_name.trim() || null,
        account_type: v.account_type,
        dealer_name: dealer ? v.dealer_name.trim() : null,
        dealer_slug: dealer ? v.dealer_slug : null,
        dealer_about: dealer ? v.dealer_about.trim() || null : null,
        dealer_address: dealer ? v.dealer_address.trim() || null : null,
        district_id: v.district_id,
        city_id: v.city_id,
      })
      .eq("id", userId);
    if (error) {
      setSaving(false);
      if (error.code === "23505") return setErrors({ dealer_slug: "That link is taken. Try another." });
      return toast({ tone: "error", title: error.message || "Couldn't save your profile" });
    }
    const phone = v.phone ? normalizeLkPhone(v.phone) : null;
    const whatsapp = v.whatsapp ? normalizeLkPhone(v.whatsapp) : null;
    if (phone || whatsapp || v.hasContacts) {
      const { error: contactErr } = await supabase.from("profile_contacts").upsert({ id: userId, phone, whatsapp }, { onConflict: "id" });
      if (contactErr) {
        setSaving(false);
        return toast({ tone: "error", title: "Couldn't save your contact details", body: "Your name and account settings were saved. Try again." });
      }
    }
    setSaving(false);
    await refreshProfile();
    toast({ tone: "success", title: "Profile saved" });
    router.back();
  };

  const changePassword = async () => {
    if (pw.length < 8) return setPwErr("Use at least 8 characters.");
    setPwBusy(true);
    setPwErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error) return setPwErr(error.message);
    setPw("");
    toast({ tone: "success", title: "Password updated" });
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Section title="About you">
          <Input
            label="Your name"
            value={v.display_name}
            onChangeText={(t) => set("display_name", t)}
            maxLength={60}
            placeholder="Shown to buyers and sellers"
            autoComplete="name"
          />
          <Text variant="small" weight="700">
            Account type
          </Text>
          <View style={styles.types} role="radiogroup">
            {(
              [
                ["private", "Private seller", "Up to 10 live ads", UserRound],
                ["dealer", "Dealer", "Unlimited ads and a dealer page", Store],
              ] as const
            ).map(([val, t, hint, I]) => {
              const on = v.account_type === val;
              return (
                <Pressable
                  key={val}
                  role="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    set("account_type", val);
                    if (val === "dealer" && !v.dealer_slug) set("dealer_slug", slugify(v.dealer_name || v.display_name));
                  }}
                  style={[styles.type, { borderColor: on ? c.brand : c.border, backgroundColor: on ? c.brandSoft : c.surface, borderWidth: on ? 2 : 1 }]}
                >
                  <I size={22} color={on ? c.brandSoftFg : c.fgMuted} />
                  <Text variant="body" weight="700">
                    {t}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <SelectField<number>
            label="District"
            optional
            value={v.district_id}
            options={(cat.data?.districts ?? []).map((d) => ({ value: d.id, label: d.name }))}
            anyLabel="Not set"
            onChange={(x) => {
              set("district_id", x);
              set("city_id", null);
            }}
          />
          {!!v.district_id && (
            <SelectField<number>
              label="Town"
              optional
              value={v.city_id}
              options={(cities.data ?? []).map((x) => ({ value: x.id, label: x.name }))}
              anyLabel="Not set"
              onChange={(x) => set("city_id", x)}
            />
          )}
        </Section>

        {v.account_type === "dealer" && (
          <Section title="Dealer page">
            <Input
              label="Business name"
              value={v.dealer_name}
              onChangeText={(t) => {
                set("dealer_name", t);
                if (!initial.dealer_slug) set("dealer_slug", slugify(t));
              }}
              maxLength={80}
              error={errors.dealer_name}
            />
            <Input
              label="Page link"
              prefix="/dealers/"
              value={v.dealer_slug}
              onChangeText={(t) => set("dealer_slug", slugify(t))}
              maxLength={50}
              autoCapitalize="none"
              error={errors.dealer_slug}
            />
            <Input
              label="About"
              optional
              multiline
              value={v.dealer_about}
              onChangeText={(t) => set("dealer_about", t)}
              maxLength={1000}
              placeholder="What you sell, opening hours, after-sales service…"
            />
            <Input label="Showroom address" optional value={v.dealer_address} onChangeText={(t) => set("dealer_address", t)} maxLength={200} />
          </Section>
        )}

        <Section title="Contact details" hint="Filled in for you when you post an ad. Buyers only see them when they tap to reveal.">
          <Input
            label="Phone"
            optional
            keyboardType="phone-pad"
            value={v.phone}
            onChangeText={(t) => set("phone", t)}
            placeholder="077 123 4567"
            error={errors.phone}
            autoComplete="tel"
          />
          <Input
            label="WhatsApp"
            optional
            keyboardType="phone-pad"
            value={v.whatsapp}
            onChangeText={(t) => set("whatsapp", t)}
            placeholder="077 123 4567"
            error={errors.whatsapp}
          />
        </Section>

        <Button title="Save profile" size="lg" full loading={saving} onPress={save} />

        <Section title="Password">
          <Input
            label="New password"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            value={pw}
            onChangeText={(t) => {
              setPw(t);
              setPwErr(null);
            }}
            placeholder="At least 8 characters"
            error={pwErr}
          />
          <Button title="Change password" variant="secondary" loading={pwBusy} disabled={!pw} onPress={changePassword} />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {!!hint && (
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 16, width: "100%", maxWidth: 720, alignSelf: "center" },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: 16, gap: 14 },
  types: { flexDirection: "row", gap: 10 },
  type: { flex: 1, padding: 12, borderRadius: radius.lg, gap: 4 },
});
