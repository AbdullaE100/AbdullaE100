import type { Metadata } from "next";
import { ShieldCheck, FileText, Banknote, Wrench, MessageCircle, Flag } from "lucide-react";

export const metadata: Metadata = {
  title: "Buying and selling safely",
  description: "How to avoid scams when buying or selling a vehicle in Sri Lanka: checking papers, payments and meeting safely.",
};

const SECTIONS = [
  {
    icon: Banknote,
    title: "Never pay in advance",
    points: [
      "Don't send a deposit or 'booking fee' for a vehicle you haven't seen in person.",
      "Be wary of prices far below the Good price range. If it looks too good to be true, it usually is.",
      "Pay through a bank transfer or bank draft when you sign the transfer papers, not before.",
    ],
  },
  {
    icon: FileText,
    title: "Check the papers",
    points: [
      "Ask to see the Certificate of Registration (CR book) and check the owner's name matches the seller's NIC.",
      "Match the chassis and engine numbers on the vehicle with the CR.",
      "Ask whether there's a lease or loan running. If so, it must be settled before ownership is transferred.",
      "Check the revenue licence and insurance are valid, and do the transfer at the Department of Motor Traffic.",
    ],
  },
  {
    icon: Wrench,
    title: "Inspect before you buy",
    points: [
      "Take a test drive, and bring a mechanic you trust or book an independent inspection.",
      "Ask for service records and look for signs of accident repairs or flood damage.",
      "For reconditioned vehicles, ask for the auction sheet and check the mileage on it.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Meet safely",
    points: [
      "Meet somewhere public and busy during the day, and bring someone with you.",
      "Keep the chat on Wahana until you're ready. Your number stays private until you share it.",
      "Sellers: don't hand over keys for a test drive without seeing the buyer's licence.",
    ],
  },
];

export default function SafetyPage() {
  return (
    <div className="container-page max-w-4xl py-6 sm:py-10">
      <span className="grid size-12 place-items-center rounded-2xl bg-good-soft text-good">
        <ShieldCheck className="size-6" />
      </span>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Buying and selling safely</h1>
      <p className="mt-2 text-fg-muted">Most people are genuine. These habits protect you from the few who aren&apos;t.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ icon: I, title, points }) => (
          <section key={title} className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2.5 text-lg font-bold">
              <I className="size-5 text-brand-text" /> {title}
            </h2>
            <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-fg-muted">
              {points.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-fg-subtle" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-5">
        <Flag className="mt-0.5 size-5 shrink-0 text-danger" />
        <p className="text-[15px]">
          <span className="font-semibold">Spotted something wrong?</span> <span className="text-fg-muted">Use “Report this ad” on any listing. Ads with several reports are hidden until a moderator checks them.</span>
        </p>
      </div>
    </div>
  );
}
