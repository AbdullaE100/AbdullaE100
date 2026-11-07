import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { SITE_URL } from "./env";
import { supabase } from "./supabase";

/**
 * Where email links (confirm sign-up, magic link) should land. On phones this
 * is the app itself (wahana://auth/callback), so tapping the link in the mail
 * app signs you straight in. Add it under Supabase → Auth → URL configuration
 * → Redirect URLs; until then Supabase falls back to the website.
 */
export function authRedirect(next = "/") {
  if (Platform.OS === "web") return `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
  return Linking.createURL("auth/callback", { queryParams: { next } });
}

/** Finish sign-in from a callback URL (implicit tokens in the hash, or a PKCE code). */
export async function completeAuthFromUrl(url: string): Promise<{ ok: true; next: string } | { ok: false; message: string }> {
  const [beforeHash, hash = ""] = url.split("#");
  const query = beforeHash.includes("?") ? beforeHash.slice(beforeHash.indexOf("?") + 1) : "";
  const q = new URLSearchParams(query);
  const h = new URLSearchParams(hash);
  const next = q.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const err = h.get("error_description") || q.get("error_description");
  if (err) return { ok: false, message: err.replace(/\+/g, " ") };
  const access_token = h.get("access_token");
  const refresh_token = h.get("refresh_token");
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return error ? { ok: false, message: error.message } : { ok: true, next: safeNext };
  }
  const code = q.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? { ok: false, message: error.message } : { ok: true, next: safeNext };
  }
  return { ok: false, message: "This link is incomplete. Open the latest email from Wahana, or sign in with your password." };
}
