import type { Metadata } from "next";
import { Mail as MailIcon, Scale, MessageCircle, ShieldCheck } from "lucide-react";
import { ProsePage, Mail } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About and contact", description: `What ${site.name} is, how our price ratings work, and how to reach us.` };

export default function AboutPage() {
  return (
    <ProsePage eyebrow="About" title={`${site.name}.lk`} updated={false} intro={<>A vehicle marketplace built for Sri Lanka: fair prices you can see, sellers you can talk to, and ads that cost nothing to post.</>}>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Scale, t: "Price ratings", d: "Each ad is compared with live ads for the same model and condition, within a year either side." },
          { icon: MessageCircle, t: "Private chat", d: "Buyers and sellers talk in the app. Numbers are only shown when someone asks." },
          { icon: ShieldCheck, t: "Moderated", d: "Ads that several people report are hidden until a moderator checks them." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-2xl border border-border bg-surface p-4">
            <I className="size-5 text-brand-text" />
            <p className="mt-2 font-semibold">{t}</p>
            <p className="mt-1 text-sm text-fg-muted">{d}</p>
          </div>
        ))}
      </section>
      <section>
        <h2>How price ratings work</h2>
        <p>
          When there are at least four similar live ads, we work out their median price. An ad priced 5% or more below it is a <strong>Good price</strong>, 8% or more above is <strong>Above market</strong>, and anything in between is a <strong>Fair price</strong>. Ratings update as ads are posted, edited and sold.
        </p>
        <p>Ratings are a guide, not a valuation. Condition, service history and extras all matter, so always inspect the vehicle.</p>
      </section>
      <section>
        <h2>Contact us</h2>
        <p className="flex items-center gap-2">
          <MailIcon className="size-4 text-fg-muted" aria-hidden /> <Mail />
        </p>
        <p>To report a specific ad, use “Report this ad” on the ad page. It reaches our moderators fastest.</p>
        {site.operator && <p className="text-fg-muted">{site.name} is operated by {site.operator}.</p>}
      </section>
    </ProsePage>
  );
}
