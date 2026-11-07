import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getRef } from "@/lib/ref";
import { SellWizard } from "@/components/sell/wizard";
import { emptyDraft, type Draft } from "@/components/sell/draft";
import { ButtonLink } from "@/components/ui/button";
import { displayLkPhone } from "@/lib/format";
import { loadSellerDefaults } from "../load";

export const metadata: Metadata = { title: "Edit ad", robots: { index: false } };

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();
  const user = await getUser();
  if (!user) redirect(`/signin?next=/sell/${id}`);

  const db = await createClient();
  const { data: l } = await db
    .from("listings")
    .select("*, contact:listing_contacts(phone, whatsapp, seller_name), photos:listing_photos(id, path, thumb_path, width, height, position, created_at)")
    .eq("id", Number(id))
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!l) notFound();

  if (l.status === "removed" || l.status === "rejected") {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-extrabold">This ad can&apos;t be edited</h1>
        <p className="mt-2 text-fg-muted">It was {l.status === "removed" ? "removed" : "taken down by a moderator"}. You can post a new ad instead.</p>
        <ButtonLink href="/sell" className="mt-6">
          Post a new ad
        </ButtonLink>
      </div>
    );
  }

  const [catalog, defaults] = await Promise.all([getRef(), loadSellerDefaults(user.id)]);
  const contact = Array.isArray(l.contact) ? l.contact[0] : l.contact;
  const photos = [...(l.photos ?? [])].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  const s = (n: number | null | undefined) => (n == null ? "" : String(n));

  const initial: Draft = {
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
    phone: contact?.phone ? displayLkPhone(contact.phone) : defaults.phone,
    whatsapp: contact?.whatsapp ? displayLkPhone(contact.whatsapp) : "",
    whatsapp_mode: !contact || contact.whatsapp === contact.phone ? "same" : contact.whatsapp ? "other" : "none",
    seller_name: contact?.seller_name ?? defaults.name,
    photos: photos.map((p) => ({ key: p.id, id: p.id, status: "done", path: p.path, thumb_path: p.thumb_path ?? undefined, width: p.width ?? undefined, height: p.height ?? undefined })),
    folder: String(l.id),
  };

  return <SellWizard mode="edit" listingId={l.id} userId={user.id} initial={initial} catalog={catalog} defaultContact={{ ...defaults, hasSaved: true }} />;
}
