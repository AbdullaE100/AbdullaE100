// PayHere server-to-server notification. Verifies the signature and amount,
// then applies the promotion with the service role.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { MERCHANT_ID, MERCHANT_SECRET, md5Upper } from "../_shared/payhere.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!MERCHANT_ID || !MERCHANT_SECRET) return new Response("Not configured", { status: 503 });

  const form = await req.formData();
  const f = (k: string) => String(form.get(k) ?? "");
  const [merchantId, orderId, paymentId, amount, currency, status, sig] = [
    f("merchant_id"), f("order_id"), f("payment_id"), f("payhere_amount"), f("payhere_currency"), f("status_code"), f("md5sig"),
  ];

  const expected = await md5Upper(merchantId + orderId + amount + currency + status + (await md5Upper(MERCHANT_SECRET)));
  if (merchantId !== MERCHANT_ID || sig !== expected) return new Response("Bad signature", { status: 400 });

  const { data: promo } = await admin.from("promotions").select("id, amount_lkr").eq("id", orderId).maybeSingle();
  if (!promo) return new Response("Unknown order", { status: 404 });
  if (status === "2" && (currency !== "LKR" || Number(amount) !== Number(promo.amount_lkr))) {
    return new Response("Amount mismatch", { status: 400 });
  }

  const { error } = await admin.rpc("apply_promotion", { p_promotion_id: orderId, p_payment_id: paymentId, p_status_code: status });
  if (error) return new Response(error.message, { status: 500 });
  return new Response("ok");
});
