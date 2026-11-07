import type { Metadata } from "next";
import { Camera, Scale, ShieldCheck } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getRef } from "@/lib/ref";
import { SellWizard } from "@/components/sell/wizard";
import { AuthForm } from "@/components/auth-form";
import { loadSellerDefaults } from "./load";

export const metadata: Metadata = { title: "Post an ad", robots: { index: false } };

export default async function SellPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="container-page grid gap-10 py-8 sm:py-14 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold text-brand-text">Sell your vehicle</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Post an ad in a few minutes. It&apos;s free.</h1>
          <ul className="mt-6 space-y-4">
            {[
              { icon: Camera, t: "Snap photos on your phone", d: "We resize them for you, so they upload quickly even on mobile data." },
              { icon: Scale, t: "Price it right", d: "See what similar vehicles are listed for before you set your price." },
              { icon: ShieldCheck, t: "Stay in control", d: "Buyers can message you in the app. Your number is only shown when they ask." },
            ].map(({ icon: I, t, d }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-soft-fg">
                  <I className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-[15px] text-fg-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-bold">Sign in to start your ad</h2>
          <AuthForm next="/sell" initialMode="signup" />
        </div>
      </div>
    );
  }
  const [catalog, defaults] = await Promise.all([getRef(), loadSellerDefaults(user.id)]);
  return <SellWizard mode="create" userId={user.id} catalog={catalog} defaultContact={defaults} />;
}
