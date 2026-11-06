import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRef } from "@/lib/ref";
import { displayLkPhone } from "@/lib/format";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile and settings", robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const user = await requireUser("/account/profile");
  const { reset } = await searchParams;
  const db = await createClient();
  const [{ data: profile }, { data: contacts }, ref] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    db.from("profile_contacts").select("phone, whatsapp").eq("id", user.id).maybeSingle(),
    getRef(),
  ]);
  return (
    <ProfileForm
      userId={user.id}
      email={user.email ?? ""}
      resetMode={!!reset}
      districts={ref.districts}
      initial={{
        display_name: profile?.display_name ?? "",
        account_type: (profile?.account_type as "private" | "dealer") ?? "private",
        dealer_name: profile?.dealer_name ?? "",
        dealer_slug: profile?.dealer_slug ?? "",
        dealer_about: profile?.dealer_about ?? "",
        dealer_address: profile?.dealer_address ?? "",
        district_id: profile?.district_id ?? null,
        city_id: profile?.city_id ?? null,
        phone: contacts?.phone ? displayLkPhone(contacts.phone) : "",
        whatsapp: contacts?.whatsapp ? displayLkPhone(contacts.whatsapp) : "",
        hasContacts: !!contacts,
      }}
    />
  );
}
