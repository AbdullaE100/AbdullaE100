import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SavedSearches } from "./saved-searches";

export const metadata: Metadata = { title: "Saved searches", robots: { index: false } };

export default async function SearchesPage() {
  await requireUser("/account/searches");
  const db = await createClient();
  const { data } = await db.from("saved_searches").select("id, label, query, last_checked_at, created_at").order("created_at", { ascending: false });
  return <SavedSearches initial={data ?? []} />;
}
