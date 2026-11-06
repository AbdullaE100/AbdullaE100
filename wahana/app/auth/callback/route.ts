import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Lands here from confirmation, magic-link and password-reset emails.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    // Opened in a different browser from the one that signed up: the email is
    // confirmed, they just need to sign in here.
    return NextResponse.redirect(new URL(`/signin?confirmed=1&next=${encodeURIComponent(next)}`, url.origin));
  }
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  const err = url.searchParams.get("error_description") || "That link has expired or was already used.";
  return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(err)}&next=${encodeURIComponent(next)}`, url.origin));
}
