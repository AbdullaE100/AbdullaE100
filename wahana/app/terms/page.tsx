import type { Metadata } from "next";
import { ProsePage, Mail } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Legal" title="Terms of use" intro={<>These terms apply when you use {site.name}. By creating an account or posting an ad, you agree to them.</>}>
      <section>
        <h2>1. What we do</h2>
        <p>{site.name} is a place for people and dealers in Sri Lanka to advertise vehicles and contact each other. We are not a party to any sale. Buyers and sellers are responsible for checking vehicles, documents and payment, and for completing the ownership transfer with the Department of Motor Traffic.</p>
      </section>
      <section>
        <h2>2. Your account</h2>
        <ul>
          <li>You must be 18 or older and give a working email address.</li>
          <li>Keep your password private. You are responsible for activity on your account.</li>
          <li>Dealer accounts must use their real business name.</li>
        </ul>
      </section>
      <section>
        <h2>3. Posting ads</h2>
        <ul>
          <li>Only advertise vehicles you own or are authorised to sell, that are physically in Sri Lanka and available now.</li>
          <li>Describe the vehicle honestly, including accident repairs, flood damage, ongoing leases and registration status.</li>
          <li>Use your own photos and a real price. Don&apos;t post the same vehicle more than once.</li>
          <li>Private sellers can have up to 10 live ads and post up to 10 ads a day. Ads stay live for 60 days and can be relisted.</li>
        </ul>
      </section>
      <section>
        <h2>4. Things you must not do</h2>
        <ul>
          <li>Ask for advance payments, deposits or “booking fees” for vehicles a buyer hasn&apos;t seen.</li>
          <li>Post stolen, unregistered-for-sale or misrepresented vehicles, or anything illegal.</li>
          <li>Harass other users, send spam, or copy ads and data from the site in bulk.</li>
        </ul>
        <p>We may remove ads, hide them for review, or suspend accounts that break these rules, and may share information with the police when the law requires it.</p>
      </section>
      <section>
        <h2>5. Paid boosts</h2>
        <p>Boosts (bump, top ad and urgent tag) are paid through PayHere and start as soon as payment is confirmed. Prices are shown before you pay. See the <a href="/refunds">refund policy</a> for when we refund.</p>
      </section>
      <section>
        <h2>6. Your content</h2>
        <p>You keep ownership of your photos and text. You allow us to show, resize and share them to promote your ad on {site.name} and in links to it, for as long as the ad is on the site.</p>
      </section>
      <section>
        <h2>7. Price ratings and tools</h2>
        <p>Price ratings, valuations and the leasing calculator are estimates based on ads on the site. They are not professional valuations or financial advice.</p>
      </section>
      <section>
        <h2>8. Liability</h2>
        <p>We provide the site as it is. To the extent the law allows, we are not liable for losses arising from dealings between users, including the condition, ownership or payment of any vehicle.</p>
      </section>
      <section>
        <h2>9. Changes and law</h2>
        <p>We may update these terms and will change the date above when we do. These terms are governed by the laws of Sri Lanka.</p>
        <p>Questions: <Mail /></p>
      </section>
    </ProsePage>
  );
}
