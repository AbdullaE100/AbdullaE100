import { crypto } from "jsr:@std/crypto@1";
import { encodeHex } from "jsr:@std/encoding@1/hex";

export const MERCHANT_ID = Deno.env.get("PAYHERE_MERCHANT_ID") ?? "";
export const MERCHANT_SECRET = Deno.env.get("PAYHERE_MERCHANT_SECRET") ?? "";
export const SANDBOX = Deno.env.get("PAYHERE_SANDBOX") !== "false";
export const CHECKOUT_URL = SANDBOX ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";

export async function md5Upper(s: string) {
  const digest = await crypto.subtle.digest("MD5", new TextEncoder().encode(s));
  return encodeHex(digest).toUpperCase();
}

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
