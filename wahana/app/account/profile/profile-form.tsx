"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Store, User, KeyRound, ExternalLink } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCities } from "@/lib/catalog";
import { normalizeLkPhone } from "@/lib/format";
import type { District } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice";
import { Combobox } from "@/components/ui/combobox";
import { FieldError, Hint, Input, Label, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

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
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

function Card({ title, children, icon: I }: { title: string; children: React.ReactNode; icon: typeof User }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
        <I className="size-5 text-fg-muted" /> {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function ProfileForm({ userId, email, initial, districts, resetMode }: { userId: string; email: string; initial: Values; districts: District[]; resetMode: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const cities = useCities(v.district_id);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (v.account_type === "dealer") {
      if (!v.dealer_name.trim()) err.dealer_name = "Enter your business name.";
      if (!/^[a-z0-9-]{3,50}$/.test(v.dealer_slug)) err.dealer_slug = "Use 3 to 50 lowercase letters, numbers or dashes.";
    }
    if (v.phone && !normalizeLkPhone(v.phone)) err.phone = "Enter a valid Sri Lankan number.";
    if (v.whatsapp && !normalizeLkPhone(v.whatsapp)) err.whatsapp = "Enter a valid Sri Lankan number.";
    if (Object.keys(err).length) return setErrors(err);

    setSaving(true);
    const db = supabaseBrowser();
    const dealer = v.account_type === "dealer";
    const { error } = await db
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
    if (phone || whatsapp || v.hasContacts) await db.from("profile_contacts").upsert({ id: userId, phone, whatsapp }, { onConflict: "id" });
    setSaving(false);
    toast({ tone: "success", title: "Profile saved" });
    router.refresh();
  };

  const changePassword = async () => {
    if (pw.length < 8) return toast({ tone: "error", title: "Use at least 8 characters" });
    setPwBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error) return toast({ tone: "error", title: error.message });
    setPw("");
    toast({ tone: "success", title: "Password updated" });
    if (resetMode) router.replace("/account/profile");
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">Profile and settings</h1>
      <p className="mb-6 text-fg-muted">Signed in as {email}</p>

      {resetMode && (
        <div className="mb-6 rounded-3xl border border-brand/30 bg-brand-soft/50 p-5">
          <h2 className="font-bold">Choose a new password</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" aria-label="New password" autoFocus />
            <Button onClick={changePassword} loading={pwBusy} className="h-12 shrink-0">
              Save password
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        <Card title="About you" icon={User}>
          <div>
            <Label htmlFor="p-name">Your name</Label>
            <Input id="p-name" value={v.display_name} maxLength={60} onChange={(e) => set("display_name", e.target.value)} autoComplete="name" />
            <Hint>Shown on your ads and in chats.</Hint>
          </div>
          <div>
            <Label>Account type</Label>
            <ChoiceCards
              name="account_type"
              columns={2}
              value={v.account_type}
              onChange={(t) => {
                set("account_type", t);
                if (t === "dealer" && !v.dealer_name) set("dealer_name", v.display_name);
                if (t === "dealer" && !v.dealer_slug) set("dealer_slug", slugify(v.display_name));
              }}
              options={[
                { value: "private", label: "Private seller", hint: "Up to 10 live ads", icon: <User className="size-5" /> },
                { value: "dealer", label: "Dealer", hint: "Unlimited ads and a dealer page", icon: <Store className="size-5" /> },
              ]}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-district">District</Label>
              <Combobox
                id="p-district"
                options={districts.map((d) => ({ value: String(d.id), label: d.name, keywords: `${d.name_si ?? ""} ${d.name_ta ?? ""}` }))}
                value={v.district_id ? String(v.district_id) : null}
                onChange={(x) => {
                  set("district_id", x ? Number(x) : null);
                  set("city_id", null);
                }}
                placeholder="Choose district"
              />
            </div>
            <div>
              <Label htmlFor="p-city">Town</Label>
              <Combobox id="p-city" options={cities.map((c) => ({ value: String(c.id), label: c.name }))} value={v.city_id ? String(v.city_id) : null} onChange={(x) => set("city_id", x ? Number(x) : null)} disabled={!v.district_id} placeholder="Choose town" />
            </div>
          </div>
        </Card>

        {v.account_type === "dealer" && (
          <Card title="Dealer page" icon={Store}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-dname">Business name</Label>
                <Input id="p-dname" value={v.dealer_name} maxLength={80} aria-invalid={!!errors.dealer_name} onChange={(e) => set("dealer_name", e.target.value)} />
                <FieldError>{errors.dealer_name}</FieldError>
              </div>
              <div>
                <Label htmlFor="p-slug">Page link</Label>
                <Input id="p-slug" value={v.dealer_slug} maxLength={50} aria-invalid={!!errors.dealer_slug} onChange={(e) => set("dealer_slug", slugify(e.target.value))} leading={<span className="text-xs">/dealers/</span>} className="pl-[4.5rem]" />
                {errors.dealer_slug ? (
                  <FieldError>{errors.dealer_slug}</FieldError>
                ) : initial.dealer_slug ? (
                  <Hint>
                    <Link href={`/dealers/${initial.dealer_slug}`} className="inline-flex items-center gap-1 font-medium text-brand-text hover:underline">
                      View your page <ExternalLink className="size-3.5" />
                    </Link>
                  </Hint>
                ) : null}
              </div>
            </div>
            <div>
              <Label htmlFor="p-about" optional>
                About the business
              </Label>
              <Textarea id="p-about" rows={4} value={v.dealer_about} maxLength={1000} onChange={(e) => set("dealer_about", e.target.value)} placeholder="What you specialise in, opening hours, finance options…" />
            </div>
            <div>
              <Label htmlFor="p-addr" optional>
                Showroom address
              </Label>
              <Input id="p-addr" value={v.dealer_address} maxLength={200} onChange={(e) => set("dealer_address", e.target.value)} />
            </div>
          </Card>
        )}

        <Card title="Contact numbers" icon={KeyRound}>
          <p className="-mt-2 text-sm text-fg-muted">Used to fill in new ads. Buyers only see the number on each ad, and only when they tap to reveal it.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" type="tel" inputMode="tel" value={v.phone} aria-invalid={!!errors.phone} onChange={(e) => set("phone", e.target.value)} placeholder="077 123 4567" />
              <FieldError>{errors.phone}</FieldError>
            </div>
            <div>
              <Label htmlFor="p-wa" optional>
                WhatsApp
              </Label>
              <Input id="p-wa" type="tel" inputMode="tel" value={v.whatsapp} aria-invalid={!!errors.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="If different" />
              <FieldError>{errors.whatsapp}</FieldError>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      {!resetMode && (
        <section className="mt-8 rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-bold">Password</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password, at least 8 characters" aria-label="New password" />
            <Button variant="secondary" onClick={changePassword} loading={pwBusy} className="h-12 shrink-0" disabled={!pw}>
              Change password
            </Button>
          </div>
        </section>
      )}

      <form action="/auth/signout" method="post" className="mt-6">
        <Button type="submit" variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger">
          <LogOut className="size-4" /> Sign out
        </Button>
      </form>
    </div>
  );
}
