"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function supabaseBrowser() {
  client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
