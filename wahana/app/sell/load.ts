import "server-only";
import { createClient } from "@/lib/supabase/server";
import { displayLkPhone } from "@/lib/format";

export async function loadSellerDefaults(userId: string) {
  const db = await createClient();
  const [{ data: profile }, { data: contacts }] = await Promise.all([
    db.from("profiles").select("display_name, dealer_name, account_type").eq("id", userId).maybeSingle(),
    db.from("profile_contacts").select("phone, whatsapp").eq("id", userId).maybeSingle(),
  ]);
  return {
    name: (profile?.account_type === "dealer" ? profile.dealer_name : profile?.display_name) ?? "",
    phone: contacts?.phone ? displayLkPhone(contacts.phone) : "",
    whatsapp: contacts?.whatsapp ? displayLkPhone(contacts.whatsapp) : "",
    hasSaved: !!contacts?.phone,
  };
}
