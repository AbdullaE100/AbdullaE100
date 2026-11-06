import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/lib/database.types";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/** Per-request client that carries the signed-in user's session. */
export const createClient = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
});

/** Session-less client for public, cacheable data (reference tables, sitemaps). */
let publicClient: ReturnType<typeof createPlainClient<Database>> | null = null;
export function createPublicClient() {
  publicClient ??= createPlainClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

/** The signed-in user (verified against the auth server), or null. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});
