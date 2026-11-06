"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ButtonLink } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function PaymentStatus({ listingId, order }: { listingId: number; order: string }) {
  const [status, setStatus] = useState<"waiting" | "paid" | "failed" | "slow">("waiting");

  useEffect(() => {
    if (!order) return setStatus("failed");
    let tries = 0;
    const db = supabaseBrowser();
    const tick = async () => {
      const { data } = await db.from("promotions").select("status").eq("id", order).maybeSingle();
      if (data?.status === "paid") return setStatus("paid");
      if (data?.status === "failed" || data?.status === "cancelled") return setStatus("failed");
      if (++tries > 15) return setStatus("slow");
      timer = setTimeout(tick, 2000);
    };
    let timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [order]);

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      {status === "waiting" && (
        <>
          <Spinner className="mx-auto size-10 text-brand" />
          <h1 className="mt-5 text-2xl font-extrabold">Confirming your payment</h1>
          <p className="mt-2 text-fg-muted">This usually takes a few seconds.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto size-14 text-good" />
          <h1 className="mt-5 text-2xl font-extrabold">Your boost is live</h1>
          <p className="mt-2 text-fg-muted">Your ad has moved to the top. Thanks for using Wahana.</p>
          <ButtonLink href={`/ad/${listingId}`} className="mt-6">
            View your ad
          </ButtonLink>
        </>
      )}
      {status === "slow" && (
        <>
          <Spinner className="mx-auto size-10 text-fg-subtle" />
          <h1 className="mt-5 text-2xl font-extrabold">Still waiting for PayHere</h1>
          <p className="mt-2 text-fg-muted">If you were charged, your boost will switch on automatically within a few minutes.</p>
          <ButtonLink href="/account/ads" variant="secondary" className="mt-6">
            Back to my ads
          </ButtonLink>
        </>
      )}
      {status === "failed" && (
        <>
          <XCircle className="mx-auto size-14 text-danger" />
          <h1 className="mt-5 text-2xl font-extrabold">Payment didn&apos;t go through</h1>
          <p className="mt-2 text-fg-muted">You haven&apos;t been charged. You can try again.</p>
          <ButtonLink href={`/account/promote/${listingId}`} className="mt-6">
            Try again
          </ButtonLink>
        </>
      )}
    </div>
  );
}
