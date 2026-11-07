import type { Metadata } from "next";
import { ProsePage, Mail } from "@/components/prose-page";

export const metadata: Metadata = { title: "Refund policy" };

export default function RefundsPage() {
  return (
    <ProsePage eyebrow="Legal" title="Refund policy" intro={<>Posting ads is free. This policy covers paid boosts: bump, top ad and urgent tag.</>}>
      <section>
        <h2>When you&apos;ll get a refund</h2>
        <ul>
          <li>You were charged but the boost never appeared on your ad.</li>
          <li>You were charged twice for the same order.</li>
          <li>We removed your ad by mistake while a boost was running.</li>
        </ul>
      </section>
      <section>
        <h2>When we can&apos;t refund</h2>
        <ul>
          <li>The boost was applied and ran, even if the vehicle didn&apos;t sell.</li>
          <li>You marked the ad as sold or removed it yourself during the boost.</li>
          <li>The ad was removed for breaking our <a href="/terms">terms</a>.</li>
        </ul>
      </section>
      <section>
        <h2>How to ask</h2>
        <p>Email <Mail /> within 14 days of payment with the ad link and the PayHere payment reference. We reply within 3 working days.</p>
        <p>Approved refunds go back to the original payment method through PayHere, usually within 5 to 10 working days depending on your bank.</p>
      </section>
    </ProsePage>
  );
}
