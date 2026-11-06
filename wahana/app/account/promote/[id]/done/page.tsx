import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PaymentStatus } from "./status";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

export default async function DonePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ order?: string }> }) {
  const { id } = await params;
  const { order } = await searchParams;
  await requireUser(`/account/promote/${id}`);
  return <PaymentStatus listingId={Number(id)} order={order ?? ""} />;
}
