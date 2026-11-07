import { useQuery } from "@tanstack/react-query";
import { displayLkPhone } from "@shared/format";
import { emptyDraft, type Draft } from "@/lib/sell/draft";
import { supabase } from "@/lib/supabase";
import type { SellerDefaults } from "./wizard";

export function useSellerDefaults(userId: string | null) {
  return useQuery({
    queryKey: ["seller-defaults", userId],
    enabled: !!userId,
    queryFn: async (): Promise<SellerDefaults> => {
      const [{ data: profile }, { data: contacts }] = await Promise.all([
        supabase.from("profiles").select("display_name, dealer_name, account_type").eq("id", userId!).maybeSingle(),
        supabase.from("profile_contacts").select("phone, whatsapp").eq("id", userId!).maybeSingle(),
      ]);
      return {
        name: (profile?.account_type === "dealer" ? profile.dealer_name : profile?.display_name) ?? "",
        phone: contacts?.phone ? displayLkPhone(contacts.phone) : "",
        whatsapp: contacts?.whatsapp ? displayLkPhone(contacts.whatsapp) : "",
        hasSaved: !!contacts?.phone,
      };
    },
  });
}

/** Load one of the signed-in seller's ads as a draft for editing. */
export function useEditDraft(userId: string | null, id: number) {
  return useQuery({
    queryKey: ["edit-draft", id, userId],
    enabled: !!userId && id > 0,
    gcTime: 0,
    queryFn: async (): Promise<{ draft: Draft; status: string } | null> => {
      const { data: l, error } = await supabase
        .from("listings")
        .select("*, contact:listing_contacts(phone, whatsapp, seller_name), photos:listing_photos(id, path, thumb_path, width, height, position, created_at)")
        .eq("id", id)
        .eq("seller_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!l) return null;
      const contact = Array.isArray(l.contact) ? l.contact[0] : l.contact;
      const photos = [...(l.photos ?? [])].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
      const s = (n: number | null | undefined) => (n == null ? "" : String(n));
      const phone = contact?.phone ? displayLkPhone(contact.phone) : "";
      const wa = contact?.whatsapp ? displayLkPhone(contact.whatsapp) : "";
      const draft: Draft = {
        ...emptyDraft(),
        vehicle_type: l.vehicle_type,
        make_id: l.make_id,
        make_other: l.make_other ?? "",
        model_id: l.model_id,
        model_other: l.model_other ?? "",
        trim_level: l.trim_level ?? "",
        condition: l.condition as Draft["condition"],
        year_manufactured: s(l.year_manufactured),
        year_registered: s(l.year_registered),
        mileage_km: s(l.mileage_km),
        engine_cc: s(l.engine_cc),
        fuel: l.fuel,
        transmission: l.transmission,
        body_type: l.body_type,
        colour: l.colour,
        previous_owners: s(l.previous_owners),
        features: l.features ?? [],
        price_lkr: s(l.price_lkr),
        negotiable: l.negotiable,
        leasing_available: l.leasing_available,
        district_id: l.district_id,
        city_id: l.city_id,
        description: l.description ?? "",
        phone,
        whatsapp: wa && wa !== phone ? wa : "",
        whatsapp_mode: !wa ? "none" : wa === phone ? "same" : "other",
        seller_name: contact?.seller_name ?? "",
        photos: photos.map((p) => ({ key: p.id, id: p.id, status: "done" as const, path: p.path, thumb_path: p.thumb_path ?? undefined, width: p.width ?? undefined, height: p.height ?? undefined })),
        folder: `ad-${l.id}`,
      };
      return { draft, status: l.status };
    },
  });
}
