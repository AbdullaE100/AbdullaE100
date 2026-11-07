import type { Metadata } from "next";
import { ProsePage, Mail } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Legal" title="Privacy policy" intro={<>What we collect, why, and who can see it. In short: we only collect what the marketplace needs, and your number is never shown unless a buyer asks for it.</>}>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account:</strong> email address, password (stored hashed by our authentication provider), name, and whether you&apos;re a private seller or dealer.</li>
          <li><strong>Ads:</strong> vehicle details, photos, price, location (district and town), and the phone and WhatsApp numbers you add.</li>
          <li><strong>Messages:</strong> chats between buyers and sellers, and offers made in them.</li>
          <li><strong>Usage:</strong> ad views and number reveals. To stop abuse, number reveals are rate-limited using your account or a one-way hash of your IP address.</li>
          <li><strong>Payments:</strong> boost orders and their status. Card and mobile wallet details are handled by PayHere; we never see or store them.</li>
        </ul>
      </section>
      <section>
        <h2>Who can see what</h2>
        <ul>
          <li>Ads, your display name and dealer pages are public.</li>
          <li>Your phone number is shown only to someone who taps “Show phone number” on your ad.</li>
          <li>Messages are visible only to the buyer and seller in the conversation. Moderators may review reported content.</li>
          <li>Your email address is never shown to other users.</li>
        </ul>
      </section>
      <section>
        <h2>Where it&apos;s stored</h2>
        <p>Data is stored with Supabase, our database and hosting provider, protected by row-level security so each person can only reach their own private data.</p>
      </section>
      <section>
        <h2>Cookies and storage on your device</h2>
        <p>We use a cookie to keep you signed in. Your browser also stores ads you saved while signed out, recently viewed ads, your compare list and unfinished ad drafts. You can clear these at any time in your browser settings. We don&apos;t use advertising trackers.</p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>Sold and expired ads stay visible for 60 days so links keep working, then are hidden. Account data is kept while your account is open.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can edit or remove your ads and update your profile at any time. To get a copy of your data or close your account, email <Mail />.</p>
        {site.operator && <p>Data controller: {site.operator}.</p>}
      </section>
    </ProsePage>
  );
}
