import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getConversation } from "@/lib/conversations";
import { Thread } from "./thread";

export const metadata: Metadata = { title: "Chat", robots: { index: false } };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const user = await requireUser(`/messages/${id}`);
  const c = await getConversation(user.id, id);
  if (!c) notFound();
  return <Thread key={id} id={id} other={c.other} role={c.role} listing={c.listing} initial={c.messages} />;
}
