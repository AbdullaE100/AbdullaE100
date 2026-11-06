// Creates a pending promotion for the signed-in seller and returns the signed
// PayHere checkout form. Ownership and pricing are enforced by the
// create_promotion RPC, which runs as the calling user.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CHECKOUT_URL, MERCHANT_ID, MERCHANT_SECRET, cors, json, md5Upper } from "../_shared/payhere.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!MERCHANT_ID || !MERCHANT_SECRET) return json({ error: "payments_not_configured" }, 503);

  const db = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: auth } = await db.auth.getUser();
  const user = auth.user;
  if (!user) return json({ error: "Sign in first." }, 401);

  const { listing_id, product } = await req.json().catch(() => ({}));
  if (!Number.isInteger(listing_id) || typeof product !== "string") return json({ error: "Bad request" }, 400);

  const { data: promoId, error } = await db.rpc("create_promotion", { p_listing_id: listing_id, p_product: product });
  if (error) return json({ error: error.message }, 400);

  const [{ data: promo }, { data: item }, { data: profile }, { data: contact }] = await Promise.all([
    db.from("promotions").select("id, amount_lkr, listing_id").eq("id", promoId).single(),
    db.from("promotion_products").select("name").eq("slug", product).single(),
    db.from("profiles").select("display_name, dealer_name, account_type").eq("id", user.id).single(),
    db.from("listing_contacts").select("phone").eq("listing_id", listing_id).maybeSingle(),
  ]);
  if (!promo) return json({ error: "Couldn't create the order." }, 500);

  const amount = Number(promo.amount_lkr).toFixed(2);
  const hash = await md5Upper(MERCHANT_ID + promo.id + amount + "LKR" + (await md5Upper(MERCHANT_SECRET)));
  const name = ((profile?.account_type === "dealer" && profile.dealer_name) || profile?.display_name || "Wahana customer").trim();
  const [first, ...rest] = name.split(/\s+/);
  const origin = req.headers.get("origin") || SITE_URL;

  return json({
    action: CHECKOUT_URL,
    fields: {
      merchant_id: MERCHANT_ID,
      return_url: `${origin}/account/promote/${listing_id}/done?order=${promo.id}`,
      cancel_url: `${origin}/account/promote/${listing_id}?cancelled=1`,
      notify_url: `${SUPABASE_URL}/functions/v1/payhere-notify`,
      order_id: promo.id,
      items: item?.name ?? product,
      currency: "LKR",
      amount,
      first_name: first,
      last_name: rest.join(" ") || "-",
      email: user.email ?? "",
      phone: contact?.phone ?? "",
      address: "-",
      city: "-",
      country: "Sri Lanka",
      hash,
    },
  });
});
